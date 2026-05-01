import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import whois from 'whois-json';
import dns from 'dns';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';
import pLimit from 'p-limit';
import ExifParser from 'exif-parser';

import { sites as masterSites } from './src/sites.ts';

// Configure axios retry
axiosRetry(axios, { 
  retries: 3, 
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
  }
});

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Custom API Keys Middleware
  app.use((req, res, next) => {
    let customKeys = req.headers['x-custom-api-keys'];
    
    // Also check body if not in header
    if (!customKeys && req.body && req.body.customApiKeys) {
      if (typeof req.body.customApiKeys === 'object') {
        (req as any).customApiKeys = req.body.customApiKeys;
        return next();
      }
      customKeys = req.body.customApiKeys;
    }

    if (customKeys) {
      try {
        const decoded = String(customKeys);
        if (decoded.trim().startsWith('{')) {
          (req as any).customApiKeys = JSON.parse(decoded);
        } else {
          try {
            const fromBase64 = Buffer.from(decoded, 'base64').toString('utf8');
            (req as any).customApiKeys = JSON.parse(fromBase64);
          } catch (e) {
            (req as any).customApiKeys = JSON.parse(decoded);
          }
        }
      } catch (e) {
        console.warn('Failed to parse custom API keys header:', e.message);
        (req as any).customApiKeys = {};
      }
    } else {
      (req as any).customApiKeys = {};
    }
    next();
  });

  const parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  app.get('/api/health', (req, res) => {
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.2.1',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      aiEngine: {
        configured: hasGeminiKey,
        provider: 'Google Gemini',
        model: 'gemini-3-flash'
      },
      network: {
        status: 'connected',
        latency: 'optimal'
      }
    });
  });

  app.get('/api/osint/metadata', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
      const response = await axios.get(String(url), {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': USER_AGENTS[0]
        }
      });

      const exifParser = ExifParser.create(response.data);
      const result = exifParser.parse();

      res.json({
        metadata: result.tags,
        imageSize: result.size,
        hasThumbnail: !!result.thumbnailOffset,
        gps: result.tags.GPSLatitude ? {
          lat: result.tags.GPSLatitude,
          lng: result.tags.GPSLongitude,
          alt: result.tags.GPSAltitude
        } : null
      });
    } catch (error) {
      console.error('[Metadata] Failed:', error.message);
      res.status(500).json({ error: 'Failed to extract metadata. File may not contain EXIF data or URL is inaccessible.' });
    }
  });

  // OSINT API Endpoints
  app.get('/api/osint/news', async (req, res) => {
    const feeds = [
      { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' },
      { name: 'Bleeping Computer', url: 'https://www.bleepingcomputer.com/feed/' },
      { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/' },
      { name: 'SANS ISC', url: 'https://isc.sans.edu/rssfeed.xml' },
      { name: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml' }
    ];

    try {
      const feedPromises = feeds.map(async (f) => {
        try {
          const feed = await axios.get(f.url, { 
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/rss+xml, application/xml, text/xml, */*',
              'Referer': 'https://www.google.com/'
            }
          });
          const parsed = await parser.parseString(feed.data);
          return parsed.items.map(item => ({
            ...item,
            source: f.name,
            sourceUrl: f.url
          }));
        } catch (e) {
          console.error(`Failed to fetch feed ${f.name}:`, e.message);
          return [];
        }
      });

      const allItems = (await Promise.all(feedPromises)).flat();
      
      // Sort by date descending
      const sortedItems = allItems.sort((a, b) => {
        const dateA = new Date(a.pubDate || a.isoDate || 0).getTime();
        const dateB = new Date(b.pubDate || b.isoDate || 0).getTime();
        return dateB - dateA;
      });

      res.json(sortedItems.slice(0, 50)); // Return top 50
    } catch (error) {
      console.error('News fetch error:', error.message || error);
      res.status(500).json({ error: 'Failed to fetch news feed' });
    }
  });

  app.get('/api/osint/whois', async (req, res) => {
    const { target } = req.query;
    if (!target) return res.status(400).json({ error: 'Target required' });
    
    let query = String(target).trim();
    
    // Remove protocol if present
    if (query.includes('://')) {
      try {
        const url = new URL(query);
        query = url.hostname;
      } catch (e) {
        query = query.split('://')[1].split('/')[0];
      }
    } else if (query.includes('/')) {
      query = query.split('/')[0];
    }

    // Handle email addresses
    if (query.includes('@')) {
      query = query.split('@')[1];
    }

    // Basic validation: must contain at least one dot and no spaces
    if (!query.includes('.') || query.includes(' ')) {
      return res.status(400).json({ error: 'Invalid domain for WHOIS lookup' });
    }

    // Strip common prefixes like 'www.' for better WHOIS compatibility
    if (query.startsWith('www.')) {
      query = query.substring(4);
    }
    
    console.log(`[WHOIS] Starting lookup for: ${query}`);
    
    try {
      let results: any = null;
      
      // 1. Try RDAP (Registration Data Access Protocol) first as it's more reliable JSON
      try {
        console.log(`[WHOIS] Trying RDAP for ${query}...`);
        const rdapResponse = await axios.get(`https://rdap.org/domain/${query}`, { 
          timeout: 8000, 
          validateStatus: () => true,
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (rdapResponse.status === 200 && rdapResponse.data && !rdapResponse.data.error) {
          results = rdapResponse.data;
          console.log(`[WHOIS] RDAP success for ${query}`);
        } else {
          console.warn(`[WHOIS] RDAP returned non-200 or error for ${query}: ${rdapResponse.status}`);
        }
      } catch (rdapErr: any) {
        console.warn(`[WHOIS] RDAP failed for ${query}:`, rdapErr.message);
      }

      // 2. Fallback to standard WHOIS lookup if RDAP failed
      if (!results) {
        console.log(`[WHOIS] Falling back to standard WHOIS for ${query}...`);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('WHOIS lookup timed out')), 15000)
        );
        
        try {
          // whois-json can sometimes hang, so we race it
          results = await Promise.race([whois(query), timeoutPromise]) as any;
          console.log(`[WHOIS] Standard WHOIS success for ${query}`);
        } catch (e: any) {
          console.error(`[WHOIS] Standard WHOIS failed for ${query}:`, e.message);
          
          // 3. Last ditch effort: Try another RDAP server directly if it's a common TLD
          try {
            const tld = query.split('.').pop()?.toLowerCase();
            let directRdapUrl = '';
            if (['com', 'net'].includes(tld || '')) directRdapUrl = `https://rdap.verisign.com/com/v1/domain/${query}`;
            else if (['org'].includes(tld || '')) directRdapUrl = `https://rdap.publicinterestregistry.net/rdap/domain/${query}`;
            else if (['info'].includes(tld || '')) directRdapUrl = `https://rdap.identitydigital.co/rdap/domain/${query}`;
            else if (['biz'].includes(tld || '')) directRdapUrl = `https://rdap.nic.biz/domain/${query}`;
            else if (['us'].includes(tld || '')) directRdapUrl = `https://rdap.nic.us/domain/${query}`;
            else if (['io'].includes(tld || '')) directRdapUrl = `https://rdap.nic.io/domain/${query}`;
            
            if (directRdapUrl) {
              console.log(`[WHOIS] Trying direct RDAP for ${query}: ${directRdapUrl}`);
              const directRes = await axios.get(directRdapUrl, { 
                timeout: 5000, 
                validateStatus: () => true,
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
              });
              if (directRes.status === 200 && directRes.data) {
                results = directRes.data;
                console.log(`[WHOIS] Direct RDAP success for ${query}`);
              }
            }
          } catch (directErr) {
            console.warn(`[WHOIS] Direct RDAP failed for ${query}`);
          }

          if (!results) throw e;
        }
      }
      
      // whois-json sometimes returns an empty object or an object with an error property
      if (!results || (Object.keys(results).length === 0 && !results.entities) || results.error) {
        console.warn(`[WHOIS] No data found for ${query}`);
        return res.status(404).json({ error: 'No WHOIS data found' });
      }
      
      res.json(results);
    } catch (error: any) {
      console.error(`[WHOIS] Final error for ${query}:`, error.message || error);
      
      // Handle specific "no whois server is known" error
      if (error.message && (error.message.includes('no whois server is known') || error.message.includes('lookup:') || error.message.includes('timed out'))) {
        return res.status(422).json({ error: error.message || `No WHOIS server known for TLD: .${query.split('.').pop()}` });
      }
      
      res.status(500).json({ error: `WHOIS lookup failed: ${error.message || 'Unknown error'}` });
    }
  });

  app.get('/api/osint/dns', async (req, res) => {
    const { target } = req.query;
    if (!target) return res.status(400).json({ error: 'Target required' });
    
    let query = String(target).trim();
    if (query.includes('://')) {
      try {
        const url = new URL(query);
        query = url.hostname;
      } catch (e) {
        query = query.split('://')[1].split('/')[0];
      }
    } else if (query.includes('/')) {
      query = query.split('/')[0];
    }
    if (query.includes('@')) {
      query = query.split('@')[1];
    }

    // Basic domain validation
    const isDomain = query.includes('.') && query.length > 3;
    if (!isDomain) {
      console.log(`[DNS] Skipping resolution for non-domain target: ${query}`);
      return res.status(400).json({ error: 'Target does not appear to be a valid domain name.' });
    }

    console.log(`[DNS] Starting lookup for: ${query}`);

    try {
      const results: any = {};
      const recordTypes: any[] = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'];
      
      const dnsPromises = recordTypes.map(async (type) => {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );
          
          const addresses = await Promise.race([
            dns.promises.resolve(query, type),
            timeoutPromise
          ]) as any[];
          
          return { type, data: addresses };
        } catch (err: any) {
          if (err.message !== 'Timeout' && err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
            console.warn(`[DNS] Error resolving ${type} for ${query}:`, err.code || err.message);
          }
          return { type, data: [] };
        }
      });

      const dnsResults = (await Promise.all(dnsPromises)) as any[];
      dnsResults.forEach((r: any) => {
        if (r.data && r.data.length > 0) {
          results[r.type] = r.data;
        }
      });

      // Fallback to Google DNS API if local resolution fails or returns nothing
      if (Object.keys(results).length === 0) {
        console.log(`[DNS] Local resolution returned nothing for ${query}, trying Google DNS fallback...`);
        try {
          const googleDnsRes = await axios.get(`https://dns.google/resolve?name=${query}&type=ANY`, { timeout: 6000 });
          if (googleDnsRes.data && googleDnsRes.data.Answer) {
            googleDnsRes.data.Answer.forEach((ans: any) => {
              const typeMap: any = { 1: 'A', 28: 'AAAA', 15: 'MX', 16: 'TXT', 2: 'NS', 5: 'CNAME', 6: 'SOA', 33: 'SRV', 257: 'CAA' };
              const typeName = typeMap[ans.type] || `TYPE_${ans.type}`;
              if (!results[typeName]) results[typeName] = [];
              
              // Google DNS data might need cleaning
              let data = ans.data;
              if (typeName === 'TXT' && data.startsWith('"') && data.endsWith('"')) {
                data = data.substring(1, data.length - 1);
              }
              results[typeName].push(data);
            });
            console.log(`[DNS] Google DNS fallback success for ${query}`);
          }
        } catch (e: any) {
          console.warn(`[DNS] Google DNS fallback failed for ${query}:`, e.message);
        }
      }

      // One last try with resolveAny if still nothing
      if (Object.keys(results).length === 0) {
        console.log(`[DNS] Trying resolveAny for ${query}...`);
        try {
          const anyResults = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => reject(new Error('resolveAny timed out')), 5000);
            dns.resolveAny(query, (err, addresses) => {
              clearTimeout(timeoutId);
              if (err) reject(err);
              else resolve(addresses);
            });
          });
          
          if (Array.isArray(anyResults) && anyResults.length > 0) {
            console.log(`[DNS] resolveAny success for ${query}`);
            return res.json({ ANY: anyResults });
          }
        } catch (e: any) {
          if (e.code !== 'ENOTFOUND' && e.code !== 'ENODATA') {
            console.warn(`[DNS] resolveAny failed for ${query}:`, e.message);
          }
        }
      }

      if (Object.keys(results).length === 0) {
        console.warn(`[DNS] No records found for ${query}`);
        return res.status(404).json({ error: 'No DNS records found. The domain might be inactive or invalid.' });
      }

      res.json(results);
    } catch (error: any) {
      console.error(`[DNS] Global error for ${query}:`, error.message || error);
      res.status(500).json({ error: `DNS name resolution failed: ${error.message || 'Unknown error'}` });
    }
  });

  app.get('/api/osint/wayback-timeline', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    let retries = 0;
    const maxRetries = 2;
    let lastError: any = null;

    while (retries <= maxRetries) {
      try {
        // Use Wayback CDX API to get snapshots
        const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url as string)}&output=json&fl=timestamp,statuscode&filter=statuscode:200&limit=500`;
        
        const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        
        const response = await axios.get(cdxUrl, { 
          timeout: 25000, // Increased timeout
          headers: {
            'User-Agent': userAgent,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          validateStatus: (status) => status < 500 // Don't throw on 4xx
        });
        
        if (response.status === 403 || response.status === 429) {
          console.warn(`Wayback CDX blocked/rate-limited (Status: ${response.status}). Retry ${retries + 1}/${maxRetries}`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 2000 * retries));
          continue;
        }

        if (response.status === 503) {
          console.warn(`Wayback CDX overloaded (503). Retry ${retries + 1}/${maxRetries}`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 3000 * retries));
          continue;
        }

        if (!response.data || !Array.isArray(response.data) || response.data.length <= 1) {
          return res.json({ firstSeen: null, lastSeen: null, count: 0, timeline: [] });
        }

        // CDX returns [["timestamp", "statuscode"], ["2021...", "200"], ...]
        const snapshots = response.data.slice(1);
        const timestamps = snapshots.map((s: string[]) => s[0]).sort();
        
        const firstSeen = timestamps[0];
        const lastSeen = timestamps[timestamps.length - 1];
        
        // Format timestamps (YYYYMMDDHHMMSS)
        const formatDate = (ts: string) => {
          const year = ts.substring(0, 4);
          const month = ts.substring(4, 6);
          const day = ts.substring(6, 8);
          return `${year}-${month}-${day}`;
        };

        return res.json({
          firstSeen: formatDate(firstSeen),
          lastSeen: formatDate(lastSeen),
          count: snapshots.length,
          timeline: timestamps.map(ts => ({
            timestamp: ts,
            formattedDate: formatDate(ts),
            status: '200',
            url: `https://web.archive.org/web/${ts}/${url}`
          }))
        });
      } catch (error: any) {
        lastError = error;
        console.error(`Wayback timeline attempt ${retries + 1} failed:`, error.message || error);
        retries++;
        if (retries <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }

    const status = lastError?.response?.status || 500;
    const message = lastError?.response?.data?.error || lastError?.message || 'Failed to fetch Wayback timeline';
    res.status(status).json({ error: `Wayback Error: ${message}` });
  });

  const searchLimit = pLimit(20); // Increased concurrency for general searches
  const socialLimit = pLimit(150); // Significantly increased concurrency for social scans
  
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function scrapeSearchEngines(query: string, depth = 0) {
    if (depth > 5) {
      console.log('Max search depth reached for query:', query);
      return [];
    }
    
    const isDork = query.includes('site:') || query.includes('filetype:') || query.includes('intitle:') || query.includes('inurl:');
    
    // Handle extremely long queries by chunking them
    // Google limit is ~32 words, and URL limit is ~2000 chars
    if (depth === 0 && query.length > 500 && (query.includes('OR') || query.includes('site:'))) {
      // Try to extract the base query (e.g., "username") and the dork parts
      let baseQuery = '';
      let dorkPart = query;
      
      // Handle queries like: "username" (site:a.com OR site:b.com)
      if (query.includes('(') && query.includes(')')) {
        const firstParen = query.indexOf('(');
        const lastParen = query.lastIndexOf(')');
        baseQuery = query.substring(0, firstParen).trim();
        dorkPart = query.substring(firstParen + 1, lastParen).trim();
      } else if (query.includes('site:')) {
        // If no parens but has site:, try to find the part before site:
        const firstSite = query.indexOf('site:');
        baseQuery = query.substring(0, firstSite).trim();
        dorkPart = query.substring(firstSite).trim();
      }

      // Improved regex to split by OR, +OR+, | with or without spaces
      const parts = dorkPart.split(/\s+OR\s+|\+OR\+|\s+\| \s+|OR\s+|\s+OR/i).filter(p => p.trim().length > 0);
      
      if (parts.length > 2) {
        console.log(`[Search] Chunking long query (${query.length} chars, ${parts.length} parts)`);
        const chunks: string[] = [];
        let currentChunk: string[] = [];
        let currentLen = baseQuery.length;
        
        // Google allows up to 32 words. site:example.com counts as 1 word.
        // We'll use 10 to be safe and keep URL length reasonable.
        for (const part of parts) {
          const partStr = part.trim();
          // Keep chunk length under 800 chars and under 10 dorks
          if ((currentLen + partStr.length + 10) > 800 || currentChunk.length >= 10) {
            if (currentChunk.length > 0) {
              const chunkQuery = baseQuery ? `${baseQuery} (${currentChunk.join(' OR ')})` : currentChunk.join(' OR ');
              chunks.push(chunkQuery);
            }
            currentChunk = [partStr];
            currentLen = baseQuery.length + partStr.length;
          } else {
            currentChunk.push(partStr);
            currentLen += partStr.length + 4; // +4 for " OR "
          }
        }
        if (currentChunk.length > 0) {
          const chunkQuery = baseQuery ? `${baseQuery} (${currentChunk.join(' OR ')})` : currentChunk.join(' OR ');
          chunks.push(chunkQuery);
        }
        
        console.log(`[Search] Split into ${chunks.length} chunks`);
        const allResults: any[] = [];
        
        // Process chunks in parallel with a limit
        // Use the imported pLimit function
        const chunkLimit = pLimit(5); 
        const chunkPromises = chunks.slice(0, 30).map(chunk => 
          chunkLimit(async () => {
            try {
              // Add jittered delay to avoid rate limits
              await sleep(Math.random() * 1000 + 500);
              return await scrapeSearchEngines(chunk, depth + 1);
            } catch (err) {
              console.error('[Search] Chunk search failed:', err.message || err);
              return [];
            }
          })
        );

        const chunkResultsArray = await Promise.all(chunkPromises);
        allResults.push(...chunkResultsArray.flat());
        
        // Deduplicate by link
        const uniqueResults = Array.from(new Map(allResults.map(r => [r.link, r])).values());
        console.log(`[Search] Total unique results from chunks: ${uniqueResults.length}`);
        return uniqueResults;
      }
    }

    const results: any[] = [];
    
    // Define search functions
    const searchGoogle = async () => {
      let googleResults: any[] = [];
      let googleRetries = 0;
      const maxGoogleRetries = 2;
      while (googleRetries <= maxGoogleRetries) {
        try {
          const waitTime = googleRetries === 0 ? (Math.random() * 500 + 200) : (Math.random() * 2000 * Math.pow(2, googleRetries));
          await sleep(waitTime);
          const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=30`, {
            headers: {
              'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Referer': 'https://www.google.com/',
              'Connection': 'keep-alive'
            },
            timeout: 8000,
            validateStatus: (status) => status < 500
          });
          if (response.status === 429) {
            googleRetries++;
            continue;
          }
          const $ = cheerio.load(response.data);
          const selectors = ['div.g', 'div.tF2Cxc', 'div.yuRUbf', 'div.kvH9C', 'div.MjjYud', 'div.sr__group', 'div.BNeawe'];
          selectors.forEach(selector => {
            $(selector).each((i, el) => {
              const title = $(el).find('h3, .vv778b, .BNeawe').first().text().trim();
              const link = $(el).find('a').first().attr('href');
              const snippet = $(el).find('div.VwiC3b, .st, div.kb0Bcb, div.LGOjbe, .BNeawe').first().text().trim();
              if (title && link && link.startsWith('http')) googleResults.push({ title, link, snippet, source: 'Google' });
            });
          });
          if (googleResults.length > 0) break;
          googleRetries++;
        } catch (e) { break; }
      }
      return googleResults;
    };

    const searchDDG = async () => {
      try {
        const response = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)], 'Referer': 'https://duckduckgo.com/' },
          timeout: 8000
        });
        const $ddg = cheerio.load(response.data);
        const ddgResults: any[] = [];
        $ddg('.result').each((i, el) => {
          const title = $ddg(el).find('.result__title').text().trim();
          const link = $ddg(el).find('.result__a').attr('href');
          const snippet = $ddg(el).find('.result__snippet').text().trim();
          if (title && link) {
            const finalLink = link.startsWith('//') ? 'https:' + link : link;
            ddgResults.push({ title, link: finalLink, snippet, source: 'DuckDuckGo' });
          }
        });
        return ddgResults;
      } catch (e) { return []; }
    };

    const searchBing = async () => {
      try {
        const response = await axios.get(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)], 'Referer': 'https://www.bing.com/' },
          timeout: 8000
        });
        const $bing = cheerio.load(response.data);
        const bingResults: any[] = [];
        $bing('.b_algo').each((i, el) => {
          const title = $bing(el).find('h2').text().trim();
          const link = $bing(el).find('a').attr('href');
          const snippet = $bing(el).find('.b_caption p').text().trim();
          if (title && link) bingResults.push({ title, link, snippet, source: 'Bing' });
        });
        return bingResults;
      } catch (e) { return []; }
    };

    const searchYahoo = async () => {
      try {
        const response = await axios.get(`https://search.yahoo.com/search?p=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)], 'Referer': 'https://search.yahoo.com/' },
          timeout: 8000
        });
        const $yahoo = cheerio.load(response.data);
        const yahooResults: any[] = [];
        $yahoo('.algo-sr').each((i, el) => {
          const title = $yahoo(el).find('h3').text().trim();
          const link = $yahoo(el).find('a').first().attr('href');
          const snippet = $yahoo(el).find('.compText').text().trim();
          if (title && link) yahooResults.push({ title, link, snippet, source: 'Yahoo' });
        });
        return yahooResults;
      } catch (e) { return []; }
    };

    // Run all searches in parallel with a slightly staggered start for stealth
    const [gRes, dRes, bRes, yRes] = await Promise.all([
      searchGoogle(),
      sleep(400).then(searchDDG),
      sleep(800).then(searchBing),
      sleep(1200).then(searchYahoo)
    ]);

    // Merge and deduplicate
    const allRaw = [...gRes, ...dRes, ...bRes, ...yRes];
    const uniqueMap = new Map();
    allRaw.forEach(r => {
      if (!uniqueMap.has(r.link)) uniqueMap.set(r.link, r);
    });
    
    return Array.from(uniqueMap.values());
  }

  const handleSearch = async (req: any, res: any) => {
    const q = req.query.q || req.body.q;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    try {
      const results = await scrapeSearchEngines(String(q));
      res.json(results);
    } catch (error) {
      console.error('Search error:', error.message || error);
      res.status(500).json({ error: 'Search failed' });
    }
  };

  app.get('/api/osint/search', handleSearch);
  app.post('/api/osint/search', handleSearch);

  app.get('/api/osint/article', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    try {
      const response = await axios.get(url as string, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Remove scripts, styles, etc.
      $('script, style, nav, footer, header, ads, .ads, #ads').remove();
      
      const title = $('h1').first().text() || $('title').text();
      let content = '';
      
      // Try to find main content
      const mainContent = $('article, main, .content, #content, .post-content').first();
      if (mainContent.length) {
        content = mainContent.html() || '';
      } else {
        // Fallback to all paragraphs
        $('p').each((i, el) => {
          content += `<p>${$(el).html()}</p>`;
        });
      }
      
      res.json({ title, content, url });
    } catch (error) {
      console.error('Article fetch error:', error.message || error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  app.get('/api/osint/proxy-tool', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    // URL Sanitization
    let sanitizedUrl = String(url);
    try {
      const urlObj = new URL(sanitizedUrl);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return res.status(400).json({ error: 'Invalid protocol' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
      const response = await axios.get(sanitizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 10000,
        validateStatus: () => true
      });
      
      if (!response.data || typeof response.data !== 'string') {
        return res.status(500).json({ error: 'Received invalid data from target URL' });
      }
      
      const $ = cheerio.load(response.data);
      const results: any[] = [];
      const baseUrl = new URL(sanitizedUrl).origin;

      // Extract Headers
      $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const text = $(el).text().trim();
        if (text) {
          results.push({ 
            type: 'header', 
            level: el.tagName, 
            text,
            importance: parseInt(el.tagName.substring(1))
          });
        }
      });
      
      // Extract Links
      $('a').each((i, el) => {
        const link = $(el).attr('href');
        const text = $(el).text().trim();
        if (link && !link.startsWith('#') && !link.startsWith('javascript:')) {
          try {
            const absoluteUrl = new URL(link, sanitizedUrl).href;
            results.push({ 
              type: 'link', 
              text: text || absoluteUrl, 
              href: absoluteUrl,
              isExternal: !absoluteUrl.startsWith(baseUrl)
            });
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      });

      // Extract Images
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        const alt = $(el).attr('alt')?.trim();
        if (src) {
          try {
            const absoluteSrc = new URL(src, sanitizedUrl).href;
            results.push({ 
              type: 'image', 
              text: alt || 'Unnamed Image', 
              src: absoluteSrc 
            });
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      });

      // Extract Tables
      $('table').each((i, el) => {
        const rows: any[] = [];
        $(el).find('tr').each((j, tr) => {
          const cells: string[] = [];
          $(tr).find('th, td').each((k, td) => {
            cells.push($(td).text().trim());
          });
          if (cells.length > 0) rows.push(cells);
        });
        if (rows.length > 0) {
          results.push({
            type: 'table',
            text: `Table with ${rows.length} rows`,
            data: rows
          });
        }
      });

      // Extract Lists
      $('ul, ol').each((i, el) => {
        const items: string[] = [];
        $(el).find('li').each((j, li) => {
          items.push($(li).text().trim());
        });
        if (items.length > 0) {
          results.push({
            type: 'list',
            text: `List with ${items.length} items`,
            data: items
          });
        }
      });
      
      // Extract Metadata
      const metadata: any = {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content'),
        keywords: $('meta[name="keywords"]').attr('content'),
        author: $('meta[name="author"]').attr('content')
      };

      res.json({
        url: sanitizedUrl,
        metadata,
        results: results.slice(0, 100) // Limit to 100 items for performance
      });
    } catch (error: any) {
      console.error('Proxy tool error:', error.message || error);
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      const isDnsError = error.code === 'EAI_AGAIN' || error.code === 'ENOTFOUND';
      
      res.status(500).json({ 
        error: isTimeout ? 'Request timed out. The target site might be slow or blocking our connection.' :
               isDnsError ? 'DNS resolution failed. The target domain might be invalid or temporarily unreachable.' :
               'Failed to proxy tool: ' + (error.message || 'Unknown error')
      });
    }
  });

  app.get('/api/osint/breach', async (req, res) => {
    const { target, tool } = req.query;
    if (!target) return res.status(400).json({ error: 'Target required' });
    
    try {
      // For now, we'll use our search engine scraper to find breach info if no API key is present
      // This is more reliable than proxying the main site which often has anti-bot protections
      const query = tool === 'leakcheck' 
        ? `site:leakcheck.io "${target}"` 
        : tool === 'hibp' 
          ? `site:haveibeenpwned.com "${target}"`
          : `"${target}" data breach leak`;
          
      const searchResults = await scrapeSearchEngines(query);
      res.json(searchResults);
    } catch (error) {
      console.error('Breach search error:', error.message || error);
      res.status(500).json({ error: 'Breach search failed' });
    }
  });

  app.get('/api/osint/social', async (req, res) => {
    let { target, limit: queryLimit, tool } = req.query;
    if (!target) return res.status(400).json({ error: 'Username required' });
    
    let username = String(target);
    if (username.includes('@')) {
      username = username.split('@')[0];
    }

    const allSites = masterSites.map(site => ({
      ...site,
      url: site.url.replace('{}', username)
    }));

    let sites: any[] = [];
    if (tool === 'sherlock') {
      sites = allSites.filter(s => ['Social', 'Creative', 'Tech'].includes(s.category));
    } else if (tool === 'maigret') {
      sites = [...allSites, { name: 'NexusMods', url: `https://www.nexusmods.com/users/${username}`, category: 'Gaming' }];
    } else {
      sites = allSites;
    }

    // Deduplicate sites by name to prevent React key errors
    const seenNames = new Set();
    sites = sites.filter(site => {
      if (seenNames.has(site.name)) {
        return false;
      }
      seenNames.add(site.name);
      return true;
    });

    if (queryLimit) {
      const limitVal = parseInt(String(queryLimit));
      if (!isNaN(limitVal) && limitVal > 0) {
        sites = sites.slice(0, limitVal);
      }
    }

    let isCancelled = false;
    req.on('close', () => {
      isCancelled = true;
    });

    // Add a global timeout for the social scan to prevent hangs (3 minutes)
    let timeoutId: any;
    const startTime = Date.now();
    const maxExecutionTime = 170000; // 170 seconds, just before the 180s global limit

    const majorSites = ['GitHub', 'Twitter', 'Instagram', 'Reddit', 'Facebook', 'TikTok', 'Pinterest', 'Tumblr', 'LinkedIn', 'YouTube', 'Twitch', 'Snapchat', 'Telegram', 'Discord'];
    sites.sort((a, b) => {
      const aMajor = majorSites.includes(a.name) ? 0 : 1;
      const bMajor = majorSites.includes(b.name) ? 0 : 1;
      return aMajor - bMajor;
    });

    const socialAxios = axios.create({
      timeout: 3500, // Reduced from 4500
      validateStatus: () => true,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      }
    });

    try {
      const results = await Promise.all(sites.map((site, index) => socialLimit(async () => {
        if (isCancelled) return { name: site.name, url: site.url, category: site.category, status: 'Cancelled' };
        
        // Add a very small staggered delay to prevent bursts
        if (index > 0) await sleep(50 + (index % 10) * 10);

        // Check if we are approaching the global timeout
        if (Date.now() - startTime > maxExecutionTime) {
          return { name: site.name, url: site.url, category: site.category, status: 'Timed Out' };
        }

        try {
          const response = await socialAxios.get(site.url, { 
            maxContentLength: 250000, 
            headers: {
              'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
            }
          });
        
        // Improved detection logic
        let isFound = response.status === 200;
        let isRedirectedToGeneric = false;
        const body = response.data ? String(response.data) : '';
        const bodyLower = body.toLowerCase();
        const finalUrl = response.request?.res?.responseUrl || site.url;
        
        // If redirected to a generic page, it's likely not found or deleted
        if (isFound && finalUrl !== site.url) {
          const urlObj = new URL(finalUrl);
          if (urlObj.pathname === '/' || urlObj.pathname === '/login' || urlObj.pathname === '/signup' || urlObj.pathname.includes('error')) {
            isFound = false;
            isRedirectedToGeneric = true;
          }
        }

          if (isFound) {
          // Common "Not Found" strings
          const notFoundStrings = [
            'account doesn’t exist',
            'sorry, this page isn\'t available',
            'user not found',
            'not found',
            'page not found',
            'profile not found',
            'doesn\'t exist',
            'could not find',
            'no results found',
            'invalid user',
            'user does not exist',
            'error 404',
            '404 not found',
            'this page could not be found',
            'the page you requested was not found',
            'user_not_found',
            'member not found',
            'profile_not_found',
            'no account found',
            'account not found',
            'user is not available',
            'this user could not be found',
            'we couldn\'t find that page',
            'the user you are looking for does not exist',
            'this profile is not available',
            'no such user',
            'user is currently unavailable',
            'the page you are looking for doesn\'t exist',
            'this user is not available',
            'could not find the user',
            'user does not exist',
            'nothing here',
            'out of nothing',
            'can\'t find that user',
            'nothing to see here',
            'this profile is private',
            'this account is private',
            'page unavailable',
            'this page is unavailable',
            'profile not available',
            'account has been deleted',
            'user has been deleted',
            'account suspended',
            'user suspended',
            'page not found',
            '404: not found',
            'sorry, we couldn\'t find that',
            'this user doesn\'t have any posts yet',
            'no results for',
            'search returned no results',
            'profile is currently hidden',
            'user is inactive',
            'this page does not exist',
            'check the url',
            'invalid profile',
            'no such profile',
            'profile is unavailable',
            'user is unavailable',
            'page is unavailable',
            'content not found',
            'resource not found',
            'the requested user was not found',
            'we can\'t find the page you\'re looking for',
            'this user hasn\'t joined yet',
            'invite this user',
            'user not registered',
            'not a registered user',
            'username is available',
            'choose a username',
            'registration',
            'sign up to claim',
            'is available!',
            'coming soon',
            'under construction'
          ];

          if (notFoundStrings.some(str => bodyLower.includes(str))) {
            isFound = false;
          }

          // Site-specific overrides
          if (site.name === 'Twitter' && (bodyLower.includes('this account doesn’t exist') || bodyLower.includes('account suspended') || bodyLower.includes('page not found'))) isFound = false;
          if (site.name === 'Instagram' && (bodyLower.includes('sorry, this page isn\'t available') || bodyLower.includes('link you followed may be broken') || bodyLower.includes('page not found'))) isFound = false;
          if (site.name === 'Reddit' && (bodyLower.includes('user not found') || bodyLower.includes('nobody on reddit goes by that name'))) isFound = false;
          if (site.name === 'TikTok' && (bodyLower.includes('couldn\'t find this account') || bodyLower.includes('this account is private'))) isFound = false;
          if (site.name === 'Snapchat' && (bodyLower.includes('not found') || bodyLower.includes('add friends'))) isFound = false;
          if (site.name === 'Pinterest' && (bodyLower.includes('user not found') || bodyLower.includes('resource not found') || bodyLower.includes('page not found'))) isFound = false;
          if (site.name === 'Steam' && (bodyLower.includes('the specified profile could not be found') || bodyLower.includes('id not found'))) isFound = false;
          if (site.name === 'Twitch' && (bodyLower.includes('content is not available') || bodyLower.includes('unless you have a time machine') || bodyLower.includes('page not found'))) isFound = false;
          if (site.name === 'GitHub' && (bodyLower.includes('not found') || bodyLower.includes('404') || bodyLower.includes('find code, projects'))) isFound = false;
          if (site.name === 'Facebook' && (bodyLower.includes('content isn\'t available') || bodyLower.includes('link you followed may be broken') || bodyLower.includes('log in or sign up'))) isFound = false;
          if (site.name === 'LinkedIn' && (bodyLower.includes('page not found') || bodyLower.includes('profile not found') || bodyLower.includes('authwall'))) isFound = false;
          if (site.name === 'Tumblr' && (bodyLower.includes('nothing here') || bodyLower.includes('404') || bodyLower.includes('not found'))) isFound = false;
          if (site.name === 'Medium' && (bodyLower.includes('out of nothing') || bodyLower.includes('404') || bodyLower.includes('not found'))) isFound = false;
          if (site.name === 'SoundCloud' && (bodyLower.includes('can\'t find that user') || bodyLower.includes('404') || bodyLower.includes('not found'))) isFound = false;
          if (site.name === 'Vimeo' && (bodyLower.includes('not found') || bodyLower.includes('404') || bodyLower.includes('not found'))) isFound = false;
          if (site.name === 'Behance' && (bodyLower.includes('could not be found') || bodyLower.includes('404') || bodyLower.includes('not found'))) isFound = false;
          if (site.name === 'Dribbble' && (bodyLower.includes('not found') || bodyLower.includes('404') || bodyLower.includes('not found'))) isFound = false;
          if (site.name === 'Flickr' && (bodyLower.includes('not found') || bodyLower.includes('404') || bodyLower.includes('not found'))) isFound = false;
          if (site.name === 'Patreon' && (bodyLower.includes('not found') || bodyLower.includes('404') || bodyLower.includes('not found'))) isFound = false;
          if (site.name === 'OnlyFans' && (bodyLower.includes('not found') || bodyLower.includes('404') || bodyLower.includes('not found'))) isFound = false;
        }

        let confidence = 0;
        if (isFound) {
          const $ = cheerio.load(body);
          const title = $('title').text().toLowerCase();
          const metaDesc = $('meta[name="description"]').attr('content')?.toLowerCase() || '';
          const metaOgTitle = $('meta[property="og:title"]').attr('content')?.toLowerCase() || '';
          const metaOgDesc = $('meta[property="og:description"]').attr('content')?.toLowerCase() || '';
          
          const usernameLower = username.toLowerCase();
          const inTitle = title.includes(usernameLower);
          const inMeta = metaDesc.includes(usernameLower) || metaOgTitle.includes(usernameLower) || metaOgDesc.includes(usernameLower);
          
          // Anti-false-positive: If title or meta contains "not found", "search", etc.
          const falsePositiveKeywords = ['not found', 'search', 'results', 'finding', 'lookup', 'directory', '404', 'error', 'sign up', 'login', 'join'];
          const titleIsBad = falsePositiveKeywords.some(kw => title.includes(kw));
          const metaIsBad = falsePositiveKeywords.some(kw => metaDesc.includes(kw) || metaOgDesc.includes(kw));

          if (inTitle && !titleIsBad) confidence += 50;
          if (inMeta && !metaIsBad) confidence += 30;
          if (bodyLower.includes(`/${usernameLower}`)) confidence += 20;

          // If title says "Not Found" but contains username, it's a 404 page reflecting input
          if (inTitle && titleIsBad) confidence = 0;

          const hasUsernameInMeta = inTitle || inMeta;
          
          if (!hasUsernameInMeta) {
            const usernameRegex = new RegExp(`\\b${usernameLower}\\b`, 'i');
            if (!usernameRegex.test(bodyLower) && !bodyLower.includes(`/${usernameLower}`)) {
              isFound = false;
            } else {
              confidence += 10;
            }
          }

          const loginKeywords = [
            'login to continue', 'sign up to see', 'create an account', 
            'log in to your account', 'please log in', 'you must be logged in',
            'sign in to', 'join now to', 'create your profile', 'start your trial'
          ];
          
          if (loginKeywords.some(kw => bodyLower.includes(kw)) && body.length < 20000) {
            if (!inTitle || titleIsBad) {
              isFound = false;
            } else {
              confidence -= 30;
            }
          }
          
          const searchKeywords = ['search results for', 'results for', 'showing results for', 'no results found for', 'find users', 'user search', 'browser search'];
          if (searchKeywords.some(kw => bodyLower.includes(kw)) && !inTitle) {
            isFound = false;
          }
        }

        // Filter out low confidence results unless they are site-specific overrides
        // Higher threshold to prevent false positives for fake/common names
        if (isFound && confidence < 40 && !['Twitter', 'GitHub', 'Instagram', 'Reddit'].includes(site.name)) {
          isFound = false;
        }

        let finalStatus = isFound ? 'Found' : (isRedirectedToGeneric ? 'Possible but Deleted' : 'Not Found');
        
        // Basic Profile Extraction for popular sites
        let bio = '';
        let followers = '';
        let posts = '';
        let avatar = '';

        if (isFound) {
          const $ = cheerio.load(body);
          const metaDesc = $('meta[name="description"]').attr('content') || '';
          const ogDesc = $('meta[property="og:description"]').attr('content') || '';
          const ogImage = $('meta[property="og:image"]').attr('content') || '';
          
          avatar = ogImage;

          if (site.name === 'GitHub') {
            bio = $('.p-note.user-profile-bio').text().trim();
            followers = $('.Link--secondary.no-underline.no-wrap').first().text().trim();
            avatar = $('.avatar.avatar-user').attr('src') || avatar;
            const repoCount = $('.Counter').first().text().trim();
            if (repoCount) posts = `${repoCount} Repos`;
          } else if (site.name === 'Twitter' || site.name === 'x.com') {
            bio = metaDesc.replace(/^The latest Tweets from .*?\(@.*?\)\. /, '');
            const followMatch = body.match(/(\d+[,.]?\d*[KMB]?)\s*Followers/i);
            if (followMatch) followers = followMatch[1];
          } else if (site.name === 'Instagram') {
            const parts = ogDesc.split(' - ')[0]?.split(', ');
            if (parts && parts.length >= 3) {
              followers = parts[0].replace(' Followers', '');
              posts = parts[2].replace(' Posts', '');
            }
            bio = ogDesc.split(' - ')[1] || '';
          } else if (site.name === 'Reddit') {
            bio = metaDesc;
            const karmaMatch = body.match(/(\d+[,.]?\d*)\s*karma/i);
            if (karmaMatch) followers = `${karmaMatch[1]} Karma`;
          } else if (site.name === 'YouTube') {
            bio = metaDesc;
            const subMatch = body.match(/(\d+[,.]?\d*[KMB]?)\s*subscribers/i);
            if (subMatch) followers = `${subMatch[1]} Subs`;
          } else if (site.name === 'TikTok') {
            const statsMatch = metaDesc.match(/([\d.KMB]+)\s*Likes\.\s*([\d.KMB]+)\s*Followers/i);
            if (statsMatch) {
              followers = statsMatch[2];
              posts = `${statsMatch[1]} Likes`;
            }
            bio = metaDesc.split('|')[0]?.trim() || '';
          } else if (site.name === 'Pinterest') {
            bio = metaDesc;
            const followMatch = body.match(/([\d.KMB]+)\s*followers/i);
            if (followMatch) followers = followMatch[1];
          } else if (site.name === 'Twitch') {
            bio = metaDesc;
            const followMatch = body.match(/([\d.KMB]+)\s*followers/i);
            if (followMatch) followers = followMatch[1];
          } else if (site.name === 'Steam') {
            bio = $('.profile_summary').text().trim();
            avatar = $('.playerAvatarAutoSizeInner img').attr('src') || avatar;
            const levelMatch = $('.friendPlayerLevelNum').text().trim();
            if (levelMatch) followers = `Level ${levelMatch}`;
          } else if (site.name === 'Telegram') {
            bio = $('.tgme_page_description').text().trim() || ogDesc;
            const extra = $('.tgme_page_extra').text().trim();
            if (extra) followers = extra;
          } else if (site.name === 'Snapchat') {
            bio = metaDesc;
          } else if (site.name === 'Facebook') {
            bio = metaDesc;
            const followMatch = body.match(/([\d.KMB]+)\s*people follow this/i);
            if (followMatch) followers = followMatch[1];
          } else if (site.name === 'Discord') {
            bio = metaDesc;
          } else {
            bio = metaDesc || ogDesc;
          }
        }

        return { 
          name: site.name, 
          url: site.url, 
          category: site.category,
          status: finalStatus,
          confidence: isFound ? confidence : 0,
          bio: bio.length > 200 ? bio.substring(0, 200) + '...' : bio,
          followers,
          posts,
          avatar
        };
      } catch (error) {
        return { name: site.name, url: site.url, category: site.category, status: 'Error' };
      }
    })));

    if (isCancelled) return;

      const foundResults = results.filter(r => r.status === 'Found' || r.status === 'Possible but Deleted' || r.status === 'Error' || r.status === 'Timed Out');
      
      // Auto-generate OSINT suggestions based on findings
      const suggestions: { name: string, description: string, url: string }[] = [];
      const platformNames = new Set(foundResults.filter(r => r.status === 'Found').map(r => r.name));

      if (platformNames.has('Discord')) {
        suggestions.push({
          name: 'DiscordLookup',
          description: 'Advanced lookup for Discord user IDs and history.',
          url: `https://discordlookup.com/user/${username}`
        });
        suggestions.push({
          name: 'Discord.id',
          description: 'Find Discord user information by ID or username.',
          url: `https://discord.id/?s=${username}`
        });
      }

      if (platformNames.has('Telegram')) {
        suggestions.push({
          name: 'Telegago',
          description: 'Custom search engine for Telegram groups and channels.',
          url: `https://cse.google.com/cse?cx=006368593537057042503:efxm6_0u39o`
        });
        suggestions.push({
          name: 'Lyzem',
          description: 'Deep search engine for Telegram content.',
          url: `https://lyzem.com/search?q=${username}`
        });
      }

      if (platformNames.has('GitHub')) {
        suggestions.push({
          name: 'GitHub Desktop OSINT',
          description: 'Analyze GitHub commits and SSH keys for email/identity.',
          url: `https://github.com/${username}.patch`
        });
      }

      res.json({
        results: foundResults,
        suggestions
      });
    } catch (error) {
      console.error('Social scan failed or timed out:', error.message || error);
      res.status(504).json({ error: 'Social scan timed out' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
