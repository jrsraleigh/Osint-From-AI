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
    const customKeys = req.headers['x-custom-api-keys'];
    if (customKeys) {
      try {
        (req as any).customApiKeys = JSON.parse(String(customKeys));
      } catch (e) {
        console.warn('Failed to parse custom API keys header:', e.message);
      }
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
          headers: { 'Accept': 'application/json' }
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
            
            if (directRdapUrl) {
              console.log(`[WHOIS] Trying direct RDAP for ${query}: ${directRdapUrl}`);
              const directRes = await axios.get(directRdapUrl, { timeout: 5000, validateStatus: () => true });
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

  const searchLimit = pLimit(8); // Further reduced concurrency
  const socialLimit = pLimit(10); // Further reduced concurrency for social scans
  
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

    // Try Google first with a retry mechanism
    let googleRetries = 0;
    const maxGoogleRetries = 2;
    
    while (googleRetries <= maxGoogleRetries) {
      try {
        const waitTime = googleRetries === 0 ? (Math.random() * 1000 + 500) : (Math.random() * 3000 * Math.pow(2, googleRetries));
        await sleep(waitTime);
        
        const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=30`;
        
        const response = await searchLimit(() => axios.get(googleUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
          },
          timeout: 30000,
          validateStatus: (status) => status < 500 // Don't throw on 429 or 414
        }));
        
        console.log(`[Search] Google status: ${response.status} for query: ${query.substring(0, 50)}...`);

        if (response.status === 429) {
          console.warn(`[Search] Google rate limit (429) hit, retry ${googleRetries + 1}/${maxGoogleRetries}...`);
          googleRetries++;
          if (googleRetries > maxGoogleRetries) break;
          continue;
        }

        if (response.status === 414) {
          console.error(`[Search] Google URI Too Long (414) for query: ${query.substring(0, 50)}...`);
          break; // Chunking should have prevented this, but if it happens, we can't retry
        }

        const $ = cheerio.load(response.data);
        const selectors = ['div.g', 'div.tF2Cxc', 'div.yuRUbf', 'div.kvH9C', 'div.Z26q7c', 'div.MjjYud', 'div.sr__group', 'div.BNeawe'];
        
        let foundInGoogle = 0;
        selectors.forEach(selector => {
          $(selector).each((i, el) => {
            const title = $(el).find('h3, .vv778b, .BNeawe').first().text().trim();
            const link = $(el).find('a').first().attr('href');
            const snippet = $(el).find('div.VwiC3b, .st, div.kb0Bcb, div.LGOjbe, .BNeawe').first().text().trim();
            
            if (title && link && link.startsWith('http') && !results.find(r => r.link === link)) {
              results.push({ title, link, snippet, source: 'Google' });
              foundInGoogle++;
            }
          });
        });
        
        console.log(`[Search] Google found ${foundInGoogle} results`);
        if (results.length > 0) break; // Success
        googleRetries++; // No results, maybe try again or move on
      } catch (e: any) {
        console.error('Google search failed:', e.message);
        break;
      }
    }

    // If Google fails or returns no results, try DuckDuckGo
    if (results.length === 0) {
      let ddgRetries = 0;
      while (ddgRetries < 2) {
        try {
          console.log(`[Search] DuckDuckGo attempt ${ddgRetries + 1} for: ${query}`);
          await sleep(Math.random() * 800 + 400);
          const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
          const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
          const ddgResponse = await searchLimit(() => axios.get(ddgUrl, {
            headers: { 
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Referer': 'https://duckduckgo.com/'
            },
            timeout: 30000
          }));
          const $ddg = cheerio.load(ddgResponse.data);
          let foundInDDG = 0;
          $ddg('.result').each((i, el) => {
            const title = $ddg(el).find('.result__title').text().trim();
            const link = $ddg(el).find('.result__a').attr('href');
            const snippet = $ddg(el).find('.result__snippet').text().trim();
            if (title && link) {
              const finalLink = link.startsWith('//') ? 'https:' + link : link;
              if (!results.find(r => r.link === finalLink)) {
                results.push({ title, link: finalLink, snippet, source: 'DuckDuckGo' });
                foundInDDG++;
              }
            }
          });
          if (foundInDDG > 0) break;
          ddgRetries++;
        } catch (e: any) {
          console.error(`DDG fallback attempt ${ddgRetries + 1} failed:`, e.message);
          ddgRetries++;
          if (ddgRetries < 2) await sleep(1500);
        }
      }
    }

    // Try Bing if still no results and it's a dork
    if (results.length === 0 && isDork) {
      let bingRetries = 0;
      while (bingRetries < 2) {
        try {
          console.log(`[Search] Bing attempt ${bingRetries + 1} for: ${query}`);
          await sleep(Math.random() * 1000 + 500);
          const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
          const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
          const bingResponse = await searchLimit(() => axios.get(bingUrl, {
            headers: { 
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Referer': 'https://www.bing.com/'
            },
            timeout: 30000
          }));
          const $bing = cheerio.load(bingResponse.data);
          let foundInBing = 0;
          $bing('.b_algo').each((i, el) => {
            const title = $bing(el).find('h2').text().trim();
            const link = $bing(el).find('a').attr('href');
            const snippet = $bing(el).find('.b_caption p').text().trim();
            if (title && link && !results.find(r => r.link === link)) {
              results.push({ title, link, snippet, source: 'Bing' });
              foundInBing++;
            }
          });
          if (foundInBing > 0) break;
          bingRetries++;
        } catch (e: any) {
          console.error(`Bing fallback attempt ${bingRetries + 1} failed:`, e.message);
          bingRetries++;
          if (bingRetries < 2) await sleep(1500);
        }
      }
    }

    // Final fallback to Yahoo if still no results
    if (results.length === 0) {
      let yahooRetries = 0;
      while (yahooRetries < 2) {
        try {
          console.log(`[Search] Yahoo attempt ${yahooRetries + 1} for: ${query}`);
          await sleep(Math.random() * 1000 + 500);
          const yahooUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
          const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
          const yahooResponse = await searchLimit(() => axios.get(yahooUrl, {
            headers: { 
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Referer': 'https://search.yahoo.com/'
            },
            timeout: 30000
          }));
          const $yahoo = cheerio.load(yahooResponse.data);
          let foundInYahoo = 0;
          $yahoo('.algo-sr').each((i, el) => {
            const title = $yahoo(el).find('h3').text().trim();
            const link = $yahoo(el).find('a').first().attr('href');
            const snippet = $yahoo(el).find('.compText').text().trim();
            if (title && link && !results.find(r => r.link === link)) {
              results.push({ title, link, snippet, source: 'Yahoo' });
              foundInYahoo++;
            }
          });
          if (foundInYahoo > 0) break;
          yahooRetries++;
        } catch (e: any) {
          console.error(`Yahoo fallback attempt ${yahooRetries + 1} failed:`, e.message);
          yahooRetries++;
          if (yahooRetries < 2) await sleep(1500);
        }
      }
    }

    return results;
  }

  const handleSearch = async (req: any, res: any) => {
    const q = req.query.q || req.body.q;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    try {
      const results = await searchLimit(() => scrapeSearchEngines(String(q)));
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
        timeout: 30000,
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
    const { target, limit: queryLimit } = req.query;
    if (!target) return res.status(400).json({ error: 'Username required' });
    
    let username = String(target);
    if (username.includes('@')) {
      username = username.split('@')[0];
    }

    let sites = [
      // Social Media - Global & Niche
      { name: 'GitHub', url: `https://github.com/${username}`, category: 'Social' },
      { name: 'Twitter', url: `https://twitter.com/${username}`, category: 'Social' },
      { name: 'Instagram', url: `https://instagram.com/${username}`, category: 'Social' },
      { name: 'Reddit', url: `https://reddit.com/user/${username}`, category: 'Social' },
      { name: 'Facebook', url: `https://facebook.com/${username}`, category: 'Social' },
      { name: 'TikTok', url: `https://tiktok.com/@${username}`, category: 'Social' },
      { name: 'Pinterest', url: `https://pinterest.com/${username}`, category: 'Social' },
      { name: 'Tumblr', url: `https://${username}.tumblr.com`, category: 'Social' },
      { name: 'Snapchat', url: `https://snapchat.com/add/${username}`, category: 'Social' },
      { name: 'Mastodon', url: `https://mastodon.social/@${username}`, category: 'Social' },
      { name: 'VK', url: `https://vk.com/${username}`, category: 'Social' },
      { name: 'Odnoklassniki', url: `https://ok.ru/${username}`, category: 'Social' },
      { name: 'Weibo', url: `https://weibo.com/${username}`, category: 'Social' },
      { name: 'Zhihu', url: `https://www.zhihu.com/people/${username}`, category: 'Social' },
      { name: 'Baidu', url: `https://tieba.baidu.com/home/main?un=${username}`, category: 'Social' },
      { name: 'MeWe', url: `https://mewe.com/i/${username}`, category: 'Social' },
      { name: 'Gab', url: `https://gab.com/${username}`, category: 'Social' },
      { name: 'Gettr', url: `https://gettr.com/user/${username}`, category: 'Social' },
      { name: 'Truth Social', url: `https://truthsocial.com/@${username}`, category: 'Social' },
      { name: 'BeReal', url: `https://bere.al/${username}`, category: 'Social' },
      { name: 'Lemon8', url: `https://www.lemon8-app.com/${username}`, category: 'Social' },
      { name: 'Mastodon.social', url: `https://mastodon.social/@${username}`, category: 'Social' },
      { name: 'Threads', url: `https://threads.net/@${username}`, category: 'Social' },
      { name: 'Bluesky', url: `https://bsky.app/profile/${username}`, category: 'Social' },
      { name: 'Cohost', url: `https://cohost.org/${username}`, category: 'Social' },
      { name: 'Post.news', url: `https://post.news/@/${username}`, category: 'Social' },
      { name: 'T2.social', url: `https://t2.social/${username}`, category: 'Social' },
      { name: 'Hive Social', url: `https://hive.social/user/${username}`, category: 'Social' },
      { name: 'Counter Social', url: `https://counter.social/@${username}`, category: 'Social' },
      { name: 'Parler', url: `https://parler.com/profile/${username}`, category: 'Social' },
      { name: 'Rumble', url: `https://rumble.com/user/${username}`, category: 'Social' },
      { name: 'Odysee', url: `https://odysee.com/@${username}`, category: 'Social' },
      { name: 'Bitchute', url: `https://bitchute.com/channel/${username}`, category: 'Social' },
      { name: 'Dailymotion', url: `https://dailymotion.com/${username}`, category: 'Social' },
      { name: 'Bandcamp', url: `https://bandcamp.com/${username}`, category: 'Creative' },
      { name: 'Mixcloud', url: `https://mixcloud.com/${username}`, category: 'Creative' },
      { name: 'Discogs', url: `https://discogs.com/user/${username}`, category: 'Creative' },
      { name: 'Letterboxd', url: `https://letterboxd.com/${username}`, category: 'Other' },
      { name: 'Goodreads', url: `https://goodreads.com/${username}`, category: 'Other' },
      { name: 'StoryGraph', url: `https://app.thestorygraph.com/profile/${username}`, category: 'Other' },
      { name: 'LibraryThing', url: `https://librarything.com/profile/${username}`, category: 'Other' },
      { name: 'RateYourMusic', url: `https://rateyourmusic.com/~${username}`, category: 'Creative' },
      { name: 'AniList', url: `https://anilist.co/user/${username}`, category: 'Gaming' },
      { name: 'Kitsu', url: `https://kitsu.io/users/${username}`, category: 'Gaming' },
      { name: '500px', url: `https://500px.com/p/${username}`, category: 'Creative' },
      { name: 'Unsplash', url: `https://unsplash.com/@${username}`, category: 'Creative' },
      { name: 'Pexels', url: `https://pexels.com/@${username}`, category: 'Creative' },
      { name: 'Pixabay', url: `https://pixabay.com/users/${username}`, category: 'Creative' },
      { name: 'Shutterstock', url: `https://shutterstock.com/g/${username}`, category: 'Creative' },
      { name: 'Adobe Portfolio', url: `https://${username}.myportfolio.com`, category: 'Creative' },
      { name: 'Canva', url: `https://canva.com/p/${username}`, category: 'Creative' },
      { name: 'Figma', url: `https://figma.com/@${username}`, category: 'Creative' },
      { name: 'Sketch', url: `https://sketch.com/@${username}`, category: 'Creative' },
      { name: 'InVision', url: `https://invisionapp.com/profile/${username}`, category: 'Creative' },
      { name: 'Zeplin', url: `https://zeplin.io/profile/${username}`, category: 'Creative' },
      { name: 'Abstract', url: `https://abstract.com/profile/${username}`, category: 'Creative' },
      { name: 'Framer', url: `https://framer.com/@${username}`, category: 'Creative' },
      { name: 'Webflow', url: `https://webflow.com/${username}`, category: 'Creative' },
      { name: 'Bubble', url: `https://bubble.io/user/${username}`, category: 'Tech' },
      { name: 'Glide', url: `https://glideapps.com/profile/${username}`, category: 'Tech' },
      { name: 'Adalo', url: `https://adalo.com/profile/${username}`, category: 'Tech' },
      { name: 'Zapier', url: `https://zapier.com/profile/${username}`, category: 'Tech' },
      { name: 'Make', url: `https://make.com/profile/${username}`, category: 'Tech' },
      { name: 'IFTTT', url: `https://ifttt.com/p/${username}`, category: 'Tech' },
      { name: 'Notion', url: `https://notion.so/${username}`, category: 'Tech' },
      { name: 'Obsidian', url: `https://obsidian.md/u/${username}`, category: 'Tech' },
      { name: 'Roam Research', url: `https://roamresearch.com/#/app/${username}`, category: 'Tech' },
      { name: 'Logseq', url: `https://logseq.com/${username}`, category: 'Tech' },
      { name: 'Evernote', url: `https://evernote.com/u/${username}`, category: 'Tech' },
      { name: 'OneNote', url: `https://onenote.com/${username}`, category: 'Tech' },
      { name: 'Google Keep', url: `https://keep.google.com/u/0/#label/${username}`, category: 'Tech' },
      { name: 'Microsoft', url: `https://social.msdn.microsoft.com/Profile/${username}`, category: 'Tech' },
      { name: 'Apple', url: `https://discussions.apple.com/profile/${username}`, category: 'Tech' },
      { name: 'Amazon', url: `https://amazon.com/gp/profile/amzn1.account.${username}`, category: 'Other' },
      { name: 'eBay', url: `https://ebay.com/usr/${username}`, category: 'Other' },
      { name: 'Etsy', url: `https://etsy.com/people/${username}`, category: 'Other' },
      { name: 'Shopify', url: `https://${username}.myshopify.com`, category: 'Other' },
      { name: 'Gumroad', url: `https://${username}.gumroad.com`, category: 'Other' },
      { name: 'Ko-fi', url: `https://ko-fi.com/${username}`, category: 'Other' },
      { name: 'Substack', url: `https://${username}.substack.com`, category: 'Other' },
      { name: 'Ghost', url: `https://ghost.org/u/${username}`, category: 'Other' },
      { name: 'WordPress', url: `https://${username}.wordpress.com`, category: 'Other' },
      { name: 'Blogger', url: `https://${username}.blogspot.com`, category: 'Other' },
      { name: 'LiveJournal', url: `https://${username}.livejournal.com`, category: 'Other' },
      { name: 'Dreamwidth', url: `https://${username}.dreamwidth.org`, category: 'Other' },
      { name: 'Pillowfort', url: `https://pillowfort.social/${username}`, category: 'Other' },
      { name: 'Plurk', url: `https://plurk.com/${username}`, category: 'Other' },
      { name: 'Douban', url: `https://douban.com/people/${username}`, category: 'Other' },
      { name: 'Xiaohongshu', url: `https://www.xiaohongshu.com/user/profile/${username}`, category: 'Other' },
      { name: 'Bilibili', url: `https://space.bilibili.com/${username}`, category: 'Other' },
      { name: 'Meetup', url: `https://meetup.com/members/${username}`, category: 'Other' },
      
      // Financial & Crypto
      { name: 'Venmo', url: `https://venmo.com/${username}`, category: 'Financial' },
      { name: 'CashApp', url: `https://cash.app/$${username}`, category: 'Financial' },
      { name: 'PayPal', url: `https://paypal.me/${username}`, category: 'Financial' },
      { name: 'Revolut', url: `https://revolut.me/${username}`, category: 'Financial' },
      { name: 'Wise', url: `https://wise.com/u/${username}`, category: 'Financial' },
      { name: 'Zelle', url: `https://zellepay.com/user/${username}`, category: 'Financial' },
      { name: 'Stripe', url: `https://stripe.com/u/${username}`, category: 'Financial' },
      { name: 'Square', url: `https://square.site/book/${username}`, category: 'Financial' },
      { name: 'Plaid', url: `https://plaid.com/user/${username}`, category: 'Financial' },
      { name: 'Robinhood', url: `https://robinhood.com/u/${username}`, category: 'Financial' },
      { name: 'Coinbase', url: `https://coinbase.com/u/${username}`, category: 'Financial' },
      { name: 'Binance', url: `https://binance.com/en/u/${username}`, category: 'Financial' },
      { name: 'Kraken', url: `https://kraken.com/u/${username}`, category: 'Financial' },
      { name: 'KuCoin', url: `https://kucoin.com/u/${username}`, category: 'Financial' },
      { name: 'Crypto.com', url: `https://crypto.com/u/${username}`, category: 'Financial' },
      { name: 'MetaMask', url: `https://metamask.io/u/${username}`, category: 'Financial' },
      { name: 'Etherscan', url: `https://etherscan.io/address/${username}`, category: 'Financial' },
      { name: 'BscScan', url: `https://bscscan.com/address/${username}`, category: 'Financial' },
      { name: 'Solscan', url: `https://solscan.io/account/${username}`, category: 'Financial' },
      { name: 'PolygonScan', url: `https://polygonscan.com/address/${username}`, category: 'Financial' },
      { name: 'TradingView', url: `https://tradingview.com/u/${username}`, category: 'Financial' },
      { name: 'StockTwits', url: `https://stocktwits.com/${username}`, category: 'Financial' },
      { name: 'SeekingAlpha', url: `https://seekingalpha.com/user/${username}`, category: 'Financial' },
      { name: 'Investing.com', url: `https://investing.com/members/${username}`, category: 'Financial' },
      { name: 'MarketWatch', url: `https://www.marketwatch.com/user/${username}`, category: 'Financial' },
      { name: 'YahooFinance', url: `https://finance.yahoo.com/u/${username}`, category: 'Financial' },
      { name: 'Bloomberg', url: `https://www.bloomberg.com/u/${username}`, category: 'Financial' },
      { name: 'Forbes', url: `https://www.forbes.com/u/${username}`, category: 'Financial' },
      { name: 'Fortune', url: `https://www.fortune.com/u/${username}`, category: 'Financial' },
      { name: 'CNBC', url: `https://www.cnbc.com/u/${username}`, category: 'Financial' },
      { name: 'BusinessInsider', url: `https://www.businessinsider.com/u/${username}`, category: 'Financial' },
      { name: 'TheEconomist', url: `https://www.economist.com/u/${username}`, category: 'Financial' },
      { name: 'FinancialTimes', url: `https://www.ft.com/u/${username}`, category: 'Financial' },
      { name: 'WallStreetJournal', url: `https://www.wsj.com/u/${username}`, category: 'Financial' },
      
      // VoIP, Texting & Chat
      { name: 'Skype', url: `https://skype.com/live:${username}`, category: 'VoIP' },
      { name: 'Viber', url: `https://viber.com/${username}`, category: 'VoIP' },
      { name: 'WhatsApp', url: `https://wa.me/${username}`, category: 'VoIP' },
      { name: 'Telegram', url: `https://t.me/${username}`, category: 'Chat' },
      { name: 'Signal', url: `https://signal.me/#p/${username}`, category: 'VoIP' },
      { name: 'Line', url: `https://line.me/ti/p/~${username}`, category: 'Chat' },
      { name: 'WeChat', url: `https://wechat.com/${username}`, category: 'Chat' },
      { name: 'Discord', url: `https://discord.com/users/${username}`, category: 'Chat' },
      { name: 'Zello', url: `https://zello.me/${username}`, category: 'VoIP' },
      { name: 'Voxer', url: `https://voxer.com/u/${username}`, category: 'VoIP' },
      { name: 'TextNow', url: `https://textnow.com/u/${username}`, category: 'Texting' },
      { name: 'TextFree', url: `https://textfree.us/u/${username}`, category: 'Texting' },
      { name: 'Sideline', url: `https://sideline.com/u/${username}`, category: 'Texting' },
      { name: 'Burner', url: `https://burnerapp.com/u/${username}`, category: 'Texting' },
      { name: 'Hushed', url: `https://hushed.com/u/${username}`, category: 'Texting' },
      { name: 'GoogleVoice', url: `https://voice.google.com/u/0/search?q=${username}`, category: 'VoIP' },
      { name: 'Talkatone', url: `https://talkatone.com/u/${username}`, category: 'VoIP' },
      { name: 'Dingtone', url: `https://dingtone.me/u/${username}`, category: 'VoIP' },
      { name: 'Pinger', url: `https://pinger.com/u/${username}`, category: 'VoIP' },
      { name: 'SecondLine', url: `https://2ndline.co/u/${username}`, category: 'VoIP' },
      { name: 'Phoner', url: `https://phonerapp.com/u/${username}`, category: 'VoIP' },
      { name: 'YouMail', url: `https://youmail.com/u/${username}`, category: 'VoIP' },
      { name: 'TrapCall', url: `https://trapcall.com/u/${username}`, category: 'VoIP' },
      { name: 'Truecaller', url: `https://truecaller.com/u/${username}`, category: 'VoIP' },
      { name: 'Grasshopper', url: `https://grasshopper.com/u/${username}`, category: 'VoIP' },
      { name: 'RingCentral', url: `https://ringcentral.com/u/${username}`, category: 'VoIP' },
      { name: 'Kik', url: `https://kik.me/${username}`, category: 'Chat' },
      { name: 'Snapchat', url: `https://snapchat.com/add/${username}`, category: 'Chat' },
      { name: 'ICQ', url: `https://icq.im/${username}`, category: 'Chat' },
      { name: 'Mumble', url: `https://mumble.info/u/${username}`, category: 'Chat' },
      { name: 'TeamSpeak', url: `https://teamspeak.com/u/${username}`, category: 'Chat' },
      { name: 'Slack', url: `https://${username}.slack.com`, category: 'Chat' },
      { name: 'RocketChat', url: `https://rocket.chat/u/${username}`, category: 'Chat' },
      { name: 'Zulip', url: `https://zulip.com/u/${username}`, category: 'Chat' },
      { name: 'Matrix', url: `https://matrix.to/#/@${username}:matrix.org`, category: 'Chat' },
      { name: 'Element', url: `https://element.io/u/${username}`, category: 'Chat' },
      { name: 'Gitter', url: `https://gitter.im/${username}`, category: 'Chat' },
      { name: 'Mattermost', url: `https://mattermost.com/u/${username}`, category: 'Chat' },
      { name: 'Wire', url: `https://wire.com/u/${username}`, category: 'Chat' },
      { name: 'Threema', url: `https://threema.ch/u/${username}`, category: 'Chat' },
      { name: 'Session', url: `https://getsession.org/u/${username}`, category: 'Chat' },
      { name: 'Keybase', url: `https://keybase.io/${username}`, category: 'Chat' },
      
      // Selling & Marketplaces
      { name: 'eBay', url: `https://ebay.com/usr/${username}`, category: 'Selling' },
      { name: 'Etsy', url: `https://etsy.com/people/${username}`, category: 'Selling' },
      { name: 'Amazon', url: `https://amazon.com/gp/profile/amzn1.account.${username}`, category: 'Selling' },
      { name: 'Poshmark', url: `https://poshmark.com/closet/${username}`, category: 'Selling' },
      { name: 'Mercari', url: `https://mercari.com/u/${username}`, category: 'Selling' },
      { name: 'Depop', url: `https://depop.com/${username}`, category: 'Selling' },
      { name: 'Vinted', url: `https://vinted.com/member/${username}`, category: 'Selling' },
      { name: 'Grailed', url: `https://grailed.com/${username}`, category: 'Selling' },
      { name: 'StockX', url: `https://stockx.com/u/${username}`, category: 'Selling' },
      { name: 'GOAT', url: `https://goat.com/u/${username}`, category: 'Selling' },
      { name: 'OfferUp', url: `https://offerup.com/p/${username}`, category: 'Selling' },
      { name: 'Letgo', url: `https://letgo.com/profile/${username}`, category: 'Selling' },
      { name: 'Craigslist', url: `https://craigslist.org/user/${username}`, category: 'Selling' },
      { name: 'FacebookMarketplace', url: `https://facebook.com/marketplace/profile/${username}`, category: 'Selling' },
      { name: 'Shopify', url: `https://${username}.myshopify.com`, category: 'Selling' },
      { name: 'BigCommerce', url: `https://${username}.mybigcommerce.com`, category: 'Selling' },
      { name: 'WooCommerce', url: `https://${username}.com/shop`, category: 'Selling' },
      { name: 'Gumroad', url: `https://gumroad.com/${username}`, category: 'Selling' },
      { name: 'Ko-fi', url: `https://ko-fi.com/${username}`, category: 'Selling' },
      { name: 'Patreon', url: `https://patreon.com/${username}`, category: 'Selling' },
      { name: 'BuyMeACoffee', url: `https://buymeacoffee.com/${username}`, category: 'Selling' },
      { name: 'Fanbox', url: `https://www.fanbox.cc/@${username}`, category: 'Selling' },
      { name: 'Subscribestar', url: `https://www.subscribestar.com/${username}`, category: 'Selling' },
      { name: 'Gumroad', url: `https://gumroad.com/${username}`, category: 'Selling' },
      { name: 'Sellfy', url: `https://sellfy.com/${username}`, category: 'Selling' },
      { name: 'Payhip', url: `https://payhip.com/${username}`, category: 'Selling' },
      { name: 'SendOwl', url: `https://sendowl.com/u/${username}`, category: 'Selling' },
      { name: 'FetchApp', url: `https://fetchapp.com/u/${username}`, category: 'Selling' },
      
      // Blogs & Content
      { name: 'Medium', url: `https://medium.com/@${username}`, category: 'Blogs' },
      { name: 'Substack', url: `https://${username}.substack.com`, category: 'Blogs' },
      { name: 'WordPress', url: `https://${username}.wordpress.com`, category: 'Blogs' },
      { name: 'Blogger', url: `https://${username}.blogspot.com`, category: 'Blogs' },
      { name: 'Tumblr', url: `https://${username}.tumblr.com`, category: 'Blogs' },
      { name: 'Ghost', url: `https://${username}.ghost.io`, category: 'Blogs' },
      { name: 'LiveJournal', url: `https://${username}.livejournal.com`, category: 'Blogs' },
      { name: 'Dreamwidth', url: `https://${username}.dreamwidth.org`, category: 'Blogs' },
      { name: 'Pillowfort', url: `https://pillowfort.social/${username}`, category: 'Blogs' },
      { name: 'Write.as', url: `https://write.as/${username}`, category: 'Blogs' },
      { name: 'Post.news', url: `https://post.news/@/${username}`, category: 'Blogs' },
      { name: 'Cohost', url: `https://cohost.org/${username}`, category: 'Blogs' },
      { name: 'Hashnode', url: `https://hashnode.com/@${username}`, category: 'Blogs' },
      { name: 'Dev.to', url: `https://dev.to/${username}`, category: 'Blogs' },
      { name: 'Hackernoon', url: `https://hackernoon.com/u/${username}`, category: 'Blogs' },
      { name: 'Zhihu', url: `https://zhihu.com/people/${username}`, category: 'Blogs' },
      { name: 'Quora', url: `https://quora.com/profile/${username}`, category: 'Blogs' },
      { name: 'HubPages', url: `https://hubpages.com/@${username}`, category: 'Blogs' },
      { name: 'Steemit', url: `https://steemit.com/@${username}`, category: 'Blogs' },
      { name: 'Minds', url: `https://minds.com/${username}`, category: 'Blogs' },
      { name: 'Wix', url: `https://${username}.wixsite.com`, category: 'Blogs' },
      { name: 'Squarespace', url: `https://${username}.squarespace.com`, category: 'Blogs' },
      { name: 'Weebly', url: `https://${username}.weebly.com`, category: 'Blogs' },
      { name: 'Jimdo', url: `https://${username}.jimdosite.com`, category: 'Blogs' },
      { name: 'Tilda', url: `https://${username}.tilda.ws`, category: 'Blogs' },
      { name: 'Webflow', url: `https://${username}.webflow.io`, category: 'Blogs' },
      
      // Dating
      { name: 'Tinder', url: `https://tinder.com/@${username}`, category: 'Dating' },
      { name: 'Bumble', url: `https://bumble.com/u/${username}`, category: 'Dating' },
      { name: 'Hinge', url: `https://hinge.co/u/${username}`, category: 'Dating' },
      { name: 'OkCupid', url: `https://okcupid.com/profile/${username}`, category: 'Dating' },
      { name: 'PlentyOfFish', url: `https://pof.com/viewprofile.aspx?user_id=${username}`, category: 'Dating' },
      { name: 'Match', url: `https://match.com/profile/${username}`, category: 'Dating' },
      { name: 'Zoosk', url: `https://zoosk.com/profile/${username}`, category: 'Dating' },
      { name: 'Badoo', url: `https://badoo.com/profile/${username}`, category: 'Dating' },
      { name: 'Tagged', url: `https://tagged.com/${username}`, category: 'Dating' },
      { name: 'Hi5', url: `https://hi5.com/${username}`, category: 'Dating' },
      { name: 'MeetMe', url: `https://meetme.com/${username}`, category: 'Dating' },
      { name: 'Skout', url: `https://skout.com/${username}`, category: 'Dating' },
      { name: 'Lovoo', url: `https://lovoo.com/profile/${username}`, category: 'Dating' },
      { name: 'Jaumo', url: `https://jaumo.com/u/${username}`, category: 'Dating' },
      { name: 'Mamba', url: `https://mamba.ru/profile/${username}`, category: 'Dating' },
      { name: 'AshleyMadison', url: `https://ashleymadison.com/profile/${username}`, category: 'Dating' },
      { name: 'Seeking', url: `https://seeking.com/profile/${username}`, category: 'Dating' },
      { name: 'SugarBook', url: `https://sugarbook.com/profile/${username}`, category: 'Dating' },
      { name: 'SecretBenefits', url: `https://secretbenefits.com/profile/${username}`, category: 'Dating' },
      { name: 'WhatsYourPrice', url: `https://whatsyourprice.com/profile/${username}`, category: 'Dating' },
      { name: 'AdultFriendFinder', url: `https://adultfriendfinder.com/p/${username}`, category: 'Dating' },
      { name: 'CoffeeMeetsBagel', url: `https://coffeemeetsbagel.com/u/${username}`, category: 'Dating' },
      { name: 'Happn', url: `https://happn.com/u/${username}`, category: 'Dating' },
      { name: 'Grindr', url: `https://grindr.com/u/${username}`, category: 'Dating' },
      { name: 'Scruff', url: `https://scruff.com/u/${username}`, category: 'Dating' },
      { name: 'Jackd', url: `https://jackd.com/u/${username}`, category: 'Dating' },
      { name: 'Hornet', url: `https://hornet.com/u/${username}`, category: 'Dating' },
      { name: 'Her', url: `https://weareher.com/u/${username}`, category: 'Dating' },
      
      // Gaming
      { name: 'Steam', url: `https://steamcommunity.com/id/${username}`, category: 'Gaming' },
      { name: 'Xbox', url: `https://xboxgamertag.com/search/${username}`, category: 'Gaming' },
      { name: 'PlayStation', url: `https://psnprofiles.com/${username}`, category: 'Gaming' },
      { name: 'Nintendo', url: `https://nintendo.com/u/${username}`, category: 'Gaming' },
      { name: 'EpicGames', url: `https://epicgames.com/u/${username}`, category: 'Gaming' },
      { name: 'Roblox', url: `https://roblox.com/users/${username}/profile`, category: 'Gaming' },
      { name: 'Minecraft', url: `https://namemc.com/profile/${username}`, category: 'Gaming' },
      { name: 'Twitch', url: `https://twitch.tv/${username}`, category: 'Gaming' },
      { name: 'Kick', url: `https://kick.com/${username}`, category: 'Gaming' },
      { name: 'Trovo', url: `https://trovo.live/${username}`, category: 'Gaming' },
      { name: 'DLive', url: `https://dlive.tv/${username}`, category: 'Gaming' },
      { name: 'BattleNet', url: `https://battle.net/u/${username}`, category: 'Gaming' },
      { name: 'Origin', url: `https://origin.com/u/${username}`, category: 'Gaming' },
      { name: 'Uplay', url: `https://uplay.com/u/${username}`, category: 'Gaming' },
      { name: 'GOG', url: `https://gog.com/u/${username}`, category: 'Gaming' },
      { name: 'Itch.io', url: `https://${username}.itch.io`, category: 'Gaming' },
      { name: 'GameJolt', url: `https://gamejolt.com/@${username}`, category: 'Gaming' },
      { name: 'NexusMods', url: `https://nexusmods.com/users/${username}`, category: 'Gaming' },
      { name: 'CurseForge', url: `https://curseforge.com/members/${username}`, category: 'Gaming' },
      { name: 'Speedrun', url: `https://speedrun.com/user/${username}`, category: 'Gaming' },
      { name: 'TrackerGG', url: `https://tracker.gg/profile/${username}`, category: 'Gaming' },
      { name: 'OPGG', url: `https://op.gg/summoners/na/${username}`, category: 'Gaming' },
      { name: 'Faceit', url: `https://faceit.com/en/players/${username}`, category: 'Gaming' },
      { name: 'ESEA', url: `https://play.esea.net/users/${username}`, category: 'Gaming' },
      { name: 'Challengermode', url: `https://challengermode.com/users/${username}`, category: 'Gaming' },
      { name: 'Battlefy', url: `https://battlefy.com/${username}`, category: 'Gaming' },
      { name: 'Smashgg', url: `https://smash.gg/user/${username}`, category: 'Gaming' },
      { name: 'Liquipedia', url: `https://liquipedia.net/users/${username}`, category: 'Gaming' },
      
      // NSFW
      { name: 'OnlyFans', url: `https://onlyfans.com/${username}`, category: 'NSFW' },
      { name: 'Fansly', url: `https://fansly.com/${username}`, category: 'NSFW' },
      { name: 'Pornhub', url: `https://pornhub.com/users/${username}`, category: 'NSFW' },
      { name: 'XVideos', url: `https://xvideos.com/profiles/${username}`, category: 'NSFW' },
      { name: 'XNXX', url: `https://xnxx.com/u/${username}`, category: 'NSFW' },
      { name: 'XHamster', url: `https://xhamster.com/users/${username}`, category: 'NSFW' },
      { name: 'Chaturbate', url: `https://chaturbate.com/${username}`, category: 'NSFW' },
      { name: 'Cam4', url: `https://cam4.com/${username}`, category: 'NSFW' },
      { name: 'BongaCams', url: `https://bongacams.com/${username}`, category: 'NSFW' },
      { name: 'Stripchat', url: `https://stripchat.com/${username}`, category: 'NSFW' },
      { name: 'LiveJasmin', url: `https://livejasmin.com/en/member/${username}`, category: 'NSFW' },
      { name: 'ManyVids', url: `https://manyvids.com/Profile/${username}`, category: 'NSFW' },
      { name: 'Clips4Sale', url: `https://clips4sale.com/studio/${username}`, category: 'NSFW' },
      { name: 'IWantClips', url: `https://iwantclips.com/store/${username}`, category: 'NSFW' },
      { name: 'LoyalFans', url: `https://loyalfans.com/${username}`, category: 'NSFW' },
      { name: 'PocketStars', url: `https://pocketstars.com/${username}`, category: 'NSFW' },
      { name: 'Fapello', url: `https://fapello.com/${username}`, category: 'NSFW' },
      { name: 'Thothub', url: `https://thothub.to/user/${username}`, category: 'NSFW' },
      { name: 'Coomer', url: `https://coomer.party/onlyfans/user/${username}`, category: 'NSFW' },
      { name: 'Kemono', url: `https://kemono.party/patreon/user/${username}`, category: 'NSFW' },
      { name: 'SimpCity', url: `https://simpcity.su/members/${username}`, category: 'NSFW' },
      { name: 'ViperGirls', url: `https://vipergirls.to/members/${username}`, category: 'NSFW' },
      { name: 'PlanetSuzy', url: `https://planetsuzy.org/members/${username}`, category: 'NSFW' },
      { name: 'AdultWork', url: `https://www.adultwork.com/${username}`, category: 'NSFW' },
      { name: 'Escort-Directory', url: `https://www.escort-directory.com/${username}`, category: 'NSFW' },
      { name: 'EuroGirlsEscort', url: `https://www.eurogirlsescort.com/${username}`, category: 'NSFW' },
      { name: 'Slixa', url: `https://www.slixa.com/${username}`, category: 'NSFW' },
      { name: 'Eros', url: `https://www.eros.com/${username}`, category: 'NSFW' },
      { name: 'YesBackpage', url: `https://www.yesbackpage.com/${username}`, category: 'NSFW' },
      { name: 'Bedpage', url: `https://www.bedpage.com/${username}`, category: 'NSFW' },
      { name: 'CityXGuide', url: `https://www.cityxguide.com/${username}`, category: 'NSFW' },
      { name: 'RubRatings', url: `https://www.rubratings.com/${username}`, category: 'NSFW' },
      { name: 'MassageAnywhere', url: `https://www.massageanywhere.com/${username}`, category: 'NSFW' },
      { name: 'ListCrawler', url: `https://www.listcrawler.com/${username}`, category: 'NSFW' },
      { name: 'SkipTheGames', url: `https://www.skipthegames.com/${username}`, category: 'NSFW' },
      { name: 'MegaPersons', url: `https://www.megapersons.com/${username}`, category: 'NSFW' },
      { name: 'Locanto', url: `https://www.locanto.com/${username}`, category: 'NSFW' },
      { name: 'DoubleList', url: `https://www.doublelist.com/${username}`, category: 'NSFW' },
      { name: 'Squirt', url: `https://www.squirt.org/${username}`, category: 'NSFW' },
      { name: 'Adam4Adam', url: `https://www.adam4adam.com/${username}`, category: 'NSFW' },
      { name: 'FetLife', url: `https://fetlife.com/users/${username}`, category: 'NSFW' },
      { name: 'Recon', url: `https://recon.com/u/${username}`, category: 'NSFW' },
      { name: 'Kink', url: `https://kink.com/u/${username}`, category: 'NSFW' },
      { name: 'ModelMayhem', url: `https://www.modelmayhem.com/${username}`, category: 'NSFW' },
      { name: 'PurplePort', url: `https://purpleport.com/u/${username}`, category: 'NSFW' },
      { name: 'StarNow', url: `https://www.starnow.com/u/${username}`, category: 'NSFW' },
      { name: 'CastingCallClub', url: `https://www.castingcall.club/u/${username}`, category: 'NSFW' },
      { name: 'Backstage', url: `https://www.backstage.com/u/${username}`, category: 'NSFW' },
      { name: 'Slixa', url: `https://www.slixa.com/${username}`, category: 'NSFW' },
      { name: 'Eros', url: `https://www.eros.com/${username}`, category: 'NSFW' },
      { name: 'YesBackpage', url: `https://www.yesbackpage.com/${username}`, category: 'NSFW' },
      { name: 'Bedpage', url: `https://www.bedpage.com/${username}`, category: 'NSFW' },
      { name: 'CityXGuide', url: `https://www.cityxguide.com/${username}`, category: 'NSFW' },
      { name: 'RubRatings', url: `https://www.rubratings.com/${username}`, category: 'NSFW' },
      { name: 'MassageAnywhere', url: `https://www.massageanywhere.com/${username}`, category: 'NSFW' },
      { name: 'Listcrawler', url: `https://www.listcrawler.com/${username}`, category: 'NSFW' },
      { name: 'Skipthegames', url: `https://www.skipthegames.com/${username}`, category: 'NSFW' },
      { name: 'Megapersons', url: `https://www.megapersons.com/${username}`, category: 'NSFW' },
      { name: 'Locanto', url: `https://www.locanto.com/${username}`, category: 'NSFW' },
      { name: 'Craigslist', url: `https://craigslist.org/user/${username}`, category: 'NSFW' },
      { name: 'Doublelist', url: `https://doublelist.com/user/${username}`, category: 'NSFW' },
      { name: 'Squirt', url: `https://www.squirt.org/user/${username}`, category: 'NSFW' },
      { name: 'Adam4Adam', url: `https://www.adam4adam.com/user/${username}`, category: 'NSFW' },
      { name: 'Sugarbook', url: `https://sugarbook.com/profile/${username}`, category: 'Dating' },
      { name: 'Secret Benefits', url: `https://www.secretbenefits.com/profile/${username}`, category: 'Dating' },
      { name: 'WhatsYourPrice', url: `https://www.whatsyourprice.com/profile/${username}`, category: 'Dating' },
      { name: 'Missy', url: `https://www.missy.com/profile/${username}`, category: 'Dating' },
      { name: 'ModelMayhem', url: `https://www.modelmayhem.com/${username}`, category: 'Creative' },
      { name: 'PurplePort', url: `https://purpleport.com/portfolio/${username}`, category: 'Creative' },
      { name: 'Star-Now', url: `https://www.starnow.com/u/${username}`, category: 'Creative' },
      { name: 'CastingCall.club', url: `https://castingcall.club/m/${username}`, category: 'Creative' },
      { name: 'Backstage', url: `https://www.backstage.com/u/${username}`, category: 'Creative' },
      { name: 'Fiverr', url: `https://fiverr.com/${username}`, category: 'Professional' },
      { name: 'Upwork', url: `https://upwork.com/freelancers/~${username}`, category: 'Professional' },
      { name: 'Freelancer', url: `https://freelancer.com/u/${username}`, category: 'Professional' },
      { name: 'Guru', url: `https://guru.com/freelancers/${username}`, category: 'Professional' },
      { name: 'PeoplePerHour', url: `https://peopleperhour.com/freelancer/${username}`, category: 'Professional' },
      { name: 'Toptal', url: `https://toptal.com/resume/${username}`, category: 'Professional' },
      { name: '99designs', url: `https://99designs.com/profiles/${username}`, category: 'Professional' },
      { name: 'Envato', url: `https://photodune.net/user/${username}`, category: 'Professional' },
      { name: 'Creative Market', url: `https://creativemarket.com/users/${username}`, category: 'Professional' },
      { name: 'Unity', url: `https://connect.unity.com/u/${username}`, category: 'Tech' },
      { name: 'Unreal Engine', url: `https://forums.unrealengine.com/u/${username}`, category: 'Tech' },
      { name: 'Kick', url: `https://kick.com/${username}`, category: 'Gaming' },
      { name: 'Trovo', url: `https://trovo.live/${username}`, category: 'Gaming' },
      { name: 'DLive', url: `https://dlive.tv/${username}`, category: 'Gaming' },
      { name: 'Caffeine', url: `https://www.caffeine.tv/${username}`, category: 'Gaming' },
      { name: 'YouNow', url: `https://www.younow.com/${username}`, category: 'Gaming' },
      { name: 'Bigo TV', url: `https://www.bigo.tv/user/${username}`, category: 'Gaming' },
      { name: 'Tango', url: `https://tango.me/profile/${username}`, category: 'Gaming' },
      { name: 'MicoChat', url: `https://www.micochat.com/user/${username}`, category: 'Gaming' },
      { name: 'Holla.world', url: `https://holla.world/${username}`, category: 'Chat' },
      { name: 'Monkey.app', url: `https://monkey.app/${username}`, category: 'Chat' },
      { name: 'Chatrandom', url: `https://chatrandom.com/user/${username}`, category: 'Chat' },
      { name: 'Bazoocam', url: `https://bazoocam.org/user/${username}`, category: 'Chat' },
      { name: 'DirtyRoulette', url: `https://dirtyroulette.com/user/${username}`, category: 'Chat' },
      { name: 'Camsurf', url: `https://camsurf.com/user/${username}`, category: 'Chat' },
      { name: 'Shagle', url: `https://shagle.com/user/${username}`, category: 'Chat' },
      { name: 'Ome.tv', url: `https://ome.tv/user/${username}`, category: 'Chat' },
      { name: 'CooMeet', url: `https://coomeet.com/user/${username}`, category: 'Chat' },
      { name: 'Flingster', url: `https://flingster.com/user/${username}`, category: 'Chat' },
      { name: 'AdultChat', url: `https://adultchat.com/user/${username}`, category: 'Chat' },
      { name: 'Sex.com', url: `https://www.sex.com/user/${username}`, category: 'NSFW' },
      { name: 'RentMen', url: `https://rentmen.eu/${username}`, category: 'NSFW' },
      { name: 'EscortAlligator', url: `https://www.escortalligator.com/${username}`, category: 'NSFW' },
      { name: 'Eros-Guide', url: `https://www.eros-guide.com/${username}`, category: 'NSFW' },
      { name: 'AdultSearch', url: `https://www.adultsearch.com/${username}`, category: 'NSFW' },
      { name: 'MyFreeCams', url: `https://www.myfreecams.com/#${username}`, category: 'NSFW' },
      { name: 'ImLive', url: `https://www.imlive.com/${username}`, category: 'NSFW' },
      { name: 'FapHouse', url: `https://faphouse.com/user/${username}`, category: 'NSFW' },
      { name: 'PornTrex', url: `https://www.porntrex.com/user/${username}`, category: 'NSFW' },
      { name: 'DaftSex', url: `https://daftsex.com/user/${username}`, category: 'NSFW' },
      { name: 'HQPorner', url: `https://hqporner.com/user/${username}`, category: 'NSFW' },
      { name: 'XHamsterLive', url: `https://xhamsterlive.com/${username}`, category: 'NSFW' },
      { name: 'CamZap', url: `https://camzap.com/user/${username}`, category: 'Chat' },
      { name: 'AllTrails', url: `https://www.alltrails.com/members/${username}`, category: 'Other' },
      { name: 'Strava', url: `https://www.strava.com/athletes/${username}`, category: 'Other' },
      { name: 'Komoot', url: `https://www.komoot.com/user/${username}`, category: 'Other' },
      { name: 'Wikiloc', url: `https://www.wikiloc.com/wikiloc/user.do?id=${username}`, category: 'Other' },
      { name: 'Geocaching', url: `https://www.geocaching.com/profile/?u=${username}`, category: 'Other' },
      { name: 'Ingress', url: `https://intel.ingress.com/intel?ll=0,0&z=1&pll=0,0&user=${username}`, category: 'Gaming' },
      { name: 'Pokemon', url: `https://www.pokemon.com/us/pokemon-trainer-club/profile/${username}`, category: 'Gaming' },
      { name: 'Duolingo', url: `https://www.duolingo.com/profile/${username}`, category: 'Other' },
      { name: 'Memrise', url: `https://www.memrise.com/user/${username}`, category: 'Other' },
      { name: 'Babbel', url: `https://www.babbel.com/profile/${username}`, category: 'Other' },
      { name: 'Busuu', url: `https://www.busuu.com/en/user/${username}`, category: 'Other' },
      { name: 'italki', url: `https://www.italki.com/user/${username}`, category: 'Other' },
      { name: 'Preply', url: `https://preply.com/en/tutor/${username}`, category: 'Other' },
      { name: 'Verbling', url: `https://www.verbling.com/teachers/${username}`, category: 'Other' },
      { name: 'HelloTalk', url: `https://www.hellotalk.com/user/${username}`, category: 'Other' },
      { name: 'Tandem', url: `https://www.tandem.net/members/${username}`, category: 'Other' },
      { name: 'Couchsurfing', url: `https://www.couchsurfing.com/people/${username}`, category: 'Other' },
      { name: 'Trustpilot', url: `https://www.trustpilot.com/users/${username}`, category: 'Other' },
      { name: 'Yelp', url: `https://www.yelp.com/user_details?userid=${username}`, category: 'Other' },
      { name: 'TripAdvisor', url: `https://www.tripadvisor.com/Profile/${username}`, category: 'Other' },
      { name: 'Foursquare', url: `https://foursquare.com/user/${username}`, category: 'Other' },
      { name: 'Untappd', url: `https://untappd.com/user/${username}`, category: 'Other' },
      { name: 'Vivino', url: `https://www.vivino.com/users/${username}`, category: 'Other' },
      { name: 'CellarTracker', url: `https://www.cellartracker.com/user.asp?User=${username}`, category: 'Other' },
      { name: 'BeerAdvocate', url: `https://www.beeradvocate.com/user/profile/${username}`, category: 'Other' },
      { name: 'RateBeer', url: `https://www.ratebeer.com/user/${username}`, category: 'Other' },
      { name: 'AllRecipes', url: `https://www.allrecipes.com/cook/${username}`, category: 'Other' },
      { name: 'Cookpad', url: `https://cookpad.com/us/users/${username}`, category: 'Other' },
      { name: 'Yummly', url: `https://www.yummly.com/profile/${username}`, category: 'Other' },
      { name: 'Tasty', url: `https://tasty.co/author/${username}`, category: 'Other' },
      { name: 'Food52', url: `https://food52.com/users/${username}`, category: 'Other' },
      { name: 'Epicurious', url: `https://www.epicurious.com/experts/${username}`, category: 'Other' },
      { name: 'Bon Appetit', url: `https://www.bonappetit.com/contributor/${username}`, category: 'Other' },
      { name: 'Serious Eats', url: `https://www.seriouseats.com/user/${username}`, category: 'Other' },
      { name: 'The Kitchn', url: `https://www.thekitchn.com/authors/${username}`, category: 'Other' },
      { name: 'Apartment Therapy', url: `https://www.apartmenttherapy.com/authors/${username}`, category: 'Other' },
      { name: 'Houzz', url: `https://www.houzz.com/user/${username}`, category: 'Other' },
      { name: 'Zillow', url: `https://www.zillow.com/profile/${username}`, category: 'Other' },
      { name: 'Redfin', url: `https://www.redfin.com/users/${username}`, category: 'Other' },
      { name: 'Realtor.com', url: `https://www.realtor.com/profile/${username}`, category: 'Other' },
      { name: 'Trulia', url: `https://www.trulia.com/profile/${username}`, category: 'Other' },
      { name: 'City-Data', url: `https://www.city-data.com/forum/members/${username}.html`, category: 'Other' },
      { name: 'Fark', url: `https://www.fark.com/cgi/profile.pl?user=${username}`, category: 'Other' },
      { name: 'Slashdot', url: `https://slashdot.org/~${username}`, category: 'Tech' },
      { name: 'Digg', url: `https://digg.com/@${username}`, category: 'Other' },
      { name: 'Newsvine', url: `https://${username}.newsvine.com`, category: 'Other' },
      { name: 'Instructables', url: `https://www.instructables.com/member/${username}`, category: 'Other' },
      { name: 'iFixit', url: `https://www.ifixit.com/User/${username}`, category: 'Tech' },
      { name: 'StackExchange', url: `https://stackexchange.com/users/${username}`, category: 'Tech' },
      { name: 'SuperUser', url: `https://superuser.com/users/${username}`, category: 'Tech' },
      { name: 'AskUbuntu', url: `https://askubuntu.com/users/${username}`, category: 'Tech' },
      { name: 'ServerFault', url: `https://serverfault.com/users/${username}`, category: 'Tech' },
      { name: 'MathOverflow', url: `https://mathoverflow.net/users/${username}`, category: 'Tech' },
      { name: 'Stats.StackExchange', url: `https://stats.stackexchange.com/users/${username}`, category: 'Tech' },
      { name: 'English.StackExchange', url: `https://english.stackexchange.com/users/${username}`, category: 'Other' },
      { name: 'Gaming.StackExchange', url: `https://gaming.stackexchange.com/users/${username}`, category: 'Gaming' },
      { name: 'Unix.StackExchange', url: `https://unix.stackexchange.com/users/${username}`, category: 'Tech' },
      { name: 'Apple.StackExchange', url: `https://apple.stackexchange.com/users/${username}`, category: 'Tech' },
      { name: 'Android.StackExchange', url: `https://android.stackexchange.com/users/${username}`, category: 'Tech' },
      { name: 'Magento.StackExchange', url: `https://magento.stackexchange.com/users/${username}`, category: 'Tech' },
      { name: 'SoftwareEngineering.StackExchange', url: `https://softwareengineering.stackexchange.com/users/${username}`, category: 'Tech' },
      { name: 'TeX.StackExchange', url: `https://tex.stackexchange.com/users/${username}`, category: 'Tech' },
      { name: 'Physics.StackExchange', url: `https://physics.stackexchange.com/users/${username}`, category: 'Tech' },
      { name: 'Chemistry.StackExchange', url: `https://chemistry.stackexchange.com/users/${username}`, category: 'Tech' },
      { name: 'Biology.StackExchange', url: `https://biology.stackexchange.com/users/${username}`, category: 'Tech' },
      { name: 'Christianity.StackExchange', url: `https://christianity.stackexchange.com/users/${username}`, category: 'Other' },
      { name: 'Islam.StackExchange', url: `https://islam.stackexchange.com/users/${username}`, category: 'Other' },
      { name: 'Judaism.StackExchange', url: `https://judaism.stackexchange.com/users/${username}`, category: 'Other' },
      { name: 'Buddhism.StackExchange', url: `https://buddhism.stackexchange.com/users/${username}`, category: 'Other' },
      { name: 'Hinduism.StackExchange', url: `https://hinduism.stackexchange.com/users/${username}`, category: 'Other' },
      
      
      
      
      
      // Creative & Professional
      { name: 'LinkedIn', url: `https://linkedin.com/in/${username}`, category: 'Professional' },
      { name: 'Medium', url: `https://medium.com/@${username}`, category: 'Professional' },
      { name: 'Behance', url: `https://behance.net/${username}`, category: 'Creative' },
      { name: 'Dribbble', url: `https://dribbble.com/${username}`, category: 'Creative' },
      { name: 'Flickr', url: `https://flickr.com/people/${username}`, category: 'Creative' },
      { name: 'SoundCloud', url: `https://soundcloud.com/${username}`, category: 'Creative' },
      { name: 'Vimeo', url: `https://vimeo.com/${username}`, category: 'Creative' },
      { name: 'DeviantArt', url: `https://www.deviantart.com/${username}`, category: 'Creative' },
      { name: 'ArtStation', url: `https://www.artstation.com/${username}`, category: 'Creative' },
      { name: 'Pixiv', url: `https://www.pixiv.net/users/${username}`, category: 'Creative' },
      { name: 'Bandcamp', url: `https://bandcamp.com/${username}`, category: 'Creative' },
      
      // Tech & Other
      { name: 'Keybase', url: `https://keybase.io/${username}`, category: 'Tech' },
      { name: 'HackerNews', url: `https://news.ycombinator.com/user?id=${username}`, category: 'Tech' },
      { name: 'ProductHunt', url: `https://www.producthunt.com/@${username}`, category: 'Tech' },
      { name: 'StackOverflow', url: `https://stackoverflow.com/users/${username}`, category: 'Tech' },
      { name: 'GitLab', url: `https://gitlab.com/${username}`, category: 'Tech' },
      { name: 'Bitbucket', url: `https://bitbucket.org/${username}`, category: 'Tech' },
      { name: 'CodePen', url: `https://codepen.io/${username}`, category: 'Tech' },
      { name: 'About.me', url: `https://about.me/${username}`, category: 'Other' },
      { name: 'Linktree', url: `https://linktr.ee/${username}`, category: 'Other' },
      { name: 'Venmo', url: `https://venmo.com/${username}`, category: 'Other' },
      { name: 'CashApp', url: `https://cash.app/$${username}`, category: 'Other' },
      { name: 'PayPal', url: `https://paypal.me/${username}`, category: 'Other' },
      { name: 'BuyMeACoffee', url: `https://buymeacoffee.com/${username}`, category: 'Other' },
      { name: 'Patreon', url: `https://patreon.com/${username}`, category: 'Other' },
      
      // Additional Niche & Regional
      { name: 'Crunchyroll', url: `https://www.crunchyroll.com/user/${username}`, category: 'Gaming' },
      { name: 'MyAnimeList', url: `https://myanimelist.net/profile/${username}`, category: 'Gaming' },
      { name: 'Letterboxd', url: `https://letterboxd.com/${username}`, category: 'Other' },
      { name: 'Goodreads', url: `https://www.goodreads.com/user/show/${username}`, category: 'Other' },
      { name: 'Last.fm', url: `https://www.last.fm/user/${username}`, category: 'Creative' },
      { name: 'Trakt', url: `https://trakt.tv/users/${username}`, category: 'Other' },
      { name: 'Untappd', url: `https://untappd.com/user/${username}`, category: 'Other' },
      { name: 'Strava', url: `https://www.strava.com/athletes/${username}`, category: 'Other' },
      { name: 'AllTrails', url: `https://www.alltrails.com/members/${username}`, category: 'Other' },
      { name: 'Komoot', url: `https://www.komoot.com/user/${username}`, category: 'Other' },
      { name: 'Geocaching', url: `https://www.geocaching.com/p/default.aspx?u=${username}`, category: 'Other' },
      
      // More Gaming
      { name: 'CurseForge', url: `https://www.curseforge.com/members/${username}`, category: 'Gaming' },
      { name: 'ModDB', url: `https://www.moddb.com/members/${username}`, category: 'Gaming' },
      { name: 'NexusMods', url: `https://www.nexusmods.com/users/${username}`, category: 'Gaming' },
      { name: 'Speedrun.com', url: `https://www.speedrun.com/user/${username}`, category: 'Gaming' },
      { name: 'Chess.com', url: `https://www.chess.com/member/${username}`, category: 'Gaming' },
      { name: 'Lichess', url: `https://lichess.org/@/${username}`, category: 'Gaming' },
      
      // More NSFW
      { name: 'BongaCams', url: `https://www.bongacams.com/${username}`, category: 'NSFW' },
      { name: 'Stripchat', url: `https://stripchat.com/${username}`, category: 'NSFW' },
      { name: 'LiveJasmin', url: `https://www.livejasmin.com/en/model/${username}`, category: 'NSFW' },
      { name: 'Camsoda', url: `https://www.camsoda.com/${username}`, category: 'NSFW' },
      { name: 'Modelhub', url: `https://www.modelhub.com/${username}`, category: 'NSFW' },
      { name: 'LoyalFans', url: `https://www.loyalfans.com/${username}`, category: 'NSFW' },
      { name: 'JustFor.Fans', url: `https://justfor.fans/${username}`, category: 'NSFW' },
      { name: 'AVN', url: `https://stars.avn.com/${username}`, category: 'NSFW' },
      
      // Niche Social
      { name: 'MeWe', url: `https://mewe.com/i/${username}`, category: 'Social' },
      { name: 'Vero', url: `https://vero.co/${username}`, category: 'Social' },
      { name: 'Ello', url: `https://ello.co/${username}`, category: 'Social' },
      { name: 'Steemit', url: `https://steemit.com/@${username}`, category: 'Social' },
      { name: 'Minds', url: `https://www.minds.com/${username}`, category: 'Social' },
      
      // Professional & Jobs
      { name: 'Crunchbase', url: `https://www.crunchbase.com/person/${username}`, category: 'Professional' },
      { name: 'Glassdoor', url: `https://www.glassdoor.com/profile/${username}`, category: 'Professional' },
      { name: 'Indeed', url: `https://www.indeed.com/p/${username}`, category: 'Professional' },
      { name: 'Monster', url: `https://www.monster.com/profile/${username}`, category: 'Professional' },
      { name: 'CareerBuilder', url: `https://www.careerbuilder.com/profile/${username}`, category: 'Professional' },
      { name: 'ZipRecruiter', url: `https://www.ziprecruiter.com/profile/${username}`, category: 'Professional' },
      { name: 'SimplyHired', url: `https://www.simplyhired.com/profile/${username}`, category: 'Professional' },
      { name: 'Dice', url: `https://www.dice.com/profile/${username}`, category: 'Professional' },
      { name: 'Hired', url: `https://hired.com/profile/${username}`, category: 'Professional' },
      { name: 'Triplebyte', url: `https://triplebyte.com/profile/${username}`, category: 'Professional' },
      { name: 'Remote.com', url: `https://remote.com/profile/${username}`, category: 'Professional' },
      { name: 'WeWorkRemotely', url: `https://weworkremotely.com/profile/${username}`, category: 'Professional' },
      { name: 'FlexJobs', url: `https://www.flexjobs.com/profile/${username}`, category: 'Professional' },
      { name: 'Remotive', url: `https://remotive.io/profile/${username}`, category: 'Professional' },
      { name: 'Jobspresso', url: `https://jobspresso.co/profile/${username}`, category: 'Professional' },
      { name: 'Outsourcely', url: `https://www.outsourcely.com/profile/${username}`, category: 'Professional' },
      { name: 'HubstaffTalent', url: `https://talent.hubstaff.com/profiles/${username}`, category: 'Professional' },
      
      // Tech & Dev
      { name: 'JSFiddle', url: `https://jsfiddle.net/user/${username}`, category: 'Tech' },
      { name: 'StackBlitz', url: `https://stackblitz.com/@${username}`, category: 'Tech' },
      { name: 'Replit', url: `https://replit.com/@${username}`, category: 'Tech' },
      { name: 'Glitch', url: `https://glitch.com/@${username}`, category: 'Tech' },
      { name: 'Codesandbox', url: `https://codesandbox.io/u/${username}`, category: 'Tech' },
      { name: 'SourceForge', url: `https://sourceforge.net/u/${username}`, category: 'Tech' },
      { name: 'Launchpad', url: `https://launchpad.net/~${username}`, category: 'Tech' },
      { name: 'Gitee', url: `https://gitee.com/${username}`, category: 'Tech' },
      { name: 'Coding.net', url: `https://coding.net/u/${username}`, category: 'Tech' },
      { name: 'Dev.to', url: `https://dev.to/${username}`, category: 'Tech' },
      { name: 'Hashnode', url: `https://hashnode.com/@${username}`, category: 'Tech' },
      { name: 'HackerNoon', url: `https://hackernoon.com/u/${username}`, category: 'Tech' },
      { name: 'FreeCodeCamp', url: `https://www.freecodecamp.org/${username}`, category: 'Tech' },
      { name: 'Codecademy', url: `https://www.codecademy.com/profiles/${username}`, category: 'Tech' },
      { name: 'Coursera', url: `https://www.coursera.org/user/${username}`, category: 'Tech' },
      { name: 'edX', url: `https://www.edx.org/user/${username}`, category: 'Tech' },
      { name: 'Udacity', url: `https://www.udacity.com/user/${username}`, category: 'Tech' },
      { name: 'Udemy', url: `https://www.udemy.com/user/${username}`, category: 'Tech' },
      { name: 'Pluralsight', url: `https://www.pluralsight.com/profile/${username}`, category: 'Tech' },
      { name: 'Skillshare', url: `https://www.skillshare.com/user/${username}`, category: 'Tech' },
      { name: 'MasterClass', url: `https://www.masterclass.com/user/${username}`, category: 'Tech' },
      { name: 'KhanAcademy', url: `https://www.khanacademy.org/profile/${username}`, category: 'Tech' },
      
      // More NSFW
      { name: 'YouJizz', url: `https://www.youjizz.com/users/${username}`, category: 'NSFW' },
      { name: 'SpankBang', url: `https://spankbang.com/profile/${username}`, category: 'NSFW' },
      { name: 'XTube', url: `https://www.xtube.com/profile/${username}`, category: 'NSFW' },
      { name: 'PornerBros', url: `https://www.pornerbros.com/users/${username}`, category: 'NSFW' },
      { name: 'PornHD', url: `https://www.pornhd.com/users/${username}`, category: 'NSFW' },
      { name: 'PornRabbit', url: `https://www.pornrabbit.com/users/${username}`, category: 'NSFW' },
      { name: 'PornMD', url: `https://www.pornmd.com/users/${username}`, category: 'NSFW' },
      { name: 'PornDig', url: `https://www.porndig.com/users/${username}`, category: 'NSFW' },
      { name: 'PornDrive', url: `https://www.porndrive.com/users/${username}`, category: 'NSFW' },
      { name: 'PornHeed', url: `https://www.pornheed.com/users/${username}`, category: 'NSFW' },
      { name: 'PornKee', url: `https://www.pornkee.com/users/${username}`, category: 'NSFW' },
      { name: 'PornKyu', url: `https://www.pornkyu.com/users/${username}`, category: 'NSFW' },
      { name: 'PornLuv', url: `https://www.pornluv.com/users/${username}`, category: 'NSFW' },
      { name: 'PornMuz', url: `https://www.pornmuz.com/users/${username}`, category: 'NSFW' },
      { name: 'PornOat', url: `https://www.pornoat.com/users/${username}`, category: 'NSFW' },
      { name: 'PornPics', url: `https://www.pornpics.com/users/${username}`, category: 'NSFW' },
      { name: 'PornRox', url: `https://www.pornrox.com/users/${username}`, category: 'NSFW' },
      { name: 'PornStar', url: `https://www.pornstar.com/users/${username}`, category: 'NSFW' },
      { name: 'PornTube', url: `https://www.porntube.com/users/${username}`, category: 'NSFW' },
      { name: 'PornVibe', url: `https://www.pornvibe.com/users/${username}`, category: 'NSFW' },
      { name: 'PornX', url: `https://www.pornx.com/users/${username}`, category: 'NSFW' },
      { name: 'PornZ', url: `https://www.pornz.com/users/${username}`, category: 'NSFW' },
      { name: 'MyFreeCams', url: `https://profiles.myfreecams.com/${username}`, category: 'NSFW' },
      { name: 'ImLive', url: `https://www.imlive.com/profile/${username}`, category: 'NSFW' },
      { name: 'FapHouse', url: `https://faphouse.com/users/${username}`, category: 'NSFW' },
      { name: 'PornTrex', url: `https://www.porntrex.com/users/${username}`, category: 'NSFW' },
      { name: 'DaftSex', url: `https://daftsex.com/users/${username}`, category: 'NSFW' },
      { name: 'HQPorner', url: `https://hqporner.com/users/${username}`, category: 'NSFW' },
      { name: 'XHamsterLive', url: `https://xhamsterlive.com/${username}`, category: 'NSFW' },
      { name: 'CamZap', url: `https://camzap.com/${username}`, category: 'NSFW' },
      { name: 'ChatRandom', url: `https://chatrandom.com/${username}`, category: 'NSFW' },
      { name: 'Bazoocam', url: `https://bazoocam.org/${username}`, category: 'NSFW' },
      { name: 'DirtyRoulette', url: `https://dirtyroulette.com/${username}`, category: 'NSFW' },
      { name: 'Camsurf', url: `https://camsurf.com/${username}`, category: 'NSFW' },
      { name: 'Shagle', url: `https://shagle.com/${username}`, category: 'NSFW' },
      { name: 'EmeraldChat', url: `https://www.emeraldchat.com/${username}`, category: 'NSFW' },
      { name: 'Ome.tv', url: `https://ome.tv/${username}`, category: 'NSFW' },
      { name: 'CooMeet', url: `https://coomeet.com/${username}`, category: 'NSFW' },
      { name: 'Flingster', url: `https://flingster.com/${username}`, category: 'NSFW' },
      { name: 'AdultChat', url: `https://adultchat.com/${username}`, category: 'NSFW' },
      { name: 'Sex.com', url: `https://www.sex.com/user/${username}`, category: 'NSFW' },
      
      { name: 'Redfin', url: `https://www.redfin.com/profile/${username}`, category: 'Other' },
      { name: 'Realtor.com', url: `https://www.realtor.com/profile/${username}`, category: 'Other' },
      { name: 'Trulia', url: `https://www.trulia.com/profile/${username}`, category: 'Other' },
      { name: 'StreetClams', url: `https://streetclams.com/user/${username}`, category: 'Other' },
      { name: 'City-Data', url: `https://www.city-data.com/forum/member.php?u=${username}`, category: 'Other' },
      { name: 'Topix', url: `https://www.topix.com/user/profile/${username}`, category: 'Other' },
      { name: 'Fark', url: `https://www.fark.com/cgi/profile.pl?user=${username}`, category: 'Other' },
      { name: 'Slashdot', url: `https://slashdot.org/~${username}`, category: 'Other' },
      { name: 'Digg', url: `https://digg.com/@${username}`, category: 'Other' },
      { name: 'NewsVine', url: `https://www.newsvine.com/_users/${username}`, category: 'Other' },
      
      // Gaming & Mods
      { name: 'Speedrun.com', url: `https://www.speedrun.com/user/${username}`, category: 'Gaming' },
      { name: 'NexusMods', url: `https://www.nexusmods.com/users/${username}`, category: 'Gaming' },
      { name: 'CurseForge', url: `https://www.curseforge.com/members/${username}`, category: 'Gaming' },
      { name: 'ModDB', url: `https://www.moddb.com/members/${username}`, category: 'Gaming' },
      { name: 'GameJolt', url: `https://gamejolt.com/@${username}`, category: 'Gaming' },
      { name: 'Itch.io', url: `https://${username}.itch.io`, category: 'Gaming' },
      { name: 'Kongregate', url: `https://www.kongregate.com/accounts/${username}`, category: 'Gaming' },
      { name: 'Newgrounds', url: `https://${username}.newgrounds.com`, category: 'Gaming' },
      { name: 'ArmorGames', url: `https://armorgames.com/user/${username}`, category: 'Gaming' },
      { name: 'MiniClip', url: `https://www.miniclip.com/user/${username}`, category: 'Gaming' },
      { name: 'Ubisoft', url: `https://ubisoftconnect.com/en-US/profile/${username}`, category: 'Gaming' },
      { name: 'RockstarGames', url: `https://socialclub.rockstargames.com/member/${username}`, category: 'Gaming' },
      { name: 'Blizzard', url: `https://worldofwarcraft.com/en-us/character/us/server/${username}`, category: 'Gaming' },
      { name: 'RiotGames', url: `https://tracker.gg/valorant/profile/riot/${username}`, category: 'Gaming' },
      { name: 'Bungie', url: `https://www.bungie.net/en/Profile/${username}`, category: 'Gaming' },
      { name: 'PathOfExile', url: `https://www.pathofexile.com/account/view-profile/${username}`, category: 'Gaming' },
      { name: 'Warframe', url: `https://forums.warframe.com/profile/${username}`, category: 'Gaming' },
      { name: 'EveOnline', url: `https://evewho.com/character/${username}`, category: 'Gaming' },
      
      // Crypto & Web3
      { name: 'OpenSea', url: `https://opensea.io/${username}`, category: 'Crypto' },
      { name: 'Rarible', url: `https://rarible.com/${username}`, category: 'Crypto' },
      { name: 'Foundation', url: `https://foundation.app/@${username}`, category: 'Crypto' },
      { name: 'SuperRare', url: `https://superrare.com/${username}`, category: 'Crypto' },
      { name: 'LooksRare', url: `https://looksrare.org/accounts/${username}`, category: 'Crypto' },
      { name: 'MagicEden', url: `https://magiceden.io/u/${username}`, category: 'Crypto' },
      { name: 'CoinMarketCap', url: `https://coinmarketcap.com/community/profile/${username}`, category: 'Crypto' },
      { name: 'Binance', url: `https://www.binance.com/en/feed/profile/${username}`, category: 'Crypto' },
      { name: 'Coinbase', url: `https://www.coinbase.com/profiles/${username}`, category: 'Crypto' },
      
      // Hobbies & Fitness
      { name: 'Fitbit', url: `https://www.fitbit.com/user/${username}`, category: 'Other' },
      { name: 'Garmin', url: `https://connect.garmin.com/modern/profile/${username}`, category: 'Other' },
      { name: 'MyFitnessPal', url: `https://www.myfitnesspal.com/profile/${username}`, category: 'Other' },
      { name: 'TrainingPeaks', url: `https://www.trainingpeaks.com/profile/${username}`, category: 'Other' },
      { name: 'MapMyRun', url: `https://www.mapmyrun.com/profile/${username}`, category: 'Other' },
      { name: 'Runkeeper', url: `https://runkeeper.com/user/${username}`, category: 'Other' },
      { name: 'Peloton', url: `https://www.onepeloton.com/profile/${username}`, category: 'Other' },
      { name: 'Zwift', url: `https://www.zwift.com/athlete/${username}`, category: 'Other' },
      { name: 'Chess.com', url: `https://www.chess.com/member/${username}`, category: 'Gaming' },
      { name: 'Lichess', url: `https://lichess.org/@/${username}`, category: 'Gaming' },
      { name: 'BoardGameGeek', url: `https://boardgamegeek.com/user/${username}`, category: 'Gaming' },
      { name: 'ReverbNation', url: `https://www.reverbnation.com/${username}`, category: 'Other' },
      { name: 'AudioMack', url: `https://audiomack.com/${username}`, category: 'Other' },
      { name: 'Spotify', url: `https://open.spotify.com/user/${username}`, category: 'Other' },
      { name: 'Deezer', url: `https://www.deezer.com/en/profile/${username}`, category: 'Other' },
      { name: 'Tidal', url: `https://tidal.com/user/${username}`, category: 'Other' },
      
      // Specialized Forums & Communities
      { name: 'XDA-Developers', url: `https://forum.xda-developers.com/m/${username}`, category: 'Tech' },
      { name: 'MacRumors', url: `https://forums.macrumors.com/members/${username}`, category: 'Tech' },
      { name: 'Overclock.net', url: `https://www.overclock.net/members/${username}`, category: 'Tech' },
      { name: 'LinusTechTips', url: `https://linustechtips.com/profile/${username}`, category: 'Tech' },
      { name: 'TomsHardware', url: `https://forums.tomshardware.com/members/${username}`, category: 'Tech' },
      { name: 'Neowin', url: `https://www.neowin.net/forum/profile/${username}`, category: 'Tech' },
      { name: 'HardForum', url: `https://hardforum.com/members/${username}`, category: 'Tech' },
      { name: 'Guru3D', url: `https://forums.guru3d.com/members/${username}`, category: 'Tech' },
      { name: 'TechPowerUp', url: `https://www.techpowerup.com/forums/members/${username}`, category: 'Tech' },
      { name: 'PCPartPicker', url: `https://pcpartpicker.com/user/${username}`, category: 'Tech' },
      { name: 'Head-Fi', url: `https://www.head-fi.org/members/${username}`, category: 'Other' },
      { name: 'AVSForum', url: `https://www.avsforum.com/members/${username}`, category: 'Other' },
      { name: 'Blu-ray.com', url: `https://www.blu-ray.com/community/profile.php?u=${username}`, category: 'Other' },
      { name: 'DigitalSpy', url: `https://forums.digitalspy.com/profile/${username}`, category: 'Other' },
      { name: 'PistonHeads', url: `https://www.pistonheads.com/gassing/profile.asp?memberId=${username}`, category: 'Other' },
      { name: 'BimmerPost', url: `https://www.bimmerpost.com/forums/member.php?u=${username}`, category: 'Other' },
      { name: 'Rennlist', url: `https://rennlist.com/forums/members/${username}`, category: 'Other' },
      { name: 'TeslaMotorsClub', url: `https://teslamotorsclub.com/tmc/members/${username}`, category: 'Other' },
      { name: 'FlyerTalk', url: `https://www.flyertalk.com/forum/members/${username}`, category: 'Other' },
      { name: 'NomadList', url: `https://nomadlist.com/@${username}`, category: 'Other' },
      { name: 'InterNations', url: `https://www.internations.org/profile/${username}`, category: 'Other' },
      { name: 'Expat.com', url: `https://www.expat.com/en/destination/member/${username}`, category: 'Other' },
      { name: 'Eventbrite', url: `https://www.eventbrite.com/o/${username}`, category: 'Other' },
      
      // More NSFW
      { name: 'Mofos', url: `https://www.mofos.com/profile/${username}`, category: 'NSFW' },
      { name: 'Babes', url: `https://www.babes.com/profile/${username}`, category: 'NSFW' },
      { name: 'Twistys', url: `https://www.twistys.com/profile/${username}`, category: 'NSFW' },
      { name: 'TrueAmateur', url: `https://www.trueamateur.com/profile/${username}`, category: 'NSFW' },
      { name: 'DigitalPlayground', url: `https://www.digitalplayground.com/profile/${username}`, category: 'NSFW' },
      { name: 'Men.com', url: `https://www.men.com/profile/${username}`, category: 'NSFW' },
      { name: 'SeanCody', url: `https://www.seancody.com/profile/${username}`, category: 'NSFW' },
      { name: 'BelAmi', url: `https://www.belami.com/profile/${username}`, category: 'NSFW' },
      { name: 'CorbinFisher', url: `https://www.corbinfisher.com/profile/${username}`, category: 'NSFW' },
      { name: 'NextDoorStudios', url: `https://www.nextdoorstudios.com/profile/${username}`, category: 'NSFW' },
      { name: 'HelixStudios', url: `https://www.helixstudios.com/profile/${username}`, category: 'NSFW' },
      { name: 'FalconStudios', url: `https://www.falconstudios.com/profile/${username}`, category: 'NSFW' },
      { name: 'LucasEntertainment', url: `https://www.lucasentertainment.com/profile/${username}`, category: 'NSFW' },
      { name: 'CockyBoys', url: `https://www.cockyboys.com/profile/${username}`, category: 'NSFW' },
      { name: 'TreasureIslandMedia', url: `https://www.treasureislandmedia.com/profile/${username}`, category: 'NSFW' },
      
      // Additional Social & Chat
      { name: 'Mastodon', url: `https://mastodon.social/@${username}`, category: 'Social' },
      { name: 'Threads', url: `https://www.threads.net/@${username}`, category: 'Social' },
      { name: 'Bluesky', url: `https://bsky.app/profile/${username}`, category: 'Social' },
      { name: 'VK', url: `https://vk.com/${username}`, category: 'Social' },
      { name: 'OK.ru', url: `https://ok.ru/${username}`, category: 'Social' },
      { name: 'Weibo', url: `https://weibo.com/${username}`, category: 'Social' },
      { name: 'Gab', url: `https://gab.com/${username}`, category: 'Social' },
      { name: 'Gettr', url: `https://gettr.com/${username}`, category: 'Social' },
      { name: 'TruthSocial', url: `https://truthsocial.com/@${username}`, category: 'Social' },
      { name: 'BeReal', url: `https://bere.al/${username}`, category: 'Social' },
      { name: 'Lemon8', url: `https://www.lemon8-app.com/${username}`, category: 'Social' },
      { name: 'Mewe', url: `https://mewe.com/i/${username}`, category: 'Social' },
      { name: 'Parler', url: `https://parler.com/profile/${username}`, category: 'Social' },
      { name: 'Rumble', url: `https://rumble.com/user/${username}`, category: 'Social' },
      { name: 'Odysee', url: `https://odysee.com/@${username}`, category: 'Social' },
      { name: 'Bitchute', url: `https://www.bitchute.com/channel/${username}`, category: 'Social' },
      { name: 'Dailymotion', url: `https://www.dailymotion.com/${username}`, category: 'Social' },
      
      // Additional Dating
      { name: 'eHarmony', url: `https://www.eharmony.com/profile/${username}`, category: 'Dating' },
      { name: 'EliteSingles', url: `https://www.elitesingles.com/profile/${username}`, category: 'Dating' },
      { name: 'SilverSingles', url: `https://www.silversingles.com/profile/${username}`, category: 'Dating' },
      { name: 'ChristianMingle', url: `https://www.christianmingle.com/profile/${username}`, category: 'Dating' },
      { name: 'JDate', url: `https://www.jdate.com/profile/${username}`, category: 'Dating' },
      { name: 'BlackPeopleMeet', url: `https://www.blackpeoplemeet.com/profile/${username}`, category: 'Dating' },
      { name: 'OurTime', url: `https://www.ourtime.com/profile/${username}`, category: 'Dating' },
      { name: 'Farmersonly', url: `https://www.farmersonly.com/profile/${username}`, category: 'Dating' },
      { name: 'Feeld', url: `https://feeld.co/user/${username}`, category: 'Dating' },
      { name: 'Pure', url: `https://pure.app/user/${username}`, category: 'Dating' },
      { name: 'CasualX', url: `https://casualx.app/user/${username}`, category: 'Dating' },
      { name: 'Tantan', url: `https://tantanapp.com/user/${username}`, category: 'Dating' },
      { name: 'Soul', url: `https://soulapp.me/user/${username}`, category: 'Dating' },
      { name: 'Blued', url: `https://www.blued.com/user/${username}`, category: 'Dating' },
      
      // Additional NSFW
      { name: 'RedTube', url: `https://www.redtube.com/users/${username}`, category: 'NSFW' },
      { name: 'YouPorn', url: `https://www.youporn.com/users/${username}`, category: 'NSFW' },
      { name: 'Tube8', url: `https://www.tube8.com/users/${username}`, category: 'NSFW' },
      { name: 'Eporner', url: `https://www.eporner.com/profile/${username}`, category: 'NSFW' },
      { name: 'TNAFlix', url: `https://www.tnaflix.com/profile/${username}`, category: 'NSFW' },
      { name: 'Motherless', url: `https://motherless.com/u/${username}`, category: 'NSFW' },
      { name: 'Heavy-R', url: `https://www.heavy-r.com/user/${username}`, category: 'NSFW' },
      { name: 'EFukt', url: `https://efukt.com/user/${username}`, category: 'NSFW' },
      { name: 'TheYNC', url: `https://theync.com/user/${username}`, category: 'NSFW' },
      { name: 'Kaotic', url: `https://www.kaotic.com/user/${username}`, category: 'NSFW' },
      { name: 'GoreGrish', url: `https://goregrish.com/user/${username}`, category: 'NSFW' },
      { name: 'Rule34', url: `https://rule34.xxx/index.php?page=account&s=profile&uname=${username}`, category: 'NSFW' },
      { name: 'Gelbooru', url: `https://gelbooru.com/index.php?page=account&s=profile&uname=${username}`, category: 'NSFW' },
      { name: 'Danbooru', url: `https://danbooru.donmai.us/users/${username}`, category: 'NSFW' },
      { name: 'E621', url: `https://e621.net/users/${username}`, category: 'NSFW' },
      { name: 'FurAffinity', url: `https://www.furaffinity.net/user/${username}`, category: 'NSFW' },
      { name: 'Inkbunny', url: `https://inkbunny.net/${username}`, category: 'NSFW' },
      { name: 'Hentai-Foundry', url: `https://www.hentai-foundry.com/user/${username}`, category: 'NSFW' },
      { name: 'NHentai', url: `https://nhentai.net/users/${username}`, category: 'NSFW' },
      { name: 'Hitomi.la', url: `https://hitomi.la/users/${username}`, category: 'NSFW' },
      { name: 'Tsumino', url: `https://www.tsumino.com/users/${username}`, category: 'NSFW' },
      { name: 'Pururin', url: `https://pururin.to/users/${username}`, category: 'NSFW' },
      { name: 'E-Hentai', url: `https://e-hentai.org/u/${username}`, category: 'NSFW' },
      { name: 'HAnime', url: `https://hanime.tv/users/${username}`, category: 'NSFW' },
      { name: 'HentaiHaven', url: `https://hentaihaven.xxx/users/${username}`, category: 'NSFW' },
      { name: 'MultPorn', url: `https://multporn.net/users/${username}`, category: 'NSFW' },
      { name: '8Muses', url: `https://www.8muses.com/user/${username}`, category: 'NSFW' },
      { name: 'Doujins', url: `https://doujins.com/users/${username}`, category: 'NSFW' },
      { name: 'Fanvue', url: `https://fanvue.com/${username}`, category: 'NSFW' },
      { name: 'ModelCenter', url: `https://modelcenter.com/${username}`, category: 'NSFW' },
      { name: 'PocketStars', url: `https://pocketstars.com/${username}`, category: 'NSFW' },
      { name: 'AVNStars', url: `https://stars.avn.com/${username}`, category: 'NSFW' },
      { name: 'JustFor.Fans', url: `https://justfor.fans/${username}`, category: 'NSFW' },
      { name: 'Slushy', url: `https://slushy.com/${username}`, category: 'NSFW' },
      { name: 'My.Club', url: `https://my.club/${username}`, category: 'NSFW' },
      { name: 'AdultNode', url: `https://adultnode.com/${username}`, category: 'NSFW' },
      { name: 'AllMyLinks', url: `https://allmylinks.com/${username}`, category: 'NSFW' },
      { name: 'Linktree', url: `https://linktr.ee/${username}`, category: 'NSFW' },
      { name: 'Beacons', url: `https://beacons.ai/${username}`, category: 'NSFW' },
      { name: 'Campsite', url: `https://campsite.bio/${username}`, category: 'NSFW' },
      { name: 'Milkshake', url: `https://msha.ke/${username}`, category: 'NSFW' },
      { name: 'Solo.to', url: `https://solo.to/${username}`, category: 'NSFW' },
    ];

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
    const socialScanTimeout = new Promise((_, reject) => 
      timeoutId = setTimeout(() => reject(new Error('Social scan timed out')), 180000)
    );

    try {
      const results = await Promise.race([
        Promise.all(sites.map((site) => socialLimit(async () => {
          if (isCancelled) return { name: site.name, url: site.url, category: site.category, status: 'Cancelled' };
          try {
            await sleep(Math.random() * 200 + 50); // Reduced jitter for faster scans
            const response = await axios.get(site.url, { 
              timeout: 8000, 
              maxContentLength: 500000, // Limit to 500KB to save memory
              validateStatus: () => true,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
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
            'not a registered user'
          ];

          if (notFoundStrings.some(str => bodyLower.includes(str))) {
            isFound = false;
          }

          // Site-specific overrides
          if (site.name === 'Twitter' && (bodyLower.includes('this account doesn’t exist') || bodyLower.includes('account suspended'))) isFound = false;
          if (site.name === 'Instagram' && (bodyLower.includes('sorry, this page isn\'t available') || bodyLower.includes('link you followed may be broken'))) isFound = false;
          if (site.name === 'Reddit' && (bodyLower.includes('user not found') || bodyLower.includes('nobody on reddit goes by that name'))) isFound = false;
          if (site.name === 'TikTok' && (bodyLower.includes('couldn\'t find this account') || bodyLower.includes('this account is private'))) isFound = false;
          if (site.name === 'Snapchat' && bodyLower.includes('not found')) isFound = false;
          if (site.name === 'Pinterest' && (bodyLower.includes('user not found') || bodyLower.includes('resource not found'))) isFound = false;
          if (site.name === 'Steam' && bodyLower.includes('the specified profile could not be found')) isFound = false;
          if (site.name === 'Twitch' && (bodyLower.includes('content is not available') || bodyLower.includes('unless you have a time machine'))) isFound = false;
          if (site.name === 'GitHub' && (bodyLower.includes('not found') || bodyLower.includes('404'))) isFound = false;
          if (site.name === 'Facebook' && (bodyLower.includes('content isn\'t available') || bodyLower.includes('link you followed may be broken'))) isFound = false;
          if (site.name === 'LinkedIn' && (bodyLower.includes('page not found') || bodyLower.includes('profile not found'))) isFound = false;
          if (site.name === 'Tumblr' && (bodyLower.includes('nothing here') || bodyLower.includes('404'))) isFound = false;
          if (site.name === 'Medium' && (bodyLower.includes('out of nothing') || bodyLower.includes('404'))) isFound = false;
          if (site.name === 'SoundCloud' && (bodyLower.includes('can\'t find that user') || bodyLower.includes('404'))) isFound = false;
          if (site.name === 'Vimeo' && (bodyLower.includes('not found') || bodyLower.includes('404'))) isFound = false;
          if (site.name === 'Behance' && (bodyLower.includes('could not be found') || bodyLower.includes('404'))) isFound = false;
          if (site.name === 'Dribbble' && (bodyLower.includes('not found') || bodyLower.includes('404'))) isFound = false;
          if (site.name === 'Flickr' && (bodyLower.includes('not found') || bodyLower.includes('404'))) isFound = false;
          if (site.name === 'Patreon' && (bodyLower.includes('not found') || bodyLower.includes('404'))) isFound = false;
          if (site.name === 'OnlyFans' && (bodyLower.includes('not found') || bodyLower.includes('404'))) isFound = false;
        }

        let confidence = 0;
        if (isFound) {
          const $ = cheerio.load(body);
          const title = $('title').text().toLowerCase();
          const metaDesc = $('meta[name="description"]').attr('content')?.toLowerCase() || '';
          const metaOgTitle = $('meta[property="og:title"]').attr('content')?.toLowerCase() || '';
          
          const usernameLower = username.toLowerCase();
          const inTitle = title.includes(usernameLower);
          const inMeta = metaDesc.includes(usernameLower) || metaOgTitle.includes(usernameLower);
          
          if (inTitle) confidence += 50;
          if (inMeta) confidence += 30;
          if (bodyLower.includes(`/${usernameLower}`)) confidence += 20;

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
            'sign in to', 'join now to', 'create your profile'
          ];
          
          if (loginKeywords.some(kw => bodyLower.includes(kw)) && body.length < 15000) {
            const title = bodyLower.match(/<title>(.*?)<\/title>/)?.[1] || '';
            if (!title.includes(username.toLowerCase())) {
              isFound = false;
            } else {
              confidence -= 20;
            }
          }
          
          const searchKeywords = ['search results for', 'results for', 'showing results for', 'no results found for', 'find users'];
          if (searchKeywords.some(kw => bodyLower.includes(kw))) {
            isFound = false;
          }
        }

        // Filter out low confidence results unless they are site-specific overrides
        if (isFound && confidence < 20 && !['Twitter', 'GitHub', 'Instagram', 'Reddit'].includes(site.name)) {
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
        }))),
        socialScanTimeout
      ]) as any[];

      if (timeoutId) clearTimeout(timeoutId);
      
      if (isCancelled) {
        console.log(`[Social] Scan for ${username} was cancelled by client.`);
        return; // Don't send response if already closed
      }

      res.json(results.filter(r => r.status === 'Found' || r.status === 'Possible but Deleted' || r.status === 'Error'));
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
