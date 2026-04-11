import { OSINTTool, ToolGroup } from './types';

export const CATEGORY_SITES = {
  social: [
    'github.com', 'twitter.com', 'instagram.com', 'reddit.com', 'facebook.com', 'tiktok.com', 'pinterest.com', 'tumblr.com', 'snapchat.com', 'mastodon.social', 'vk.com', 'ok.ru', 'weibo.com', 'zhihu.com', 'tieba.baidu.com', 'mewe.com', 'gab.com', 'gettr.com', 'truthsocial.com', 'bere.al', 'lemon8-app.com', 'threads.net', 'bsky.app', 'cohost.org', 'post.news', 't2.social', 'hive.social', 'counter.social', 'parler.com', 'rumble.com', 'odysee.com', 'bitchute.com', 'dailymotion.com', 'bandcamp.com', 'mixcloud.com', 'discogs.com', 'rateyourmusic.com', '500px.com', 'unsplash.com', 'pexels.com', 'pixabay.com', 'shutterstock.com', 'myportfolio.com', 'canva.com', 'figma.com', 'sketch.com', 'invisionapp.com', 'zeplin.io', 'abstract.com', 'framer.com', 'webflow.com', 'linkedin.com', 'quora.com', 'flickr.com', 'vimeo.com', 'soundcloud.com', 'behance.net', 'dribbble.com', 'medium.com', 'deviantart.com', 'goodreads.com', 'last.fm', 'letterboxd.com', 'strava.com', 'komoot.com', 'alltrails.com', 'fitbit.com', 'myfitnesspal.com', 'duolingo.com', 'codecademy.com', 'freecodecamp.org', 'khanacademy.org', 'coursera.org', 'udemy.com', 'edx.org', 'skillshare.com'
  ],
  chat: [
    't.me', 'line.me', 'wechat.com', 'discord.com', 'kik.me', 'snapchat.com', 'icq.im', 'mumble.info', 'teamspeak.com', 'slack.com', 'rocket.chat', 'zulip.com', 'matrix.to', 'element.io', 'gitter.im', 'mattermost.com', 'wire.com', 'threema.ch', 'getsession.org', 'keybase.io', 'whatsapp.com', 'messenger.com', 'skype.com', 'viber.com', 'signal.org', 'telegram.org', 'kakao.com', 'zalo.me', 'imo.im', 'botim.me', 'toTok.ai', 'jitsi.org', 'zoom.us', 'google.com/hangouts', 'meet.google.com', 'teams.microsoft.com', 'webex.com', 'bluejeans.com', 'gotomeeting.com', 'discordapp.com', 'guilded.gg', 'revolt.chat', 'chitchat.gg', 'chatstep.com', 'tinychat.com', 'omegle.com', 'emeraldchat.com', 'chatroulette.com', 'bazoocam.org', 'dirtyroulette.com', 'chatrandom.com', 'shagle.com', 'froulette.com', 'camfrog.com', 'paltalk.com', 'raidcall.com', 'ventrilo.com', 'mumble.com', 'teamspeak.org', 'discord.gg', 'groups.google.com', 'groups.yahoo.com', 'discourse.org', 'vanillaforums.com', 'vbulletin.com', 'xenforo.com', 'phpbb.com', 'mybb.com', 'flarum.org', 'nodebb.org', 'viber.me', 'signal.me', 'wa.me', 't.me/s/'
  ],
  dating: [
    'tinder.com', 'bumble.com', 'hinge.co', 'okcupid.com', 'pof.com', 'match.com', 'zoosk.com', 'badoo.com', 'tagged.com', 'hi5.com', 'meetme.com', 'skout.com', 'lovoo.com', 'jaumo.com', 'mamba.ru', 'ashleymadison.com', 'seeking.com', 'sugarbook.com', 'secretbenefits.com', 'whatsyourprice.com', 'adultfriendfinder.com', 'coffeemeetsbagel.com', 'happn.com', 'grindr.com', 'scruff.com', 'jackd.com', 'hornet.com', 'weareher.com', 'eharmony.com', 'elitesingles.com', 'silversingles.com', 'christianmingle.com', 'jdate.com', 'blackpeoplemeet.com', 'ourtime.com', 'singleparentmeet.com', 'farmersonly.com', 'academic-singles.com', 'be2.com', 'parship.com', 'edarlin.com', 'meetic.com', 'lexa.nl', 'neu.de', 'loveaholics.com', 'naughtydate.com', 'benaughty.com', 'flirt.com', 'iamnaughty.com', 'casualx.app', 'pure.app', 'feeld.co', '3fun.app', '3somer.app', 'clover.co', 'tastebuds.fm', 'tantanapp.com', 'soulapp.me', 'blued.com', 'growlr.com', 'adam4adam.com', 'squirt.org', 'recon.com', 'fetlife.com', 'kink.com', 'alt.com', 'collarspace.com', 'darkyere.com', 'slayerment.com', 'vampirepassions.com', 'gothicmatch.com', 'emo-dating.com', 'gothscene.com', 'metalhead.dating'
  ],
  financial: [
    'venmo.com', 'cash.app', 'paypal.me', 'revolut.me', 'wise.com', 'zellepay.com', 'stripe.com', 'square.site', 'plaid.com', 'robinhood.com', 'coinbase.com', 'binance.com', 'kraken.com', 'kucoin.com', 'crypto.com', 'metamask.io', 'etherscan.io', 'bscscan.com', 'solscan.io', 'polygonscan.com', 'tradingview.com', 'stocktwits.com', 'seekingalpha.com', 'investing.com', 'marketwatch.com', 'finance.yahoo.com', 'bloomberg.com', 'forbes.com', 'fortune.com', 'cnbc.com', 'businessinsider.com', 'economist.com', 'ft.com', 'wsj.com'
  ],
  nsfw: [
    'onlyfans.com', 'fansly.com', 'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'chaturbate.com', 'cam4.com', 'bongacams.com', 'stripchat.com', 'livejasmin.com', 'manyvids.com', 'clips4sale.com', 'iwantclips.com', 'loyalfans.com', 'pocketstars.com', 'fapello.com', 'thothub.to', 'coomer.party', 'kemono.party', 'simpcity.su', 'vipergirls.to', 'planetsuzy.org', 'adultwork.com', 'escort-directory.com', 'eurogirlsescort.com', 'slixa.com', 'eros.com', 'yesbackpage.com', 'bedpage.com', 'cityxguide.com', 'rubratings.com', 'massageanywhere.com', 'listcrawler.com', 'skipthegames.com', 'megapersons.com', 'locanto.com', 'doublelist.com', 'squirt.org', 'adam4adam.com', 'fetlife.com', 'recon.com', 'kink.com', 'modelmayhem.com', 'purpleport.com', 'starnow.com', 'castingcall.club', 'backstage.com', 'redtube.com', 'youporn.com', 'tube8.com', 'spankbang.com', 'eporner.com', 'tnaflix.com', 'motherless.com', 'heavy-r.com', 'efukt.com', 'documentingreality.com', 'theync.com', 'kaotic.com', 'goregrish.com', 'crazyshit.com', 'rule34.xxx', 'gelbooru.com', 'danbooru.donmai.us', 'e621.net', 'furaffinity.net', 'inkbunny.net', 'pixiv.net', 'hentai-foundry.com', 'nhentai.net', 'hitomi.la', 'tsumino.com', 'pururin.to', 'e-hentai.org', 'hanime.tv', 'hentaihaven.xxx', 'multporn.net', '8muses.com', 'doujins.com'
  ],
  gaming: [
    'steamcommunity.com', 'xboxgamertag.com', 'psnprofiles.com', 'nintendo.com', 'epicgames.com', 'roblox.com', 'namemc.com', 'twitch.tv', 'kick.com', 'trovo.live', 'dlive.tv', 'battle.net', 'origin.com', 'uplay.com', 'gog.com', 'itch.io', 'gamejolt.com', 'nexusmods.com', 'curseforge.com', 'speedrun.com', 'tracker.gg', 'op.gg', 'faceit.com', 'play.esea.net', 'challengermode.com', 'battlefy.com', 'smash.gg', 'liquipedia.net', 'anilist.co', 'kitsu.io'
  ],
  voip: [
    'skype.com', 'viber.com', 'wa.me', 'signal.me', 'zello.me', 'voxer.com', 'voice.google.com', 'whatsapp.com', 'telegram.org', 'line.me', 'wechat.com', 'kakao.com', 'zalo.me', 'imo.im', 'botim.me', 'toTok.ai', 'signal.org', 'discord.com', 'slack.com', 'teams.microsoft.com', 'zoom.us', 'webex.com', 'bluejeans.com', 'gotomeeting.com', 'ringcentral.com', '8x8.com', 'vonage.com', 'dialpad.com', 'grasshopper.com', 'ooma.com', 'magicjack.com', 'net2phone.com', 'intermedia.com', 'nextiva.com', 'fuze.com', 'starleaf.com', 'lifesize.com', 'pumble.com', 'flock.com', 'ryver.com', 'twist.com', 'fleep.io', 'troopmessenger.com', 'brosix.com', 'outputmessenger.com', 'messenger.com', 'facebook.com/messenger', 'instagram.com/direct', 'twitter.com/messages', 'linkedin.com/messaging', 'snapchat.com/chat', 'tiktok.com/messages', 'reddit.com/chat', 'quora.com/messages', 'tumblr.com/messages', 'pinterest.com/messages', 'flickr.com/messages', 'vimeo.com/messages', 'soundcloud.com/messages', 'behance.net/messages', 'dribbble.com/messages', 'medium.com/messages', 'deviantart.com/messages', 'goodreads.com/messages', 'last.fm/messages', 'letterboxd.com/messages', 'strava.com/messages', 'komoot.com/messages', 'alltrails.com/messages', 'fitbit.com/messages', 'myfitnesspal.com/messages', 'duolingo.com/messages'
  ],
  texting: [
    'textnow.com', 'textfree.us', 'sideline.com', 'burnerapp.com', 'hushed.com', 'pinger.com', 'textplus.com', 'talkatone.com', 'dingtone.me', 'telosapp.com', 'freetone.com', 'textmeup.com', '2ndline.co', 'flyp.com', 'grooveip.com', 'line2.com', 'grasshopper.com', 'mightytext.net', 'pushbullet.com', 'joinjoaomgcd.appspot.com'
  ],
  selling: [
    'ebay.com', 'etsy.com', 'amazon.com', 'poshmark.com', 'mercari.com', 'depop.com', 'vinted.com', 'grailed.com', 'stockx.com', 'goat.com', 'offerup.com', 'letgo.com', 'craigslist.org', 'facebook.com', 'myshopify.com', 'mybigcommerce.com', 'gumroad.com', 'ko-fi.com', 'patreon.com', 'buymeacoffee.com', 'fanbox.cc', 'subscribestar.com', 'sellfy.com', 'payhip.com', 'sendowl.com', 'fetchapp.com'
  ],
  blog: [
    'medium.com', 'substack.com', 'wordpress.com', 'blogspot.com', 'tumblr.com', 'ghost.io', 'livejournal.com', 'dreamwidth.org', 'pillowfort.social', 'write.as', 'post.news', 'cohost.org', 'hashnode.com', 'dev.to', 'hackernoon.com', 'zhihu.com', 'quora.com', 'hubpages.com', 'steemit.com', 'minds.com', 'wixsite.com', 'squarespace.com', 'weebly.com', 'jimdosite.com', 'tilda.ws', 'webflow.io'
  ]
};

export const SOCIAL_DORK = 'site:instagram.com+OR+site:facebook.com+OR+site:twitter.com+OR+site:linkedin.com+OR+site:pinterest.com+OR+site:reddit.com+OR+site:github.com+OR+site:flickr.com+OR+site:vimeo.com+OR+site:soundcloud.com+OR+site:behance.net+OR+site:dribbble.com+OR+site:medium.com+OR+site:quora.com+OR+site:tumblr.com+OR+site:snapchat.com+OR+site:tiktok.com+OR+site:twitch.tv+OR+site:discord.com+OR+site:mastodon.social+OR+site:threads.net+OR+site:bluesky.social+OR+site:cohost.org+OR+site:post.news+OR+site:t2.social+OR+site:hive.social+OR+site:counter.social+OR+site:gab.com+OR+site:truthsocial.com+OR+site:parler.com+OR+site:gettr.com+OR+site:rumble.com+OR+site:odysee.com+OR+site:bitchute.com+OR+site:dailymotion.com';
export const NSFW_DORK = 'site:pornhub.com+OR+site:xvideos.com+OR+site:xnxx.com+OR+site:xhamster.com+OR+site:onlyfans.com+OR+site:fansly.com+OR+site:chaturbate.com+OR+site:cam4.com+OR+site:bongacams.com+OR+site:stripchat.com+OR+site:livejasmin.com+OR+site:manyvids.com+OR+site:clips4sale.com+OR+site:modelcenter.com+OR+site:iwantclips.com+OR+site:loyalfans.com+OR+site:pocketstars.com+OR+site:avn.com+OR+site:adultempire.com+OR+site:brazzers.com+OR+site:realitykings.com+OR+site:bangbros.com+OR+site:naughtyamerica.com+OR+site:porn.com+OR+site:redtube.com+OR+site:youporn.com+OR+site:tube8.com+OR+site:spankbang.com+OR+site:eporner.com+OR+site:tnaflix.com+OR+site:motherless.com+OR+site:heavy-r.com+OR+site:efukt.com+OR+site:documentingreality.com+OR+site:theync.com+OR+site:kaotic.com+OR+site:goregrish.com+OR+site:crazyshit.com+OR+site:fapello.com+OR+site:thothub.to+OR+site:coomer.party+OR+site:kemono.party+OR+site:simpcity.su+OR+site:vipergirls.to+OR+site:planetsuzy.org+OR+site:rule34.xxx+OR+site:gelbooru.com+OR+site:danbooru.donmai.us+OR+site:e621.net+OR+site:furaffinity.net+OR+site:inkbunny.net+OR+site:pixiv.net+OR+site:hentai-foundry.com+OR+site:nhentai.net+OR+site:hitomi.la+OR+site:tsumino.com+OR+site:pururin.to+OR+site:e-hentai.org+OR+site:hanime.tv+OR+site:hentaihaven.xxx+OR+site:multporn.net+OR+site:8muses.com+OR+site:doujins.com';
export const TECH_DORK = 'site:github.com+OR+site:gitlab.com+OR+site:bitbucket.org+OR+site:stackoverflow.com+OR+site:dev.to+OR+site:hashnode.com+OR+site:hackernoon.com+OR+site:freecodecamp.org+OR+site:codecademy.com+OR+site:coursera.org+OR+site:edx.org+OR+site:udacity.com+OR+site:udemy.com+OR+site:pluralsight.com+OR+site:skillshare.com+OR+site:masterclass.com+OR+site:khanacademy.org+OR+site:jsfiddle.net+OR+site:stackblitz.com+OR+site:replit.com+OR+site:glitch.com+OR+site:codesandbox.io+OR+site:sourceforge.net+OR+site:launchpad.net+OR+site:gitee.com+OR+site:coding.net';
export const MARKET_DORK = 'site:amazon.com+OR+site:ebay.com+OR+site:etsy.com+OR+site:shopify.com+OR+site:gumroad.com+OR+site:patreon.com+OR+site:buymeacoffee.com+OR+site:ko-fi.com+OR+site:substack.com+OR+site:ghost.org+OR+site:wordpress.com+OR+site:blogger.com+OR+site:livejournal.com+OR+site:dreamwidth.org+OR+site:pillowfort.social+OR+site:plurk.com+OR+site:weibo.com+OR+site:baidu.com+OR+site:zhihu.com+OR+site:douban.com+OR+site:xiaohongshu.com+OR+site:bilibili.com+OR+site:vk.com+OR+site:ok.ru+OR+site:telegram.org+OR+site:signal.org+OR+site:whatsapp.com+OR+site:line.me+OR+site:kakao.com+OR+site:viber.com+OR+site:skype.com+OR+site:meetup.com';
export const DATING_DORK = 'site:tinder.com+OR+site:bumble.com+OR+site:hinge.co+OR+site:okcupid.com+OR+site:pof.com+OR+site:match.com+OR+site:zoosk.com+OR+site:badoo.com+OR+site:tagged.com+OR+site:hi5.com+OR+site:meetme.com+OR+site:skout.com+OR+site:lovoo.com+OR+site:jaumo.com+OR+site:mamba.ru+OR+site:badoodata.com+OR+site:ashleymadison.com+OR+site:seeking.com+OR+site:sugarbook.com+OR+site:secretbenefits.com+OR+site:whatsyourprice.com+OR+site:missy.com+OR+site:adultfriendfinder.com+OR+site:alt.com+OR+site:fetlife.com+OR+site:recon.com+OR+site:kink.com';

export const GLOBAL_SOCIAL_NSFW_DORK = `${SOCIAL_DORK}+OR+${NSFW_DORK}+OR+${TECH_DORK}+OR+${MARKET_DORK}+OR+${DATING_DORK}`;



export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'g1',
    name: 'Identity Dossier',
    description: 'Username-based investigation to build a complete profile across social platforms.',
    toolIds: ['2', '19', '51'], // Sherlock, Maigret, Blackbird
    suggestedSequence: ['Sherlock', 'Maigret', 'Blackbird']
  },
  {
    id: 'g2',
    name: 'Breach & Security Check',
    description: 'Email-based investigation to check for compromised accounts and data leaks.',
    toolIds: ['6', '26', '18', '11', '63', '64', '65'], // HIBP, LeakCheck, Holehe, EPIEOS, Snusbase, DeHashed, Leak-Lookup
    suggestedSequence: ['Have I Been Pwned', 'LeakCheck', 'Holehe', 'EPIEOS', 'Snusbase', 'DeHashed']
  },
  {
    id: 'g3',
    name: 'Domain Reconnaissance',
    description: 'In-depth domain analysis including ownership, DNS, subdomains, and tech stack.',
    toolIds: ['10', '23', '43', '9'], // Whois, DNSDumpster, Sublist3r, BuiltWith
    suggestedSequence: ['Whois.com', 'DNSDumpster', 'Sublist3r', 'BuiltWith']
  },
  {
    id: 'g4',
    name: 'Visual Intelligence',
    description: 'Reverse image search and facial recognition to verify and locate visual assets.',
    toolIds: ['7', '31', '21'], // TinEye, Yandex, Search4Faces
    suggestedSequence: ['TinEye', 'Yandex Images', 'Search4Faces']
  },
  {
    id: 'g5',
    name: 'Geolocation & Mapping',
    description: 'Satellite imagery and environmental analysis to verify physical locations.',
    toolIds: ['14', '15', '29'], // Earth, OSM, SunCalc
    suggestedSequence: ['Google Earth', 'OpenStreetMap', 'SunCalc']
  },
  {
    id: 'g6',
    name: 'Email Intelligence',
    description: 'Comprehensive email analysis including social media presence, Google account data, and breach history.',
    toolIds: ['11', '18', '36', '6', '26', '10'], // EPIEOS, Holehe, GHunt, HIBP, LeakCheck, Whois
    suggestedSequence: ['EPIEOS', 'Holehe', 'GHunt', 'Have I Been Pwned', 'LeakCheck', 'Whois.com']
  },
  {
    id: 'g7',
    name: 'Domain Email Harvesting',
    description: 'Extract emails and subdomains from a target domain using multiple crawlers and search engines.',
    toolIds: ['1', '25', '38', '39'], // TheHarvester, Phonebook.cz, Photon, FinalRecon
    suggestedSequence: ['TheHarvester', 'Phonebook.cz', 'Photon', 'FinalRecon']
  },
  {
    id: 'g8',
    name: 'Historical Analysis',
    description: 'Determine account creation and deletion windows using web archives and breach history.',
    toolIds: ['61', '62', '3'], // Wayback Timeline, Breach History, Wayback Machine
    suggestedSequence: ['Wayback Timeline', 'Breach History', 'Wayback Machine']
  },
  {
    id: 'g9',
    name: 'Ultimate Identity Recon',
    description: 'Massive automated search across social, dating, gaming, financial, and NSFW platforms using top-tier OSINT engines.',
    toolIds: ['2', '19', '51', '52', '53', '54', '55', '56', '57', '58', '12', '11', '18', '36', '37', '63', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76'],
    suggestedSequence: ['Sherlock', 'Maigret', 'WhatsMyName Web', 'Blackbird', 'UserSearch.org', 'Idenit.com', 'EPIEOS', 'Holehe', 'Global Social/NSFW Dork Search', 'SteamID I/O', 'Tracker.gg', 'Etherscan', 'OpenSea', 'SocialCatfish', 'OnlySearch', 'DiscordID.dev', 'Telegram Search Engine']
  },
  {
    id: 'g10',
    name: 'Gaming & Metaverse Recon',
    description: 'Investigate gaming profiles, stats, and virtual assets across major platforms.',
    toolIds: ['67', '68', '2', '19'],
    suggestedSequence: ['SteamID I/O', 'Tracker.gg', 'Sherlock']
  },
  {
    id: 'g11',
    name: 'Crypto & Financial Intelligence',
    description: 'Track blockchain activity, NFT ownership, and financial footprints.',
    toolIds: ['69', '70', '11', '6'],
    suggestedSequence: ['Etherscan', 'OpenSea', 'EPIEOS']
  },
  {
    id: 'g12',
    name: 'Dating & Social Verification',
    description: 'Verify identities on dating platforms and search for niche social profiles.',
    toolIds: ['71', '72', '21', '31'],
    suggestedSequence: ['SocialCatfish', 'OnlySearch', 'Search4Faces']
  },
  {
    id: 'g13',
    name: 'Deep Global Scan (Top 300+)',
    description: 'Massive automated search across 300+ sites in Social, Chat, Dating, Financial, NSFW, Gaming, VOIP, Texting, Selling, and Blog categories.',
    toolIds: ['2', '19', '51', '52', '53', '54', '55', '56', '57', '58', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88'],
    suggestedSequence: ['Deep Social Scan', 'Deep Chat Scan', 'Deep Dating Scan', 'Deep Financial Scan', 'Deep NSFW Scan', 'Deep Gaming Scan', 'Deep VOIP Scan', 'Deep Texting Scan', 'Deep Selling Scan', 'Deep Blog Scan', 'AI Deep Scan Analyst', 'AI Google Dork Generator']
  },
  {
    id: 'g14',
    name: 'Dark Web Discovery',
    description: 'Specialized workflow for uncovering hidden services and identifying assets on the Tor network.',
    toolIds: ['16', '17', '4', '8'],
    suggestedSequence: ['Tor Project', 'Ahmia', 'SpiderFoot', 'Google Dorks']
  },
  {
    id: 'g15',
    name: 'Advanced Financial Tracing',
    description: 'Comprehensive financial investigation covering corporate structures, blockchain activity, and marketplace footprints.',
    toolIds: ['32', '33', '69', '70', '80', '85'],
    suggestedSequence: ['OpenCorporates', 'Little Sis', 'Deep Financial Scan', 'Etherscan', 'OpenSea', 'Deep Selling Scan']
  },
  {
    id: 'g16',
    name: 'Social Media Methodology',
    description: 'Systematic approach to identifying and verifying social media presence across hundreds of platforms including niche and adult sites.',
    toolIds: ['2', '19', '51', '52', '53', '77', '81', '71', '72'],
    suggestedSequence: ['Sherlock', 'Maigret', 'Deep Social Scan', 'WhatsMyName Web', 'UserSearch.org', 'SocialCatfish', 'OnlySearch', 'Deep NSFW Scan']
  }
];

export const OSINT_TOOLS: OSINTTool[] = [
  {
    id: '77',
    name: 'Deep Social Scan',
    description: 'Automated search across top 75+ social media platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.social.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'Social Media', 'Username'],
    isFree: true
  },
  {
    id: '78',
    name: 'Deep Chat Scan',
    description: 'Automated search across top 75+ chat and messaging platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.chat.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'Chat', 'Username'],
    isFree: true
  },
  {
    id: '79',
    name: 'Deep Dating Scan',
    description: 'Automated search across top 75+ dating platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.dating.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'Dating', 'Username'],
    isFree: true
  },
  {
    id: '80',
    name: 'Deep Financial Scan',
    description: 'Automated search across top 30+ financial and crypto platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.financial.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Financial',
    tags: ['Deep Scan', 'Financial', 'Crypto'],
    isFree: true
  },
  {
    id: '81',
    name: 'Deep NSFW Scan',
    description: 'Automated search across top 75+ NSFW and adult platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.nsfw.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'NSFW', 'Adult'],
    isFree: true
  },
  {
    id: '82',
    name: 'Deep Gaming Scan',
    description: 'Automated search across top 35+ gaming and streaming platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.gaming.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'Gaming', 'Streaming'],
    isFree: true
  },
  {
    id: '83',
    name: 'Deep VOIP Scan',
    description: 'Automated search across top 75+ VOIP and communication platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.voip.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'VOIP', 'Communication'],
    isFree: true
  },
  {
    id: '84',
    name: 'Deep Texting Scan',
    description: 'Automated search across top 20+ texting and SMS platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.texting.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'Texting', 'SMS'],
    isFree: true
  },
  {
    id: '85',
    name: 'Deep Selling Scan',
    description: 'Automated search across top 30+ e-commerce and selling platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.selling.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Search Engines',
    tags: ['Deep Scan', 'Selling', 'E-commerce'],
    isFree: true
  },
  {
    id: '86',
    name: 'Deep Blog Scan',
    description: 'Automated search across top 25+ blogging and content platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.blog.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Search Engines',
    tags: ['Deep Scan', 'Blogging', 'Content'],
    isFree: true
  },
  {
    id: '87',
    name: 'AI Deep Scan Analyst',
    description: 'Use Gemini AI to analyze and extract key information from your scan results. Paste your findings here.',
    url: '#',
    category: 'Frameworks & Suites',
    tags: ['AI', 'Analysis', 'Intelligence'],
    isFree: true,
    howToUse: 'Run your scans, copy the relevant text findings, and paste them into the AI Analyst module for a comprehensive intelligence briefing.'
  },
  {
    id: '88',
    name: 'AI Google Dork Generator',
    description: 'AI-powered generator that suggests relevant Google Dorks based on your target and objectives.',
    url: '#',
    category: 'Search Engines',
    tags: ['AI', 'Dorks', 'Google'],
    isFree: true,
    howToUse: 'Enter your target and what you are looking for (e.g., "confidential documents", "admin panels"), and the AI will generate optimized dorks.'
  },
  {
    id: 'diag-01',
    name: 'System Diagnostics',
    description: 'Run a comprehensive health check on the OSINT API and backend services.',
    url: '/api/health',
    category: 'Frameworks & Suites',
    tags: ['System', 'Health', 'Diagnostics'],
    isFree: true,
    howToUse: 'Click to run a diagnostic check on all internal API endpoints to ensure they are responsive and working correctly.'
  },
  {
    id: '1',
    name: 'TheHarvester',
    description: 'CLI tool for gathering emails, subdomains, hosts, employee names, open ports, and banners from public sources.',
    url: 'https://github.com/laramies/theHarvester',
    category: 'Frameworks & Suites',
    tags: ['Email', 'Subdomains', 'CLI', 'Recon', 'Domain', 'Intelligence', 'Passive Recon'],
    howToUse: 'Run via CLI: python3 theHarvester.py -d domain.com -l 500 -b google. Useful for initial reconnaissance to find subdomains and employee emails.',
    combinations: ['SpiderFoot', 'Amass', 'Recon-ng'],
    isFree: true
  },
  {
    id: '2',
    name: 'Sherlock',
    description: 'Hunt down social media accounts by username across hundreds of social networks.',
    url: 'https://github.com/sherlock-project/sherlock',
    searchUrl: `https://www.google.com/search?q="{query}"+(inurl:profile+OR+inurl:user+OR+inurl:u+OR+inurl:p)+-inurl:login+-inurl:signin+-inurl:signup+(${GLOBAL_SOCIAL_NSFW_DORK})`,
    category: 'Social Media',
    tags: ['Username', 'Social Media', 'CLI', 'Account Finder', 'Footprinting', 'SOCMINT'],
    howToUse: 'Run via CLI: python3 sherlock.py username. It will check hundreds of social media sites for the existence of that username.',
    combinations: ['Maigret', 'Blackbird', 'WhatsMyName Web'],
    isFree: true
  },
  {
    id: '3',
    name: 'Wayback Machine',
    description: 'Digital archive of the World Wide Web, allowing users to see how websites looked in the past.',
    url: 'https://archive.org/web/',
    searchUrl: 'https://web.archive.org/web/*/{query}',
    category: 'Search Engines',
    tags: ['Archiving', 'History', 'Web', 'Snapshots', 'Digital Forensics'],
    howToUse: 'Enter a URL to see its historical snapshots. Useful for finding deleted content or tracking changes over time.',
    combinations: ['Wayback Timeline', 'Waybackpy', 'SpiderFoot'],
    isFree: true
  },
  {
    id: '4',
    name: 'SpiderFoot',
    description: 'OSINT automation tool that integrates with over 100 data sources to gather intelligence.',
    url: 'https://github.com/smicallef/spiderfoot',
    searchUrl: `https://www.google.com/search?q="{query}"+recon+-inurl:login+-inurl:signin+-inurl:signup+(${SOCIAL_DORK})`,
    category: 'Frameworks & Suites',
    tags: ['Automation', 'Recon', 'Open Source', 'Framework', 'Intelligence', 'OSINT'],
    howToUse: 'Start the web interface and create a new scan. Enter a target (domain, IP, email) and select modules to run automated intelligence gathering.',
    combinations: ['TheHarvester', 'Amass', 'Recon-ng'],
    isFree: true
  },
  {
    id: '5',
    name: 'OSINT Framework',
    description: 'A comprehensive directory of OSINT tools categorized by the type of data they help you find.',
    url: 'https://osintframework.com/',
    searchUrl: 'https://osintframework.com/search?q={query}',
    category: 'Frameworks & Suites',
    tags: ['Directory', 'Guide', 'Resources', 'Categorization', 'Toolbox'],
    howToUse: 'Navigate the tree-like structure to find tools based on the type of data you are looking for (e.g., Email Addresses -> Search).',
    combinations: ['IntelTechniques', 'Bellingcat Toolkit'],
    isFree: true
  },
  {
    id: '6',
    name: 'Have I Been Pwned',
    description: 'Check if your email or phone number has been compromised in a data breach.',
    url: 'https://haveibeenpwned.com/',
    searchUrl: 'https://haveibeenpwned.com/account/{query}',
    category: 'Email & Username',
    tags: ['Breach', 'Security', 'Privacy', 'Email', 'Phone', 'Data Leak'],
    howToUse: 'Enter an email or phone number to see if it appears in any known data breaches. Provides a list of breaches and what data was leaked.',
    combinations: ['LeakCheck', 'DeHashed', 'Snusbase'],
    isFree: true
  },
  {
    id: '7',
    name: 'TinEye',
    description: 'Reverse image search engine that helps you find where an image came from.',
    url: 'https://tineye.com/',
    searchUrl: 'https://tineye.com/search/?url={query}',
    category: 'Images & Video',
    tags: ['Reverse Image Search', 'Verification', 'Images', 'Copyright', 'IMINT'],
    howToUse: 'Upload an image or provide a URL to find other instances of that image online. Useful for verifying the source of a photo.',
    combinations: ['Yandex Images', 'Search4Faces', 'PimEyes'],
    isFree: true
  },
  {
    id: '8',
    name: 'Google Dorks',
    description: 'Advanced search operators used to find specific information not easily accessible.',
    url: 'https://www.exploit-db.com/google-hacking-database',
    category: 'Search Engines',
    tags: ['Advanced Search', 'Hacking', 'Google', 'Dorking', 'Information Gathering'],
    howToUse: 'Use specific search operators like "filetype:pdf" or "intitle:index of" to find sensitive files or directories exposed on the web.',
    combinations: ['SpiderFoot', 'TheHarvester'],
    isFree: true
  },
  {
    id: '9',
    name: 'BuiltWith',
    description: 'Find out what websites are built with, including CMS, analytics, and advertising tools.',
    url: 'https://builtwith.com/',
    searchUrl: 'https://builtwith.com/{query}',
    category: 'Domain & IP',
    tags: ['Technology Stack', 'Web Analysis', 'Domain', 'CMS', 'Analytics'],
    howToUse: 'Enter a domain to see the technologies used to build the site, including CMS, analytics, and hosting providers.',
    combinations: ['Wappalyzer', 'SpyOnWeb', 'Whois.com'],
    isFree: true
  },
  {
    id: '10',
    name: 'Whois.com',
    description: 'Lookup domain registration information, including owner details and expiration dates.',
    url: 'https://www.whois.com/',
    searchUrl: 'https://www.whois.com/whois/{query}',
    category: 'Domain & IP',
    tags: ['Domain', 'Registration', 'Owner', 'IP', 'Registrar'],
    howToUse: 'Enter a domain to find registration details, including the registrar, creation date, and sometimes owner contact information.',
    combinations: ['DNSDumpster', 'ViewDNS.info', 'BuiltWith'],
    isFree: true
  },
  {
    id: '11',
    name: 'EPIEOS',
    description: 'Find information about an email address or phone number without alerting the target.',
    url: 'https://epieos.com/',
    searchUrl: 'https://epieos.com/?q={query}',
    category: 'Email & Username',
    tags: ['Email', 'Phone', 'Privacy', 'Social Media', 'Account Finder', 'SOCMINT'],
    howToUse: 'Enter an email address to find associated social media profiles and Google account information.',
    combinations: ['Holehe', 'GHunt', 'Have I Been Pwned'],
    isFree: true
  },
  {
    id: '12',
    name: 'Social Searcher',
    description: 'Free social media search engine for real-time tracking of mentions.',
    url: 'https://www.social-searcher.com/',
    searchUrl: 'https://www.social-searcher.com/search-users/?q={query}',
    category: 'Social Media',
    tags: ['Mentions', 'Real-time', 'Tracking', 'Social Media', 'Monitoring', 'SOCMINT'],
    howToUse: 'Enter a keyword or username to see real-time mentions across various social media platforms.',
    combinations: ['Sherlock', 'Maigret'],
    isFree: true
  },
  {
    id: '13',
    name: 'ExifTool',
    description: 'Read, write, and edit meta information in a wide variety of files.',
    url: 'https://github.com/exiftool/exiftool',
    category: 'Images & Video',
    tags: ['Metadata', 'Exif', 'CLI', 'Images', 'Video', 'Forensics', 'IMINT'],
    howToUse: 'Run via CLI: exiftool filename. It extracts metadata from images, videos, and documents, revealing camera settings, GPS data, and more.',
    combinations: ['Metagoofil', 'TinEye'],
    isFree: true
  },
  {
    id: '14',
    name: 'Google Earth',
    description: 'Explore the world from above with satellite imagery and 3D terrain.',
    url: 'https://earth.google.com/',
    category: 'Maps & Geolocation',
    tags: ['Satellite', '3D', 'Geography', 'Maps', 'Geolocation', 'IMINT', 'GEOINT'],
    howToUse: 'Use the web or desktop version to explore satellite imagery. Useful for verifying locations and analyzing terrain.',
    combinations: ['OpenStreetMap', 'SunCalc', 'PeakVisor'],
    isFree: true
  },
  {
    id: '15',
    name: 'OpenStreetMap',
    description: 'A collaborative project to create a free editable map of the world.',
    url: 'https://www.openstreetmap.org/',
    searchUrl: 'https://www.openstreetmap.org/search?query={query}',
    category: 'Maps & Geolocation',
    tags: ['Mapping', 'Open Source', 'Community', 'Maps', 'Geolocation', 'GIS', 'GEOINT'],
    howToUse: 'A community-driven map that often contains more detailed information than commercial maps, such as building numbers and small paths.',
    combinations: ['Google Earth', 'SunCalc'],
    isFree: true
  },
  {
    id: '16',
    name: 'Ahmia',
    description: 'A search engine for the Tor network, allowing users to find hidden services.',
    url: 'https://ahmia.fi/',
    searchUrl: 'https://ahmia.fi/search/?q={query}',
    category: 'Dark Web',
    tags: ['Tor', 'Hidden Services', 'Search', 'Dark Web', 'Onion'],
    howToUse: 'A search engine for the Tor network. Use it to find hidden services and content on the dark web.',
    combinations: ['Tor Browser', 'SpiderFoot'],
    isFree: true
  },
  {
    id: '17',
    name: 'Tor Project',
    description: 'Software for enabling anonymous communication, used to access the dark web.',
    url: 'https://www.torproject.org/',
    category: 'Dark Web',
    tags: ['Anonymity', 'Privacy', 'Browser', 'Dark Web', 'Proxy'],
    howToUse: 'Download and install the Tor Browser to access .onion sites and browse the web anonymously. It routes your traffic through multiple layers of encryption.',
    combinations: ['Ahmia', 'DuckDuckGo (Onion)', 'I2P'],
    isFree: true
  },
  {
    id: '18',
    name: 'Holehe',
    description: 'Check if an email is used on over 120 websites, including social media.',
    url: 'https://github.com/megadose/holehe',
    searchUrl: `https://www.google.com/search?q="{query}"+account+-inurl:login+-inurl:signin+-inurl:signup+(${SOCIAL_DORK})`,
    category: 'Email & Username',
    tags: ['Email', 'Account Finder', 'CLI', 'Social Media', 'Verification', 'SOCMINT'],
    howToUse: 'Run via CLI: holehe email@example.com. It checks if an email is registered on over 120 websites without alerting the user.',
    combinations: ['EPIEOS', 'GHunt', 'Sherlock'],
    isFree: true
  },
  {
    id: '19',
    name: 'Maigret',
    description: 'Collect a dossier on a person by username only, checking thousands of sites.',
    url: 'https://github.com/soxoj/maigret',
    searchUrl: `https://www.google.com/search?q="{query}"+(inurl:profile+OR+inurl:user+OR+inurl:u+OR+inurl:p)+-inurl:login+-inurl:signin+-inurl:signup+(${GLOBAL_SOCIAL_NSFW_DORK})`,
    category: 'Social Media',
    tags: ['Username', 'Dossier', 'CLI', 'Social Media', 'Account Finder', 'SOCMINT'],
    howToUse: 'Run via CLI: maigret username. It builds a detailed dossier by searching for usernames across thousands of sites.',
    combinations: ['Sherlock', 'Blackbird', 'WhatsMyName Web'],
    isFree: true
  },
  {
    id: '20',
    name: 'Bellingcat Tools',
    description: 'A collection of tools and guides from the investigative journalism group Bellingcat.',
    url: 'https://github.com/bellingcat',
    category: 'Frameworks & Suites',
    tags: ['Journalism', 'Investigation', 'Guides', 'Verification', 'Fact-checking'],
    howToUse: 'Explore their GitHub repository for specialized tools and guides on digital investigation and verification.',
    combinations: ['OSINT Framework', 'IntelTechniques'],
    isFree: true
  },
  {
    id: '21',
    name: 'Search4Faces',
    description: 'Face search engine that helps you find people on social networks by their photos.',
    url: 'https://search4faces.com/',
    category: 'Images & Video',
    tags: ['Facial Recognition', 'Social Media', 'Images', 'Biometrics', 'IMINT'],
    howToUse: 'Upload a photo of a person to find their social media profiles on platforms like VKontakte, Odnoklassniki, and TikTok. It uses advanced facial recognition technology.',
    combinations: ['PimEyes', 'Yandex Images', 'Social Mapper'],
    isFree: true
  },
  {
    id: '22',
    name: 'SpyOnWeb',
    description: 'Find related websites by tracking Google Analytics IDs and IP addresses.',
    url: 'https://spyonweb.com/',
    searchUrl: 'https://spyonweb.com/{query}',
    category: 'Domain & IP',
    tags: ['Tracking', 'Analytics', 'Network', 'Domain', 'IP', 'AdSense'],
    howToUse: 'Enter a domain, IP address, Google Analytics ID, or AdSense ID to find related websites owned by the same entity.',
    combinations: ['BuiltWith', 'Whois.com', 'DNSDumpster'],
    isFree: true
  },
  {
    id: '23',
    name: 'DNSDumpster',
    description: 'A domain research tool that can discover hosts related to a domain.',
    url: 'https://dnsdumpster.com/',
    category: 'Domain & IP',
    tags: ['DNS', 'Recon', 'Network', 'Domain', 'Subdomains', 'Mapping'],
    howToUse: 'Enter a domain to discover subdomains, MX records, and host information. It provides a visual map of the domain\'s infrastructure.',
    combinations: ['Whois.com', 'ViewDNS.info', 'Sublist3r'],
    isFree: true
  },
  {
    id: '24',
    name: 'ViewDNS.info',
    description: 'A collection of tools for gathering information about domains and IP addresses.',
    url: 'https://viewdns.info/',
    searchUrl: 'https://viewdns.info/reversewhois/?q={query}',
    category: 'Domain & IP',
    tags: ['Tools', 'DNS', 'IP', 'Domain', 'Reverse IP', 'Whois'],
    howToUse: 'Use various tools like Reverse Whois, Reverse IP Lookup, and DNS Report to gather comprehensive information about a domain or IP address.',
    combinations: ['DNSDumpster', 'SpyOnWeb', 'Whois.com'],
    isFree: true
  },
  {
    id: '25',
    name: 'Phonebook.cz',
    description: 'Search for subdomains, email addresses, and URLs for any domain.',
    url: 'https://phonebook.cz/',
    category: 'Email & Username',
    tags: ['Search', 'Domain', 'Intelligence', 'Email', 'Subdomains'],
    howToUse: 'Enter a domain to list all associated email addresses, subdomains, and URLs indexed from various public sources.',
    combinations: ['Hunter.io', 'IntelTechniques', 'DNSDumpster'],
    isFree: true
  },
  {
    id: '26',
    name: 'LeakCheck',
    description: 'Check if your accounts have been compromised in data breaches.',
    url: 'https://leakcheck.io/',
    searchUrl: 'https://leakcheck.io/search?q={query}',
    category: 'Email & Username',
    tags: ['Breach', 'Security', 'Privacy', 'Email', 'Password', 'Data Leak'],
    howToUse: 'Enter an email address or username to check if it appears in any known data breaches and see which specific leaks contain the information.',
    combinations: ['Have I Been Pwned', 'DeHashed', 'Snusbase'],
    isFree: true
  },
  {
    id: '27',
    name: 'FlightRadar24',
    description: 'Real-time flight tracking service that shows aircraft on a map.',
    url: 'https://www.flightradar24.com/',
    searchUrl: 'https://www.flightradar24.com/data/flights/{query}',
    category: 'Maps & Geolocation',
    tags: ['Aviation', 'Tracking', 'Real-time', 'Maps', 'Geolocation', 'ADS-B', 'GEOINT'],
    howToUse: 'Search for a flight number, aircraft registration, or airport to track live flights globally. View flight paths, altitude, and speed in real-time.',
    combinations: ['MarineTraffic', 'ADS-B Exchange', 'Google Earth'],
    isFree: true
  },
  {
    id: '28',
    name: 'MarineTraffic',
    description: 'Real-time ship tracking service that shows vessels on a map.',
    url: 'https://www.marinetraffic.com/',
    searchUrl: 'https://www.marinetraffic.com/en/ais/index/search/all?keyword={query}',
    category: 'Maps & Geolocation',
    tags: ['Maritime', 'Tracking', 'Real-time', 'Maps', 'Geolocation', 'AIS', 'GEOINT'],
    howToUse: 'Search for a vessel name, IMO, or MMSI to track ships and boats in real-time. View vessel positions, ports of call, and destination information.',
    combinations: ['FlightRadar24', 'VesselFinder', 'Google Earth'],
    isFree: true
  },
  {
    id: '29',
    name: 'SunCalc',
    description: 'A tool that shows sun movement and sunlight phases for a given day.',
    url: 'https://www.suncalc.org/',
    category: 'Maps & Geolocation',
    tags: ['Sun', 'Shadows', 'Verification', 'Maps', 'Geolocation', 'Chronolocation', 'GEOINT'],
    howToUse: 'Select a location and date to see the sun\'s position, shadow lengths, and sunlight phases. Vital for verifying the time and date of photos or videos.',
    combinations: ['Google Earth', 'OpenStreetMap', 'PeakVisor'],
    isFree: true
  },
  {
    id: '30',
    name: 'PeakVisor',
    description: 'Identify mountains and peaks from photos using 3D maps.',
    url: 'https://peakvisor.com/',
    category: 'Maps & Geolocation',
    tags: ['Mountains', '3D', 'Verification', 'Maps', 'Geolocation', 'IMINT', 'GEOINT'],
    howToUse: 'Upload a photo containing mountains to identify peaks and ranges. It uses 3D terrain modeling to match the horizon in your image.',
    combinations: ['Google Earth', 'SunCalc', 'PeakVisor'],
    isFree: true
  },
  {
    id: '31',
    name: 'Yandex Images',
    description: 'Powerful reverse image search engine, often more effective for certain regions.',
    url: 'https://yandex.com/images/',
    searchUrl: 'https://yandex.com/images/search?text={query}',
    category: 'Images & Video',
    tags: ['Reverse Image Search', 'Yandex', 'Images', 'Facial Recognition', 'IMINT'],
    howToUse: 'Upload an image or paste a URL to find similar images or the original source. Highly effective for identifying people, landmarks, and products.',
    combinations: ['Google Images', 'TinEye', 'Search4Faces'],
    isFree: true
  },
  {
    id: '32',
    name: 'OpenCorporates',
    description: 'The largest open database of companies in the world.',
    url: 'https://opencorporates.com/',
    searchUrl: 'https://opencorporates.com/companies?q={query}',
    category: 'Frameworks & Suites',
    tags: ['Company', 'Business', 'Database', 'Legal', 'Ownership', 'FININT'],
    howToUse: 'Search for a company name or director to find registration details, filings, and corporate structures from jurisdictions worldwide.',
    combinations: ['Little Sis', 'BuiltWith', 'LinkedIn'],
    isFree: true
  },
  {
    id: '33',
    name: 'Little Sis',
    description: 'A free database of who-knows-who at the heights of business and government.',
    url: 'https://littlesis.org/',
    searchUrl: 'https://littlesis.org/search?q={query}',
    category: 'Frameworks & Suites',
    tags: ['Networking', 'Influence', 'Database', 'Company', 'Politics', 'FININT'],
    howToUse: 'Search for influential people or organizations to map their connections to government, business, and other powerful entities.',
    combinations: ['OpenCorporates', 'LinkedIn', 'Google Search'],
    isFree: true
  },
  {
    id: '34',
    name: 'Shodan (Free Tier)',
    description: 'Search engine for Internet-connected devices (limited free access).',
    url: 'https://www.shodan.io/',
    searchUrl: 'https://www.shodan.io/search?query={query}',
    category: 'Domain & IP',
    tags: ['IoT', 'Scanning', 'Network', 'IP', 'Devices', 'Vulnerability'],
    howToUse: 'Enter search queries like "apache", "webcam", or specific IP ranges to find internet-connected devices and their vulnerabilities.',
    combinations: ['Censys', 'Zoomeye', 'Nmap'],
    isFree: true
  },
  {
    id: '35',
    name: 'Censys (Free Search)',
    description: 'Search engine for discovering devices and networks (limited free access).',
    url: 'https://search.censys.io/',
    searchUrl: 'https://search.censys.io/search?q={query}',
    category: 'Domain & IP',
    tags: ['Network', 'Scanning', 'Security', 'IP', 'Certificates', 'Domain'],
    howToUse: 'Enter an IP address, domain, or certificate fingerprint to discover hosts and services exposed on the internet. It provides detailed technical data about network configurations.',
    combinations: ['Shodan', 'BinaryEdge', 'GreyNoise'],
    isFree: true
  },
  {
    id: '36',
    name: 'GHunt',
    description: 'OSINT tool to extract information from any Google Account using an email.',
    url: 'https://github.com/mxrch/ghunt',
    searchUrl: `https://www.google.com/search?q="{query}"+google+account+-inurl:login+-inurl:signin+-inurl:signup+(${SOCIAL_DORK})`,
    category: 'Email & Username',
    tags: ['Google', 'Email', 'CLI', 'Account Finder', 'Google Maps', 'SOCMINT'],
    howToUse: 'Use the CLI to analyze a Google email address. It can extract the owner\'s name, Google ID, last profile update, and sometimes their location via Google Maps reviews.',
    combinations: ['EPIEOS', 'Holehe', 'Google Search'],
    isFree: true
  },
  {
    id: '37',
    name: 'Ignorant',
    description: 'Check if a phone number is used on different social media platforms.',
    url: 'https://github.com/megadose/ignorant',
    category: 'Email & Username',
    tags: ['Phone', 'Social Media', 'CLI', 'Account Finder', 'Verification', 'SOCMINT'],
    howToUse: 'Run the CLI tool with a phone number to check its registration status across various social media platforms like Instagram, Snapchat, and WhatsApp.',
    combinations: ['PhoneInfoga', 'TrueCaller', 'Social Mapper'],
    isFree: true
  },
  {
    id: '38',
    name: 'Photon',
    description: 'Incredibly fast crawler designed for OSINT, extracting URLs, emails, and more.',
    url: 'https://github.com/s0md3v/Photon',
    category: 'Frameworks & Suites',
    tags: ['Crawler', 'Recon', 'CLI', 'Domain', 'Email', 'URLs'],
    howToUse: 'Provide a URL to the CLI tool to crawl the website and extract emails, social media profiles, Amazon buckets, and other sensitive information.',
    combinations: ['FinalRecon', 'Metagoofil', 'Waybackpy'],
    isFree: true
  },
  {
    id: '39',
    name: 'FinalRecon',
    description: 'All-in-one web reconnaissance tool providing detailed information.',
    url: 'https://github.com/thewhiteh4t/FinalRecon',
    category: 'Frameworks & Suites',
    tags: ['Web Recon', 'CLI', 'All-in-one', 'Domain', 'Whois', 'DNS'],
    howToUse: 'A comprehensive CLI tool for web reconnaissance. It performs Whois lookups, DNS enumeration, port scanning, and directory searching in one go.',
    combinations: ['Photon', 'Recon-ng', 'Sublist3r'],
    isFree: true
  },
  {
    id: '40',
    name: 'PhoneInfoga',
    description: 'Advanced tool to scan international phone numbers and gather information.',
    url: 'https://github.com/sundowndev/phoneinfoga',
    category: 'Email & Username',
    tags: ['Phone', 'Scanning', 'CLI', 'Geolocation', 'Intelligence'],
    howToUse: 'Enter a phone number in international format to gather information about its carrier, location, and presence on social media or search engines.',
    combinations: ['Ignorant', 'EPIEOS', 'TrueCaller'],
    isFree: true
  },
  {
    id: '41',
    name: 'Metagoofil',
    description: 'Tool for extracting metadata of public documents (pdf,doc,xls,ppt,etc) from a domain.',
    url: 'https://github.com/laramies/metagoofil',
    category: 'Images & Video',
    tags: ['Metadata', 'Documents', 'CLI', 'Domain', 'Recon'],
    howToUse: 'Use the CLI to search for specific file types (PDF, DOCX, etc.) on a target domain and extract metadata like usernames, software versions, and server paths.',
    combinations: ['ExifTool', 'Photon', 'FOCA'],
    isFree: true
  },
  {
    id: '42',
    name: 'Recon-ng',
    description: 'A full-featured Web Reconnaissance framework written in Python.',
    url: 'https://github.com/lanmaster53/recon-ng',
    category: 'Frameworks & Suites',
    tags: ['Framework', 'Recon', 'CLI', 'Intelligence', 'Automation'],
    howToUse: 'A powerful CLI framework. Use modules to automate the collection of information from various open sources, similar to Metasploit but for reconnaissance.',
    combinations: ['Maltego', 'SpiderFoot', 'Amass'],
    isFree: true
  },
  {
    id: '43',
    name: 'Sublist3r',
    description: 'Fast subdomains enumeration tool for penetration testers.',
    url: 'https://github.com/aboul3la/Sublist3r',
    category: 'Domain & IP',
    tags: ['Subdomains', 'Recon', 'CLI', 'Domain', 'Enumeration'],
    howToUse: 'Run the CLI tool with a domain name to enumerate subdomains using many search engines and DNS records. Essential for mapping a target\'s attack surface.',
    combinations: ['Amass', 'DNSDumpster', 'Findomain'],
    isFree: true
  },
  {
    id: '44',
    name: 'CloudFlair',
    description: 'Find origin IP addresses of websites masked by Cloudflare.',
    url: 'https://github.com/christophetd/cloudflair',
    category: 'Domain & IP',
    tags: ['Cloudflare', 'IP', 'CLI', 'Domain', 'Bypass'],
    howToUse: 'Provide a domain name to the CLI tool to find the real origin IP address by searching through Censys data for SSL certificates that match the target.',
    combinations: ['Censys', 'Shodan', 'CloudFail'],
    isFree: true
  },
  {
    id: '45',
    name: 'Social Mapper',
    description: 'Open Source Intelligence Tool that uses facial recognition to correlate profiles.',
    url: 'https://github.com/Greenwolf/social_mapper',
    category: 'Social Media',
    tags: ['Facial Recognition', 'Social Media', 'CLI', 'Images', 'Correlation', 'IMINT'],
    howToUse: 'Provide a folder of images and a list of names to the CLI tool. It uses facial recognition to find and correlate profiles across multiple social networks.',
    combinations: ['Search4Faces', 'PimEyes', 'Sherlock'],
    isFree: true
  },
  {
    id: '46',
    name: 'Instaloader',
    description: 'Tool to download pictures (or videos) along with their captions from Instagram.',
    url: 'https://github.com/instaloader/instaloader',
    category: 'Social Media',
    tags: ['Instagram', 'Scraper', 'CLI', 'Social Media', 'Images', 'Video'],
    howToUse: 'Use the CLI to download public posts, stories, and metadata from Instagram profiles or hashtags. It can also download private content if you provide credentials.',
    combinations: ['Social Mapper', 'Sherlock', 'Metadata tools'],
    isFree: true
  },
  {
    id: '47',
    name: 'Waybackpy',
    description: 'Python package that interfaces with the Wayback Machine API.',
    url: 'https://github.com/akamhy/waybackpy',
    category: 'Search Engines',
    tags: ['Archiving', 'Python', 'CLI', 'History', 'Wayback Machine'],
    howToUse: 'A Python CLI and library to interact with the Wayback Machine. Use it to save pages, retrieve the oldest/newest snapshots, or list all available archives.',
    combinations: ['Wayback Machine', 'Photon', 'FinalRecon'],
    isFree: true
  },
  {
    id: '48',
    name: 'Amass',
    description: 'In-depth Attack Surface Mapping and Asset Discovery.',
    url: 'https://github.com/owasp-amass/amass',
    category: 'Domain & IP',
    tags: ['Asset Discovery', 'Recon', 'CLI', 'Domain', 'Subdomains', 'Network'],
    howToUse: 'The gold standard for CLI-based attack surface mapping. It uses active and passive techniques to discover assets, subdomains, and network topologies.',
    combinations: ['Sublist3r', 'DNSDumpster', 'Recon-ng'],
    isFree: true
  },
  {
    id: '49',
    name: 'OSINT-Spy',
    description: 'Perform OSINT on a domain, email, or IP address.',
    url: 'https://github.com/SharadKumar97/OSINT-Spy',
    category: 'Frameworks & Suites',
    tags: ['All-in-one', 'Recon', 'CLI', 'Domain', 'Email', 'IP'],
    howToUse: 'A versatile CLI tool to perform reconnaissance on domains, emails, and IP addresses, aggregating data from multiple OSINT sources into a single report.',
    combinations: ['FinalRecon', 'Photon', 'SpiderFoot'],
    isFree: true
  },
  {
    id: '50',
    name: 'Maltego Community Edition',
    description: 'Free version of Maltego for non-commercial use with limited transforms.',
    url: 'https://www.maltego.com/ce/',
    category: 'Frameworks & Suites',
    tags: ['Link Analysis', 'Visualization', 'Free', 'Framework', 'Intelligence'],
    howToUse: 'Install the desktop application and use "Transforms" to visually map relationships between entities like people, companies, domains, and IP addresses.',
    combinations: ['SpiderFoot', 'Recon-ng', 'SocialLinks'],
    isFree: true
  },
  {
    id: '51',
    name: 'Blackbird',
    description: 'An OSINT tool to search for accounts by username in social networks across 100+ websites.',
    url: 'https://github.com/p1ngul1n0/blackbird',
    searchUrl: `https://www.google.com/search?q="{query}"+(inurl:profile+OR+inurl:user+OR+inurl:u+OR+inurl:p)+-inurl:login+-inurl:signin+-inurl:signup+(${GLOBAL_SOCIAL_NSFW_DORK})`,
    category: 'Social Media',
    tags: ['Username', 'Social Media', 'CLI', 'Account Finder', 'Footprinting', 'SOCMINT'],
    howToUse: 'Run the CLI tool with a username to search across over 100 social media platforms. It provides a clean output of found profiles and their URLs.',
    combinations: ['Sherlock', 'Maigret', 'WhatsMyName Web'],
    isFree: true
  },
  {
    id: '52',
    name: 'WhatsMyName Web',
    description: 'Web version of the popular username search tool, checking across hundreds of sites.',
    url: 'https://whatsmyname.app/',
    searchUrl: 'https://whatsmyname.app/?q={query}',
    category: 'Social Media',
    tags: ['Username', 'Search', 'Web', 'Social Media', 'Account Finder', 'SOCMINT'],
    howToUse: 'Enter a username on the website to check its existence across hundreds of social media, gaming, and forum sites. It\'s a fast, web-based alternative to Sherlock.',
    combinations: ['Sherlock', 'Blackbird', 'UserSearch.org'],
    isFree: true
  },
  {
    id: '53',
    name: 'UserSearch.org',
    description: 'Find social media profiles, dating accounts, and more by username or email.',
    url: 'https://usersearch.org/',
    searchUrl: 'https://usersearch.org/results.php?q={query}',
    category: 'Social Media',
    tags: ['Username', 'Email', 'Dating', 'Social Media', 'Account Finder', 'SOCMINT'],
    howToUse: 'Use the web interface to search for usernames or emails. It categorizes results by platform type, such as dating, social, or professional networks.',
    combinations: ['WhatsMyName Web', 'EPIEOS', 'Social Searcher'],
    isFree: true
  },
  {
    id: '54',
    name: 'NameCheckup',
    description: 'Check username availability and social media profiles across dozens of platforms.',
    url: 'https://namecheckup.com/',
    searchUrl: 'https://namecheckup.com/?q={query}',
    category: 'Social Media',
    tags: ['Username', 'Availability', 'Search', 'Social Media', 'Branding'],
    howToUse: 'Enter a desired username or brand name to check its availability across dozens of popular social media platforms and domain extensions.',
    combinations: ['KnowEm', 'Namechk', 'CheckUserNames'],
    isFree: true
  },
  {
    id: '55',
    name: 'KnowEm',
    description: 'Search over 500 popular social networks, business networks, and domain names.',
    url: 'https://knowem.com/',
    searchUrl: 'https://knowem.com/checkusername.php?u={query}',
    category: 'Social Media',
    tags: ['Username', 'Branding', 'Search', 'Social Media', 'Domain'],
    howToUse: 'Search for a username or brand to see if it\'s taken on over 500 social networks and check for matching domain names simultaneously.',
    combinations: ['NameCheckup', 'Namechk', 'CheckUserNames'],
    isFree: true
  },
  {
    id: '56',
    name: 'CheckUserNames',
    description: 'Check the use of your brand or username on 160 social networks.',
    url: 'https://checkusernames.com/',
    searchUrl: 'https://checkusernames.com/check.php?u={query}',
    category: 'Social Media',
    tags: ['Username', 'Search', 'Social Networks', 'Social Media', 'Account Finder', 'SOCMINT'],
    howToUse: 'A simple web tool to check the availability of a username on 160 social networks. Useful for initial footprinting or brand protection.',
    combinations: ['WhatsMyName Web', 'KnowEm', 'NameCheckup'],
    isFree: true
  },
  {
    id: '57',
    name: 'Namechk',
    description: 'Check username and domain availability across the most popular social networks.',
    url: 'https://namechk.com/',
    searchUrl: 'https://namechk.com/search?q={query}',
    category: 'Social Media',
    tags: ['Username', 'Domain', 'Search', 'Social Media', 'Branding'],
    howToUse: 'Enter a username to check its availability across the most popular social networks and domain registries. It provides a visual grid of results.',
    combinations: ['NameCheckup', 'KnowEm', 'CheckUserNames'],
    isFree: true
  },
  {
    id: '58',
    name: 'LupaSearch',
    description: 'Search for social media profiles and content across various platforms.',
    url: 'https://lupasearch.com/',
    searchUrl: 'https://lupasearch.com/search?q={query}',
    category: 'Social Media',
    tags: ['Search', 'Social Media', 'Profiles', 'Username', 'Account Finder', 'SOCMINT'],
    howToUse: 'Use the search bar to find social media profiles and content. It aggregates results from various platforms to help you find specific individuals or topics.',
    combinations: ['Social Searcher', 'UserSearch.org', 'Google Search'],
    isFree: true
  },
  {
    id: '59',
    name: 'SocialLinks',
    description: 'OSINT platform for social media investigation and data analysis.',
    url: 'https://sociallinks.io/',
    category: 'Frameworks & Suites',
    tags: ['Social Media', 'Investigation', 'Data', 'Framework', 'Intelligence', 'SOCMINT'],
    howToUse: 'A professional OSINT platform (often used as a Maltego transform) that provides deep data extraction from social media, messengers, and the dark web.',
    combinations: ['Maltego', 'SpiderFoot', 'Lampyre'],
    isFree: false
  },
  {
    id: '60',
    name: 'IntelTechniques',
    description: 'A collection of OSINT tools and resources from Michael Bazzell.',
    url: 'https://inteltechniques.com/tools/index.html',
    category: 'Frameworks & Suites',
    tags: ['Tools', 'Resources', 'Bazzell', 'Directory', 'Guide'],
    howToUse: 'Visit the website to access a vast collection of custom OSINT search tools, training resources, and the "OSINT VM" guide by Michael Bazzell.',
    combinations: ['OSINT Framework', 'Bellingcat Tools', 'Start.me OSINT'],
    isFree: true
  },
  {
    id: '61',
    name: 'Wayback Timeline',
    description: 'Retrieve a historical timeline of snapshots from the Wayback Machine for a given URL.',
    url: 'https://archive.org/web/',
    searchUrl: 'https://web.archive.org/web/*/{query}',
    category: 'Breach & History',
    tags: ['History', 'Archive', 'Timeline', 'Wayback Machine', 'Snapshots'],
    howToUse: 'Enter a URL to see a calendar view of all archived versions of that page. Use it to track changes to websites over time or recover deleted content.',
    combinations: ['Archive.today', 'Waybackpy', 'Google Cache'],
    isFree: true
  },
  {
    id: '62',
    name: 'Breach History',
    description: 'Check if an email or account has been involved in known data breaches.',
    url: 'https://haveibeenpwned.com/',
    searchUrl: 'https://haveibeenpwned.com/account/{query}',
    category: 'Breach & History',
    tags: ['Breach', 'Security', 'History', 'Email', 'Data Leak'],
    howToUse: 'Enter an email address to see a list of all known data breaches that have compromised that account. It provides details on what data was leaked.',
    combinations: ['LeakCheck', 'Snusbase', 'DeHashed'],
    isFree: true
  },
  {
    id: '63',
    name: 'Snusbase',
    description: 'Search through hundreds of data breaches and leaked databases.',
    url: 'https://snusbase.com/',
    category: 'Breach & History',
    tags: ['Breach', 'Leaked', 'Search', 'Email', 'Password', 'IP'],
    howToUse: 'A premium service to search through leaked databases. Enter an email, username, or IP to find associated passwords and other sensitive data from breaches.',
    combinations: ['DeHashed', 'Leak-Lookup', 'Breach History'],
    isFree: false
  },
  {
    id: '64',
    name: 'DeHashed',
    description: 'Free deep-web scan and data breach search engine.',
    url: 'https://dehashed.com/',
    category: 'Breach & History',
    tags: ['Breach', 'Deep Web', 'Search', 'Email', 'IP', 'Username'],
    howToUse: 'Search through billions of leaked records using various identifiers. It allows you to find passwords, hashes, and other PII from historical data breaches.',
    combinations: ['Snusbase', 'LeakCheck', 'Have I Been Pwned'],
    isFree: false
  },
  {
    id: '65',
    name: 'Leak-Lookup',
    description: 'Search over 14 billion records across thousands of data breaches.',
    url: 'https://leak-lookup.com/',
    category: 'Breach & History',
    tags: ['Breach', 'Search', 'Database', 'Email', 'IP', 'Domain'],
    howToUse: 'Enter an email, domain, or IP to search through a massive database of leaked information. It helps identify if your data is being traded on the dark web.',
    combinations: ['Snusbase', 'DeHashed', 'Breach History'],
    isFree: true
  },
  {
    id: '66',
    name: 'Global Social/NSFW Dork Search',
    description: 'Massive Google dorking across social, dating, gaming, financial, and NSFW platforms.',
    url: 'https://www.google.com/search',
    searchUrl: `https://www.google.com/search?q="{query}"+(${GLOBAL_SOCIAL_NSFW_DORK})`,
    category: 'Email & Username',
    tags: ['Dorking', 'Social Media', 'NSFW', 'Dating', 'Gaming', 'Financial'],
    howToUse: 'Enter a username or email to perform a massive Google search across hundreds of platforms.',
    combinations: ['Sherlock', 'Maigret', 'WhatsMyName Web'],
    isFree: true
  },
  {
    id: '67',
    name: 'SteamID I/O',
    description: 'Steam profile lookup and ID converter.',
    url: 'https://steamid.io/',
    searchUrl: 'https://steamid.io/lookup/{query}',
    category: 'Gaming',
    tags: ['Steam', 'Gaming', 'ID', 'Profile'],
    howToUse: 'Enter a Steam username, ID, or profile URL to get detailed account information.',
    combinations: ['Steam Community', 'Tracker.gg'],
    isFree: true
  },
  {
    id: '68',
    name: 'Tracker.gg',
    description: 'Multi-game stats tracker for Valorant, Fortnite, Apex Legends, etc.',
    url: 'https://tracker.gg/',
    searchUrl: 'https://tracker.gg/search?q={query}',
    category: 'Gaming',
    tags: ['Gaming', 'Stats', 'Valorant', 'Fortnite', 'Apex'],
    howToUse: 'Search for a player tag or username to see their stats across various competitive games.',
    combinations: ['SteamID I/O', 'OP.GG'],
    isFree: true
  },
  {
    id: '69',
    name: 'Etherscan',
    description: 'Ethereum blockchain explorer and analytics platform.',
    url: 'https://etherscan.io/',
    searchUrl: 'https://etherscan.io/search?q={query}',
    category: 'Financial',
    tags: ['Crypto', 'Ethereum', 'Blockchain', 'Wallet'],
    howToUse: 'Enter a wallet address, transaction hash, or ENS name to track Ethereum-based activity.',
    combinations: ['Blockchain.com', 'OpenSea'],
    isFree: true
  },
  {
    id: '70',
    name: 'OpenSea',
    description: 'NFT marketplace and profile search.',
    url: 'https://opensea.io/',
    searchUrl: 'https://opensea.io/search?query={query}',
    category: 'Financial',
    tags: ['NFT', 'Crypto', 'Profile', 'Wallet'],
    howToUse: 'Search for a username or wallet address to see their NFT collection and activity.',
    combinations: ['Etherscan', 'Rarible'],
    isFree: true
  },
  {
    id: '71',
    name: 'SocialCatfish',
    description: 'Dating profile verification and reverse search.',
    url: 'https://socialcatfish.com/',
    category: 'Dating',
    tags: ['Dating', 'Verification', 'Reverse Search', 'Catfish'],
    howToUse: 'Use their search tools to verify identities on dating platforms using names, emails, or usernames.',
    combinations: ['Pimeyes', 'Search4Faces'],
    isFree: false
  },
  {
    id: '72',
    name: 'OnlySearch',
    description: 'Search engine for OnlyFans profiles.',
    url: 'https://onlysearch.co/',
    searchUrl: 'https://onlysearch.co/?q={query}',
    category: 'NSFW',
    tags: ['NSFW', 'OnlyFans', 'Search', 'Profile'],
    howToUse: 'Enter a username to find associated OnlyFans profiles and content previews.',
    combinations: ['Fansly', 'Coomer.party'],
    isFree: true
  },
  {
    id: '73',
    name: 'DiscordID.dev',
    description: 'Discord user lookup and ID information.',
    url: 'https://discordid.dev/',
    searchUrl: 'https://discordid.dev/?id={query}',
    category: 'Chat & VoIP',
    tags: ['Discord', 'ID', 'Lookup', 'Profile'],
    howToUse: 'Enter a Discord User ID to get information about the account, including creation date.',
    combinations: ['Discord.com', 'Telegram Search'],
    isFree: true
  },
  {
    id: '74',
    name: 'Telegram Search Engine',
    description: 'Search for Telegram channels, groups, and users.',
    url: 'https://tgstat.com/',
    searchUrl: 'https://tgstat.com/search?q={query}',
    category: 'Chat & VoIP',
    tags: ['Telegram', 'Search', 'Channels', 'Groups'],
    howToUse: 'Search for keywords or usernames to find relevant Telegram entities.',
    combinations: ['DiscordID.dev', 'Signal'],
    isFree: true
  },
  {
    id: '75',
    name: 'Idenit.com',
    description: 'Username search across 1000+ websites.',
    url: 'https://idenit.com/',
    searchUrl: 'https://idenit.com/search/{query}',
    category: 'Email & Username',
    tags: ['Username', 'Search', 'Profile', 'Identity'],
    howToUse: 'Enter a username to search across a massive database of websites. It provides direct links to found profiles.',
    combinations: ['Sherlock', 'Maigret', 'WhatsMyName Web'],
    isFree: true
  },
  {
    id: '76',
    name: 'PimEyes',
    description: 'Advanced facial recognition search engine.',
    url: 'https://pimeyes.com/',
    category: 'Images & Video',
    tags: ['Facial Recognition', 'Search', 'Image', 'Privacy'],
    howToUse: 'Upload a photo of a face to find where it appears online. It\'s a powerful tool for identity verification and finding leaked photos.',
    combinations: ['Search4Faces', 'Yandex Images', 'Social Mapper'],
    isFree: false
  },
  {
    id: '89',
    name: 'Twilio Lookup',
    description: 'Phone number validation and carrier lookup.',
    url: 'https://www.twilio.com/lookup',
    category: 'Chat & VoIP',
    tags: ['Phone', 'VoIP', 'Carrier', 'Validation'],
    howToUse: 'Enter a phone number to get information about its carrier, type (mobile/landline), and validity.',
    isFree: true
  },
  {
    id: '90',
    name: 'Truecaller',
    description: 'Global caller ID and spam blocking service.',
    url: 'https://www.truecaller.com/',
    searchUrl: 'https://www.truecaller.com/search/global/{query}',
    category: 'Chat & VoIP',
    tags: ['Phone', 'Caller ID', 'Identity', 'Search'],
    howToUse: 'Search for a phone number to identify the owner and report spam.',
    isFree: true
  },
  {
    id: '93',
    name: 'Steam Community',
    description: 'Social network for Steam gamers.',
    url: 'https://steamcommunity.com/',
    searchUrl: 'https://steamcommunity.com/search/users/#text={query}',
    category: 'Gaming',
    tags: ['Gaming', 'Social', 'Profile', 'Steam'],
    howToUse: 'Search for users by their Steam persona name or real name.',
    isFree: true
  },
  {
    id: '94',
    name: 'OnlyFans Searcher',
    description: 'Search for OnlyFans profiles.',
    url: 'https://onlysearcher.com/',
    searchUrl: 'https://onlysearcher.com/search/{query}',
    category: 'NSFW',
    tags: ['NSFW', 'OnlyFans', 'Profile', 'Search'],
    howToUse: 'Search for OnlyFans creators by username or keyword.',
    isFree: true
  },
  {
    id: '95',
    name: 'Tinder Search',
    description: 'Search for Tinder profiles (via third-party tools).',
    url: 'https://cheaterbuster.net/',
    category: 'Dating',
    tags: ['Dating', 'Tinder', 'Profile', 'Search'],
    howToUse: 'Use this tool to find if someone is active on Tinder by their name and location.',
    isFree: false
  },
  {
    id: '96',
    name: 'WordPress.com',
    description: 'Popular blogging platform.',
    url: 'https://wordpress.com/',
    searchUrl: 'https://wordpress.com/read/search/?q={query}',
    category: 'Search Engines',
    tags: ['Blog', 'Content', 'Search', 'Platform'],
    howToUse: 'Search for blogs and posts across the WordPress.com network.',
    isFree: true
  },
  {
    id: '97',
    name: 'eBay User Search',
    description: 'Search for eBay users and their listings.',
    url: 'https://www.ebay.com/',
    searchUrl: 'https://www.ebay.com/usr/{query}',
    category: 'Search Engines',
    tags: ['Selling', 'Marketplace', 'Profile', 'eBay'],
    howToUse: 'Directly access an eBay user profile by their username.',
    isFree: true
  },
  {
    id: '98',
    name: 'Etsy Search',
    description: 'Search for Etsy shops and items.',
    url: 'https://www.etsy.com/',
    searchUrl: 'https://www.etsy.com/search?q={query}',
    category: 'Search Engines',
    tags: ['Selling', 'Marketplace', 'Shop', 'Etsy'],
    howToUse: 'Search for products or shops on the Etsy platform.',
    isFree: true
  },
  {
    id: '99',
    name: 'Blogger Search',
    description: 'Search for blogs on the Blogger platform.',
    url: 'https://www.blogger.com/',
    searchUrl: 'https://www.google.com/search?q=site:blogspot.com+{query}',
    category: 'Search Engines',
    tags: ['Blog', 'Blogger', 'Search', 'Google'],
    howToUse: 'Use Google Dorking to find specific blogs on the blogspot.com domain.',
    isFree: true
  }
];
