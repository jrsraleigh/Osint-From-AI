import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import whois from 'whois-json';
import dns from 'dns';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';
import pLimit from 'p-limit';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  app.use(express.json());

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
          const feed = await parser.parseURL(f.url);
          return feed.items.map(item => ({
            ...item,
            source: f.name,
            sourceUrl: f.url
          }));
        } catch (e) {
          console.error(`Failed to fetch feed ${f.name}:`, e);
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
      console.error('News fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch news feed' });
    }
  });

  app.get('/api/osint/whois', async (req, res) => {
    const { target } = req.query;
    if (!target) return res.status(400).json({ error: 'Target required' });
    try {
      const results = await whois(target as string);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'WHOIS lookup failed' });
    }
  });

  app.get('/api/osint/dns', async (req, res) => {
    const { target } = req.query;
    if (!target) return res.status(400).json({ error: 'Target required' });
    try {
      dns.resolveAny(target as string, (err, addresses) => {
        if (err) return res.status(500).json({ error: 'DNS lookup failed' });
        res.json(addresses);
      });
    } catch (error) {
      res.status(500).json({ error: 'DNS lookup failed' });
    }
  });

  app.get('/api/osint/wayback-timeline', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    try {
      // Use Wayback CDX API to get snapshots
      const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url as string)}&output=json&fl=timestamp,statuscode&filter=statuscode:200&limit=500`;
      
      const response = await axios.get(cdxUrl, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OSINT-Hub/1.0'
        },
        validateStatus: (status) => status < 500 // Don't throw on 4xx
      });
      
      if (response.status === 403 || response.status === 429) {
        return res.status(response.status).json({ error: 'Wayback Machine is rate-limiting or blocking requests. Please try again later.' });
      }

      if (response.status === 503) {
        return res.status(503).json({ error: 'Wayback Machine is currently overloaded (503). Please try again later.' });
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

      res.json({
        firstSeen: formatDate(firstSeen),
        lastSeen: formatDate(lastSeen),
        count: snapshots.length,
        timeline: timestamps.map(ts => ({
          timestamp: ts,
          formattedDate: formatDate(ts),
          status: '200'
        }))
      });
    } catch (error) {
      console.error('Wayback timeline error:', error);
      res.status(500).json({ error: 'Failed to fetch Wayback timeline' });
    }
  });

  app.get('/api/osint/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    const query = String(q);
    const isDork = query.includes('site:') || query.includes('filetype:') || query.includes('intitle:') || query.includes('inurl:');

    try {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
      ];
      
      // Try Google first
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;
      const response = await axios.get(googleUrl, {
        headers: {
          'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const results: any[] = [];
      
      // Selectors for Google results
      const selectors = ['div.g', 'div.tF2Cxc', 'div.yuRUbf', 'div.kvH9C', 'div.Z26q7c', 'div.MjjYud'];
      
      selectors.forEach(selector => {
        $(selector).each((i, el) => {
          const title = $(el).find('h3').first().text().trim();
          const link = $(el).find('a').first().attr('href');
          const snippet = $(el).find('div.VwiC3b, .st, div.kb0Bcb, div.LGOjbe').first().text().trim();
          
          if (title && link && link.startsWith('http') && !results.find(r => r.link === link)) {
            results.push({ title, link, snippet, source: 'Google' });
          }
        });
      });
      
      // If Google fails or returns no results (could be blocked), try DuckDuckGo
      if (results.length === 0) {
        try {
          const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
          const ddgResponse = await axios.get(ddgUrl, {
            headers: { 'User-Agent': userAgents[0] },
            timeout: 8000
          });
          const $ddg = cheerio.load(ddgResponse.data);
          $ddg('.result').each((i, el) => {
            const title = $ddg(el).find('.result__title').text().trim();
            const link = $ddg(el).find('.result__a').attr('href');
            const snippet = $ddg(el).find('.result__snippet').text().trim();
            if (title && link) {
              const finalLink = link.startsWith('//') ? 'https:' + link : link;
              if (!results.find(r => r.link === finalLink)) {
                results.push({ 
                  title, 
                  link: finalLink, 
                  snippet,
                  source: 'DuckDuckGo'
                });
              }
            }
          });
        } catch (e) {
          console.error('DDG fallback failed:', e);
        }
      }

      // If still no results and it's a dork, try Bing (sometimes more lenient)
      if (results.length === 0 && isDork) {
        try {
          const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
          const bingResponse = await axios.get(bingUrl, {
            headers: { 'User-Agent': userAgents[1] },
            timeout: 8000
          });
          const $bing = cheerio.load(bingResponse.data);
          $bing('.b_algo').each((i, el) => {
            const title = $bing(el).find('h2').text().trim();
            const link = $bing(el).find('a').attr('href');
            const snippet = $bing(el).find('.b_caption p').text().trim();
            if (title && link && !results.find(r => r.link === link)) {
              results.push({ title, link, snippet, source: 'Bing' });
            }
          });
        } catch (e) {
          console.error('Bing fallback failed:', e);
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

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
      console.error('Article fetch error:', error);
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
        timeout: 15000,
        validateStatus: () => true
      });
      
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
    } catch (error) {
      console.error('Proxy tool error:', error);
      res.status(500).json({ error: 'Failed to proxy tool' });
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
      
      // Chat & Messaging
      { name: 'Telegram', url: `https://t.me/${username}`, category: 'Chat' },
      { name: 'Discord', url: `https://discord.com/users/${username}`, category: 'Chat' },
      { name: 'Kik', url: `https://ws2.kik.com/user/${username}`, category: 'Chat' },
      { name: 'Skype', url: `https://web.skype.com/live:${username}`, category: 'Chat' },
      { name: 'Slack', url: `https://${username}.slack.com`, category: 'Chat' },
      { name: 'Line', url: `https://line.me/ti/p/~${username}`, category: 'Chat' },
      { name: 'WeChat', url: `https://wechat.com/${username}`, category: 'Chat' },
      { name: 'Chatroulette', url: `https://chatroulette.com/user/${username}`, category: 'Chat' },
      { name: 'Tinychat', url: `https://tinychat.com/${username}`, category: 'Chat' },
      { name: 'Camfrog', url: `https://www.camfrog.com/en/profile/${username}`, category: 'Chat' },
      { name: 'Paltalk', url: `https://www.paltalk.com/people/${username}`, category: 'Chat' },
      { name: 'ICQ', url: `https://icq.im/${username}`, category: 'Chat' },
      { name: 'Mumble', url: `https://mumble.com/${username}`, category: 'Chat' },
      { name: 'TeamSpeak', url: `https://teamspeak.com/${username}`, category: 'Chat' },
      { name: 'Ventrilo', url: `https://ventrilo.com/${username}`, category: 'Chat' },
      { name: 'RaidCall', url: `https://raidcall.com/${username}`, category: 'Chat' },
      { name: 'Zello', url: `https://zello.me/${username}`, category: 'Chat' },
      { name: 'Voxer', url: `https://voxer.com/u/${username}`, category: 'Chat' },
      { name: 'Marco Polo', url: `https://marcopolo.me/u/${username}`, category: 'Chat' },
      { name: 'Viber', url: `https://viber.com/${username}`, category: 'Chat' },
      { name: 'Signal', url: `https://signal.me/#p/${username}`, category: 'Chat' },
      { name: 'Emerald Chat', url: `https://www.emeraldchat.com/user/${username}`, category: 'Chat' },
      { name: 'Monkey.app', url: `https://monkey.app/${username}`, category: 'Chat' },
      { name: 'Holla', url: `https://holla.world/${username}`, category: 'Chat' },
      { name: 'Azar', url: `https://azarlive.com/${username}`, category: 'Chat' },
      { name: 'Yubo', url: `https://yubo.live/en/profile/${username}`, category: 'Chat' },
      { name: 'Houseparty', url: `https://houseparty.com/user/${username}`, category: 'Chat' },
      { name: 'Wire', url: `https://app.wire.com/${username}`, category: 'Chat' },
      { name: 'Tox', url: `https://tox.chat/user/${username}`, category: 'Chat' },
      { name: 'Session', url: `https://getsession.org/user/${username}`, category: 'Chat' },
      { name: 'Briar', url: `https://briarproject.org/user/${username}`, category: 'Chat' },
      { name: 'Element', url: `https://app.element.io/#/user/${username}`, category: 'Chat' },
      { name: 'Rocket.Chat', url: `https://rocket.chat/${username}`, category: 'Chat' },
      { name: 'Gitter', url: `https://gitter.im/${username}`, category: 'Chat' },
      
      // Gaming
      { name: 'Steam', url: `https://steamcommunity.com/id/${username}`, category: 'Gaming' },
      { name: 'Twitch', url: `https://twitch.tv/${username}`, category: 'Gaming' },
      { name: 'Xbox', url: `https://xboxgamertag.com/search/${username}`, category: 'Gaming' },
      { name: 'PlayStation', url: `https://psnprofiles.com/${username}`, category: 'Gaming' },
      { name: 'Roblox', url: `https://www.roblox.com/user.aspx?username=${username}`, category: 'Gaming' },
      { name: 'Minecraft', url: `https://namemc.com/profile/${username}`, category: 'Gaming' },
      { name: 'Epic Games', url: `https://www.epicgames.com/id/api/v1/accounts/display-name/${username}`, category: 'Gaming' },
      { name: 'GOG', url: `https://www.gog.com/u/${username}`, category: 'Gaming' },
      { name: 'Itch.io', url: `https://${username}.itch.io`, category: 'Gaming' },
      { name: 'GameJolt', url: `https://gamejolt.com/@${username}`, category: 'Gaming' },
      { name: 'Nintendo', url: `https://miiverse.nintendo.net/users/${username}`, category: 'Gaming' },
      { name: 'Battle.net', url: `https://worldofwarcraft.com/en-us/character/${username}`, category: 'Gaming' },
      
      // Dating
      { name: 'Tinder', url: `https://tinder.com/@${username}`, category: 'Dating' },
      { name: 'Bumble', url: `https://bumble.com/@${username}`, category: 'Dating' },
      { name: 'OkCupid', url: `https://okcupid.com/profile/${username}`, category: 'Dating' },
      { name: 'Badoo', url: `https://badoo.com/en/profile/${username}`, category: 'Dating' },
      { name: 'Hinge', url: `https://hinge.co/${username}`, category: 'Dating' },
      { name: 'Plenty of Fish', url: `https://www.pof.com/viewprofile.aspx?profile_id=${username}`, category: 'Dating' },
      { name: 'Match', url: `https://www.match.com/profile/${username}`, category: 'Dating' },
      { name: 'AdultFriendFinder', url: `https://adultfriendfinder.com/p/member_profile.cgi?person_id=${username}`, category: 'Dating' },
      { name: 'Hi5', url: `https://www.hi5.com/profile.html?uid=${username}`, category: 'Dating' },
      { name: 'Tagged', url: `https://www.tagged.com/${username}`, category: 'Dating' },
      { name: 'Skout', url: `https://www.skout.com/profile/${username}`, category: 'Dating' },
      { name: 'MeetMe', url: `https://www.meetme.com/${username}`, category: 'Dating' },
      { name: 'Lovoo', url: `https://www.lovoo.com/profile/${username}`, category: 'Dating' },
      { name: 'Jaumo', url: `https://www.jaumo.com/user/${username}`, category: 'Dating' },
      { name: 'Twoo', url: `https://www.twoo.com/${username}`, category: 'Dating' },
      { name: 'Mamba', url: `https://mamba.ru/en/profile/${username}`, category: 'Dating' },
      { name: 'Ashley Madison', url: `https://www.ashleymadison.com/en-us/profile/${username}`, category: 'Dating' },
      { name: 'OurTime', url: `https://www.ourtime.com/profile/${username}`, category: 'Dating' },
      { name: 'BlackPeopleMeet', url: `https://www.blackpeoplemeet.com/profile/${username}`, category: 'Dating' },
      { name: 'SingleParentMeet', url: `https://www.singleparentmeet.com/profile/${username}`, category: 'Dating' },
      { name: 'SeniorPeopleMeet', url: `https://www.seniorpeoplemeet.com/profile/${username}`, category: 'Dating' },
      { name: 'EHarmony', url: `https://www.eharmony.com/profile/${username}`, category: 'Dating' },
      { name: 'Coffee Meets Bagel', url: `https://coffeemeetsbagel.com/profile/${username}`, category: 'Dating' },
      { name: 'Happn', url: `https://www.happn.com/en/user/${username}`, category: 'Dating' },
      { name: 'Grindr', url: `https://www.grindr.com/profile/${username}`, category: 'Dating' },
      { name: 'Scruff', url: `https://www.scruff.com/profile/${username}`, category: 'Dating' },
      { name: 'Jack\'d', url: `https://www.jackd.com/profile/${username}`, category: 'Dating' },
      { name: 'HER', url: `https://weareher.com/profile/${username}`, category: 'Dating' },
      { name: 'Taimi', url: `https://taimi.com/profile/${username}`, category: 'Dating' },
      { name: 'Feeld', url: `https://feeld.co/profile/${username}`, category: 'Dating' },
      { name: 'Pure', url: `https://pure.app/profile/${username}`, category: 'Dating' },
      { name: 'KinkD', url: `https://www.kinkdapp.com/profile/${username}`, category: 'Dating' },
      { name: 'Whiplr', url: `https://whiplr.com/user/${username}`, category: 'Dating' },
      { name: 'FetLife', url: `https://fetlife.com/users/${username}`, category: 'Dating' },
      { name: 'Alt.com', url: `https://www.alt.com/profile/${username}`, category: 'Dating' },
      { name: 'Fling', url: `https://www.fling.com/profile/${username}`, category: 'Dating' },
      { name: 'BeNaughty', url: `https://www.benaughty.com/profile/${username}`, category: 'Dating' },
      { name: 'Christian Cafe', url: `https://www.christiancafe.com/profile/${username}`, category: 'Dating' },
      { name: 'JewishFriendFinder', url: `https://www.jewishfriendfinder.com/profile/${username}`, category: 'Dating' },
      { name: 'AsianFriendFinder', url: `https://www.asianfriendfinder.com/profile/${username}`, category: 'Dating' },
      { name: 'BlackFriendFinder', url: `https://www.blackfriendfinder.com/profile/${username}`, category: 'Dating' },
      { name: 'Amigos.com', url: `https://www.amigos.com/profile/${username}`, category: 'Dating' },
      { name: 'FriendFinder', url: `https://friendfinder.com/p/member_profile.cgi?person_id=${username}`, category: 'Dating' },
      { name: 'SeniorFriendFinder', url: `https://seniorfriendfinder.com/p/member_profile.cgi?person_id=${username}`, category: 'Dating' },
      { name: 'C-Date', url: `https://www.c-date.com/profile/${username}`, category: 'Dating' },
      { name: 'Victoria Milan', url: `https://www.victoriamilan.com/profile/${username}`, category: 'Dating' },
      { name: 'Illicit Encounters', url: `https://www.illicitencounters.com/profile/${username}`, category: 'Dating' },
      { name: 'Gleeden', url: `https://www.gleeden.com/profile/${username}`, category: 'Dating' },
      { name: 'CougarLife', url: `https://www.cougarlife.com/profile/${username}`, category: 'Dating' },
      { name: 'Christian Connection', url: `https://www.christianconnection.com/profile/${username}`, category: 'Dating' },
      { name: 'SingleMuslim', url: `https://www.singlemuslim.com/profile/${username}`, category: 'Dating' },
      { name: 'Muzz', url: `https://muzz.com/profile/${username}`, category: 'Dating' },
      { name: 'Salams', url: `https://www.salams.app/profile/${username}`, category: 'Dating' },
      { name: 'Dil Mil', url: `https://dilmil.co/profile/${username}`, category: 'Dating' },
      { name: 'Shaadi', url: `https://www.shaadi.com/profile/${username}`, category: 'Dating' },
      { name: 'BharatMatrimony', url: `https://www.bharatmatrimony.com/profile/${username}`, category: 'Dating' },
      { name: 'Jeevansathi', url: `https://www.jeevansathi.com/profile/${username}`, category: 'Dating' },
      { name: 'Sangam', url: `https://www.sangam.com/profile/${username}`, category: 'Dating' },
      { name: 'Aisle', url: `https://www.aisle.co/profile/${username}`, category: 'Dating' },
      { name: 'Woo', url: `https://www.getwooapp.com/profile/${username}`, category: 'Dating' },
      { name: 'TrulyMadly', url: `https://trulymadly.com/profile/${username}`, category: 'Dating' },
      { name: 'QuackQuack', url: `https://www.quackquack.in/profile/${username}`, category: 'Dating' },
      { name: 'Zoosk', url: `https://www.zoosk.com/profile/${username}`, category: 'Dating' },
      { name: 'ChristianMingle', url: `https://www.christianmingle.com/profile/${username}`, category: 'Dating' },
      { name: 'JDate', url: `https://www.jdate.com/profile/${username}`, category: 'Dating' },
      { name: 'SilverSingles', url: `https://www.silversingles.com/profile/${username}`, category: 'Dating' },
      { name: 'EliteSingles', url: `https://www.elitesingles.com/profile/${username}`, category: 'Dating' },
      { name: 'Clover', url: `https://www.clover.co/profile/${username}`, category: 'Dating' },
      { name: 'Seeking', url: `https://www.seeking.com/member/${username}`, category: 'Dating' },
      { name: 'SugarDaddie', url: `https://www.sugardaddie.com/profile/${username}`, category: 'Dating' },
      { name: 'DateMyAge', url: `https://www.datemyage.com/profile/${username}`, category: 'Dating' },
      { name: 'AmoLatina', url: `https://www.amolatina.com/profile/${username}`, category: 'Dating' },
      { name: 'ColombiaCupid', url: `https://www.colombiacupid.com/en/profile/${username}`, category: 'Dating' },
      { name: 'BrazilCupid', url: `https://www.brazilcupid.com/en/profile/${username}`, category: 'Dating' },
      { name: 'MexicanCupid', url: `https://www.mexicancupid.com/en/profile/${username}`, category: 'Dating' },
      { name: 'AfroIntroductions', url: `https://www.afrointroductions.com/en/profile/${username}`, category: 'Dating' },
      { name: 'AsianDating', url: `https://www.asiandating.com/en/profile/${username}`, category: 'Dating' },
      { name: 'Muslima', url: `https://www.muslima.com/en/profile/${username}`, category: 'Dating' },
      { name: 'ThaiCupid', url: `https://www.thaicupid.com/en/profile/${username}`, category: 'Dating' },
      { name: 'VietnamCupid', url: `https://www.vietnamcupid.com/en/profile/${username}`, category: 'Dating' },
      { name: 'FilipinoCupid', url: `https://www.filipinocupid.com/en/profile/${username}`, category: 'Dating' },
      { name: 'IndianCupid', url: `https://www.indiancupid.com/en/profile/${username}`, category: 'Dating' },
      { name: 'PinkCupid', url: `https://www.pinkcupid.com/en/profile/${username}`, category: 'Dating' },
      { name: 'GayCupid', url: `https://www.gaycupid.com/en/profile/${username}`, category: 'Dating' },
      { name: 'MilitaryCupid', url: `https://www.militarycupid.com/en/profile/${username}`, category: 'Dating' },
      { name: 'InterracialCupid', url: `https://www.interracialcupid.com/en/profile/${username}`, category: 'Dating' },
      
      // NSFW / Adult
      { name: 'OnlyFans', url: `https://onlyfans.com/${username}`, category: 'NSFW' },
      { name: 'Fansly', url: `https://fansly.com/${username}`, category: 'NSFW' },
      { name: 'Pornhub', url: `https://pornhub.com/users/${username}`, category: 'NSFW' },
      { name: 'XHamster', url: `https://xhamster.com/users/${username}`, category: 'NSFW' },
      { name: 'Chaturbate', url: `https://chaturbate.com/${username}`, category: 'NSFW' },
      { name: 'ManyVids', url: `https://www.manyvids.com/Profile/${username}`, category: 'NSFW' },
      { name: 'Cam4', url: `https://www.cam4.com/${username}`, category: 'NSFW' },
      { name: 'RedTube', url: `https://www.redtube.com/users/${username}`, category: 'NSFW' },
      { name: 'YouPorn', url: `https://www.youporn.com/users/${username}`, category: 'NSFW' },
      { name: 'XVideos', url: `https://www.xvideos.com/profiles/${username}`, category: 'NSFW' },
      
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
      
      // Lifestyle & Niche
      { name: 'Wikiloc', url: `https://www.wikiloc.com/wikiloc/user.do?id=${username}`, category: 'Other' },
      { name: 'Ingress', url: `https://ingress.com/profile/${username}`, category: 'Gaming' },
      { name: 'Pokemon', url: `https://www.pokemon.com/us/pokemon-trainer-club/profile/${username}`, category: 'Gaming' },
      { name: 'Duolingo', url: `https://www.duolingo.com/profile/${username}`, category: 'Other' },
      { name: 'Memrise', url: `https://www.memrise.com/user/${username}`, category: 'Other' },
      { name: 'Babbel', url: `https://www.babbel.com/profile/${username}`, category: 'Other' },
      { name: 'Busuu', url: `https://www.busuu.com/user/${username}`, category: 'Other' },
      { name: 'italki', url: `https://www.italki.com/user/${username}`, category: 'Other' },
      { name: 'Preply', url: `https://preply.com/en/tutor/${username}`, category: 'Other' },
      { name: 'Verbling', url: `https://www.verbling.com/teachers/${username}`, category: 'Other' },
      { name: 'HelloTalk', url: `https://www.hellotalk.com/user/${username}`, category: 'Other' },
      { name: 'Tandem', url: `https://www.tandem.net/profile/${username}`, category: 'Other' },
      { name: 'CouchSurfing', url: `https://www.couchsurfing.com/people/${username}`, category: 'Other' },
      { name: 'Trustpilot', url: `https://www.trustpilot.com/users/${username}`, category: 'Other' },
      { name: 'Yelp', url: `https://www.yelp.com/user_details?userid=${username}`, category: 'Other' },
      { name: 'TripAdvisor', url: `https://www.tripadvisor.com/Profile/${username}`, category: 'Other' },
      { name: 'Foursquare', url: `https://foursquare.com/user/${username}`, category: 'Other' },
      { name: 'Vivino', url: `https://www.vivino.com/users/${username}`, category: 'Other' },
      { name: 'CellarTracker', url: `https://www.cellartracker.com/user.asp?User=${username}`, category: 'Other' },
      { name: 'BeerAdvocate', url: `https://www.beeradvocate.com/user/profile/${username}`, category: 'Other' },
      { name: 'RateBeer', url: `https://www.ratebeer.com/user/${username}`, category: 'Other' },
      { name: 'AllRecipes', url: `https://www.allrecipes.com/cook/${username}`, category: 'Other' },
      { name: 'Cookpad', url: `https://cookpad.com/us/users/${username}`, category: 'Other' },
      { name: 'Yummly', url: `https://www.yummly.com/profile/${username}`, category: 'Other' },
      { name: 'Tasty', url: `https://tasty.co/profile/${username}`, category: 'Other' },
      { name: 'Food52', url: `https://food52.com/users/${username}`, category: 'Other' },
      { name: 'Epicurious', url: `https://www.epicurious.com/expert/${username}`, category: 'Other' },
      { name: 'BonAppetit', url: `https://www.bonappetit.com/contributor/${username}`, category: 'Other' },
      { name: 'SeriousEats', url: `https://www.seriouseats.com/user/${username}`, category: 'Other' },
      { name: 'TheKitchn', url: `https://www.thekitchn.com/author/${username}`, category: 'Other' },
      { name: 'ApartmentTherapy', url: `https://www.apartmenttherapy.com/author/${username}`, category: 'Other' },
      { name: 'Houzz', url: `https://www.houzz.com/user/${username}`, category: 'Other' },
      { name: 'Zillow', url: `https://www.zillow.com/profile/${username}`, category: 'Other' },
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
      
      // More Social & Media
      { name: 'Mix', url: `https://mix.com/${username}`, category: 'Social' },
      { name: 'WeHeartIt', url: `https://weheartit.com/${username}`, category: 'Social' },
      { name: 'Gab', url: `https://gab.com/${username}`, category: 'Social' },
      { name: 'Parler', url: `https://parler.com/profile/${username}`, category: 'Social' },
      { name: 'Gettr', url: `https://gettr.com/user/${username}`, category: 'Social' },
      { name: 'Rumble', url: `https://rumble.com/user/${username}`, category: 'Social' },
      { name: 'Odysee', url: `https://odysee.com/@${username}`, category: 'Social' },
      { name: 'Bitchute', url: `https://www.bitchute.com/channel/${username}`, category: 'Social' },
      { name: 'Dailymotion', url: `https://www.dailymotion.com/${username}`, category: 'Social' },
      { name: 'Letterboxd', url: `https://letterboxd.com/${username}`, category: 'Other' },
      { name: 'StoryGraph', url: `https://app.thestorygraph.com/profile/${username}`, category: 'Other' },
      { name: 'LibraryThing', url: `https://www.librarything.com/profile/${username}`, category: 'Other' },
      { name: 'RateYourMusic', url: `https://rateyourmusic.com/~${username}`, category: 'Other' },
      { name: 'AniList', url: `https://anilist.co/user/${username}`, category: 'Other' },
      { name: 'Kitsu', url: `https://kitsu.io/users/${username}`, category: 'Other' },
    ];

    if (queryLimit) {
      const limitVal = parseInt(String(queryLimit));
      if (!isNaN(limitVal) && limitVal > 0) {
        sites = sites.slice(0, limitVal);
      }
    }

    const limit = pLimit(20); // Increased concurrency
    const results = await Promise.all(sites.map((site) => limit(async () => {
      try {
        const response = await axios.get(site.url, { 
          timeout: 4000, // Reduced timeout for faster overall scan
          validateStatus: () => true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
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
            'this page is unavailable'
          ];

          if (notFoundStrings.some(str => bodyLower.includes(str))) {
            isFound = false;
          }

          // Site-specific overrides
          if (site.name === 'Twitter' && bodyLower.includes('this account doesn’t exist')) isFound = false;
          if (site.name === 'Instagram' && bodyLower.includes('sorry, this page isn\'t available')) isFound = false;
          if (site.name === 'Reddit' && bodyLower.includes('user not found')) isFound = false;
          if (site.name === 'TikTok' && bodyLower.includes('couldn\'t find this account')) isFound = false;
          if (site.name === 'Snapchat' && bodyLower.includes('not found')) isFound = false;
          if (site.name === 'Pinterest' && bodyLower.includes('user not found')) isFound = false;
          if (site.name === 'Steam' && bodyLower.includes('the specified profile could not be found')) isFound = false;
          if (site.name === 'Twitch' && bodyLower.includes('content is not available')) isFound = false;
          if (site.name === 'GitHub' && bodyLower.includes('not found')) isFound = false;
          if (site.name === 'Facebook' && bodyLower.includes('content isn\'t available')) isFound = false;
          if (site.name === 'LinkedIn' && bodyLower.includes('page not found')) isFound = false;
          if (site.name === 'Tumblr' && bodyLower.includes('nothing here')) isFound = false;
          if (site.name === 'Medium' && bodyLower.includes('out of nothing')) isFound = false;
          if (site.name === 'SoundCloud' && bodyLower.includes('can\'t find that user')) isFound = false;
          if (site.name === 'Vimeo' && bodyLower.includes('not found')) isFound = false;
          if (site.name === 'Behance' && bodyLower.includes('could not be found')) isFound = false;
          if (site.name === 'Dribbble' && bodyLower.includes('not found')) isFound = false;
          if (site.name === 'Flickr' && bodyLower.includes('not found')) isFound = false;
          if (site.name === 'Patreon' && bodyLower.includes('not found')) isFound = false;
          if (site.name === 'OnlyFans' && bodyLower.includes('not found')) isFound = false;
        }

        // Automatic Weeding: Check if username is actually in the page content
        // Most real profiles will mention the username in the title or meta tags
        if (isFound) {
          const $ = cheerio.load(body);
          const title = $('title').text().toLowerCase();
          const metaDesc = $('meta[name="description"]').attr('content')?.toLowerCase() || '';
          const metaOgTitle = $('meta[property="og:title"]').attr('content')?.toLowerCase() || '';
          
          const usernameLower = username.toLowerCase();
          const hasUsernameInMeta = title.includes(usernameLower) || 
                                   metaDesc.includes(usernameLower) || 
                                   metaOgTitle.includes(usernameLower);
          
          // If the username isn't in the metadata, we check the body more strictly
          if (!hasUsernameInMeta) {
            // Some sites don't put username in title, so we check body too
            // But we check for the username as a whole word or in a URL to avoid partial matches
            const usernameRegex = new RegExp(`\\b${usernameLower}\\b`, 'i');
            if (!usernameRegex.test(bodyLower) && !bodyLower.includes(`/${usernameLower}`)) {
              isFound = false;
            }
          }

          // Check for "Login" or "Sign Up" walls that return 200 OK
          const loginKeywords = [
            'login to continue', 
            'sign up to see', 
            'create an account', 
            'log in to your account', 
            'please log in', 
            'you must be logged in',
            'sign in to',
            'join now to',
            'create your profile'
          ];
          
          if (loginKeywords.some(kw => bodyLower.includes(kw)) && body.length < 15000) {
            // If it's a login wall and doesn't explicitly have the username in a strong place
            const title = bodyLower.match(/<title>(.*?)<\/title>/)?.[1] || '';
            if (!title.includes(username.toLowerCase())) {
              isFound = false;
            }
          }
          
          // Check for search pages that return 200 OK for any query
          const searchKeywords = ['search results for', 'results for', 'showing results for', 'no results found for', 'find users'];
          if (searchKeywords.some(kw => bodyLower.includes(kw))) {
            // If it's a search page, it's not a profile
            isFound = false;
          }
        }
        
        let finalStatus = isFound ? 'Found' : (isRedirectedToGeneric ? 'Possible but Deleted' : 'Not Found');
        
        // Basic Profile Extraction for popular sites
        let bio = '';
        let followers = '';
        let avatar = '';

        if (isFound) {
          const $ = cheerio.load(body);
          if (site.name === 'GitHub') {
            bio = $('.p-note.user-profile-bio').text().trim();
            followers = $('.Link--secondary.no-underline.no-wrap').first().text().trim();
            avatar = $('.avatar.avatar-user').attr('src') || '';
          } else if (site.name === 'Twitter') {
            bio = $('meta[name="description"]').attr('content') || '';
            avatar = $('meta[property="og:image"]').attr('content') || '';
          } else if (site.name === 'Instagram') {
            bio = $('meta[property="og:description"]').attr('content') || '';
            avatar = $('meta[property="og:image"]').attr('content') || '';
          } else if (site.name === 'Reddit') {
            bio = $('meta[name="description"]').attr('content') || '';
            avatar = $('meta[property="og:image"]').attr('content') || '';
            // Attempt to get karma from meta or body
            const karmaMatch = body.match(/(\d+[,.]?\d*)\s*karma/i);
            if (karmaMatch) followers = `${karmaMatch[1]} Karma`;
          } else if (site.name === 'YouTube') {
            bio = $('meta[name="description"]').attr('content') || '';
            avatar = $('meta[property="og:image"]').attr('content') || '';
            const subMatch = body.match(/(\d+[,.]?\d*[KMB]?)\s*subscribers/i);
            if (subMatch) followers = `${subMatch[1]} Subscribers`;
          } else if (site.name === 'TikTok') {
            bio = $('meta[name="description"]').attr('content') || '';
            avatar = $('meta[property="og:image"]').attr('content') || '';
            const followMatch = body.match(/(\d+[,.]?\d*[KMB]?)\s*Followers/i);
            if (followMatch) followers = `${followMatch[1]} Followers`;
          } else if (site.name === 'Pinterest') {
            bio = $('meta[name="description"]').attr('content') || '';
            avatar = $('meta[property="og:image"]').attr('content') || '';
            const followMatch = body.match(/(\d+[,.]?\d*[KMB]?)\s*followers/i);
            if (followMatch) followers = `${followMatch[1]} Followers`;
          } else if (site.name === 'Twitch') {
            bio = $('meta[name="description"]').attr('content') || '';
            avatar = $('meta[property="og:image"]').attr('content') || '';
            const followMatch = body.match(/(\d+[,.]?\d*[KMB]?)\s*followers/i);
            if (followMatch) followers = `${followMatch[1]} Followers`;
          } else if (site.name === 'Steam') {
            bio = $('.profile_summary').text().trim();
            avatar = $('.playerAvatarAutoSizeInner img').attr('src') || '';
            const levelMatch = $('.friendPlayerLevelNum').text().trim();
            if (levelMatch) followers = `Level ${levelMatch}`;
          } else if (site.name === 'Medium') {
            bio = $('meta[name="description"]').attr('content') || '';
            avatar = $('meta[property="og:image"]').attr('content') || '';
          } else if (site.name === 'SoundCloud') {
            bio = $('meta[name="description"]').attr('content') || '';
            avatar = $('meta[property="og:image"]').attr('content') || '';
          }
        }

        return { 
          name: site.name, 
          url: site.url, 
          category: site.category,
          status: finalStatus,
          bio,
          followers,
          avatar
        };
      } catch (error) {
        return { name: site.name, url: site.url, category: site.category, status: 'Error' };
      }
    })));

    res.json(results);
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
