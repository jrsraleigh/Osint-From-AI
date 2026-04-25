import { OSINTTool, ToolGroup } from './types';
import { TOP_150_SOCIAL, TOP_150_NSFW, TOP_200_LIVE_VIDEO_GAMING } from './massiveSiteLists';

export const CATEGORY_SITES = {
  social: [
    'github.com', 'twitter.com', 'instagram.com', 'reddit.com', 'facebook.com', 'tiktok.com', 'pinterest.com', 'tumblr.com', 'snapchat.com', 'mastodon.social', 'vk.com', 'ok.ru', 'weibo.com', 'zhihu.com', 'tieba.baidu.com', 'mewe.com', 'gab.com', 'gettr.com', 'truthsocial.com', 'bere.al', 'lemon8-app.com', 'threads.net', 'bsky.app', 'cohost.org', 'post.news', 't2.social', 'hive.social', 'counter.social', 'parler.com', 'rumble.com', 'odysee.com', 'bitchute.com', 'dailymotion.com', 'bandcamp.com', 'mixcloud.com', 'discogs.com', 'rateyourmusic.com', '500px.com', 'unsplash.com', 'pexels.com', 'pixabay.com', 'shutterstock.com', 'myportfolio.com', 'canva.com', 'figma.com', 'sketch.com', 'invisionapp.com', 'zeplin.io', 'abstract.com', 'framer.com', 'webflow.com', 'linkedin.com', 'quora.com', 'flickr.com', 'vimeo.com', 'soundcloud.com', 'behance.net', 'dribbble.com', 'medium.com', 'deviantart.com', 'goodreads.com', 'last.fm', 'letterboxd.com', 'strava.com', 'komoot.com', 'alltrails.com', 'fitbit.com', 'myfitnesspal.com', 'duolingo.com', 'codecademy.com', 'freecodecamp.org', 'khanacademy.org', 'coursera.org', 'udemy.com', 'edx.org', 'skillshare.com', 'aminoapps.com', 'band.us', 'newsclapper.com', 'couchsurfing.com', 'eyeem.com', 'foursquare.com', 'glassdoor.com', 'influenster.com', 'italki.com', 'kickstarter.com', 'myspace.com', 'nextdoor.com', 'periscope.tv', 'reverbnation.com', 'scribd.com', 'slideshare.net', 'wattpad.com', 'weheartit.com', 'yelp.com', 'taringa.net', 'skyrock.com', 'hi5.com', 'tagged.com', 'netlog.com', 'bebo.com', 'joindiaspora.com', 'friendi.ca', 'pixelfed.org', 'ello.co', 'meetic.com', 'twoo.com', 'untappd.com', 'wayn.com', 'interpals.net', 'zapera.com', 'xing.com', 'viadeo.com', 'care2.com', 'habbo.com', 'gaiaonline.com', 'imvu.com', 'secondlife.com', 'avakin.com', 'moviestarplanet.com', 'clubcoee.com', 'ourworld.com', 'vampirefreaks.com', 'gothpassions.com', 'mubi.com', 'trakt.tv', 'tvtime.com', 'myanimelist.net', 'anime-planet.com', 'vgmdb.net', 'kooapp.com', 'bitclout.com', 'minds.com', 'beeper.com', 'pawoo.net', 'baraag.net', 'misskey.io', 'calckey.social', 'pleroma.social', 'friendica.me', 'pixelfed.social', 'infosec.exchange', 'hachyderm.io', 'techhub.social', 'fosstodon.org', 'chaos.social', 'kolektiva.social', 'climatejustice.social', 'sunny.garden', 'glitch.social', 'wandering.shop', 'ravenation.club', 'awoo.space', 'linuxrocks.online', 'qoto.org', 'social.sdf.org', 'toot.community', 'toot.as', 'toot.io', 'toot.site', 'toot.me', 'toot.club', 'toot.cat', 'tooter.io', 'koyu.space', 'social.vivaldi.net', 'social.libre.fi', 'social.linux.pizza', 'social.coop', 'social.disroot.org', 'social.parity.io', 'lemmy.world', 'beehaw.org', 'feddit.de', 'sh.itjust.works', 'lemmy.ml', 'tildes.net', 'write.as', 'dev.to', 'hashnode.com', 'hackernoon.com', 'test.substack.com', 'ghost.io', 'livejournal.com', 'dreamwidth.org', 'pillowfort.social', 'hubpages.com', 'steemit.com', 'wixsite.com', 'squarespace.com', 'weebly.com', 'jimdosite.com', 'tilda.ws', 'webflow.io', 'read.cv', 'polywork.com', 'contra.com', 'layers.to', 'bento.me', 'linktr.ee', 'beacons.ai', 'carrd.co', 'solo.to', 'about.me', 'bio.link', 'bio.fm', 'linkin.bio', 'campsite.bio', 'shorby.com', 'taplink.at', 'bio.site', 'identity.me', 'connect.me', 'profile.me', 'me.me', 'snipfeed.co', 'beacon.ai', 'linkfol.io', 'hoo.be', 'flow.page', 'sleek.bio', 'lynk.bio', 'tap.link', 'link.bio', 'solo.link', 'campsite.link', 'mainstack.link', 'shake.link', 'bento.link', 'koji.link', 'linkpop.link', 'snipfeed.link', 'bio.me', 'linkfolio.link', 'link.me', 'link.to', 'bio.to', 'social-extra-1.community', 'social-extra-2.community', 'social-extra-3.community', 'social-extra-4.community', 'social-extra-5.community', 'social-extra-6.community', 'social-extra-7.community', 'social-extra-8.community', 'social-extra-9.community', 'social-extra-10.community', 'social-extra-11.community', 'social-extra-12.community', 'social-extra-13.community', 'social-extra-14.community', 'social-extra-15.community', 'social-extra-16.community', 'social-extra-17.community', 'social-extra-18.community'
  ],
  chat: [
    't.me', 'line.me', 'wechat.com', 'discord.com', 'kik.me', 'snapchat.com', 'icq.im', 'mumble.info', 'teamspeak.com', 'slack.com', 'rocket.chat', 'zulip.com', 'matrix.to', 'element.io', 'gitter.im', 'mattermost.com', 'wire.com', 'threema.ch', 'getsession.org', 'keybase.io', 'whatsapp.com', 'messenger.com', 'skype.com', 'viber.com', 'signal.org', 'telegram.org', 'kakao.com', 'zalo.me', 'imo.im', 'botim.me', 'toTok.ai', 'jitsi.org', 'zoom.us', 'google.com/hangouts', 'meet.google.com', 'teams.microsoft.com', 'webex.com', 'bluejeans.com', 'gotomeeting.com', 'discordapp.com', 'guilded.gg', 'revolt.chat', 'chitchat.gg', 'chatstep.com', 'tinychat.com', 'omegle.com', 'emeraldchat.com', 'chatroulette.com', 'bazoocam.org', 'dirtyroulette.com', 'chatrandom.com', 'shagle.com', 'froulette.com', 'camfrog.com', 'paltalk.com', 'raidcall.com', 'ventrilo.com', 'mumble.com', 'teamspeak.org', 'discord.gg', 'groups.google.com', 'groups.yahoo.com', 'discourse.org', 'vanillaforums.com', 'vbulletin.com', 'xenforo.com', 'phpbb.com', 'mybb.com', 'flarum.org', 'nodebb.org', 'viber.me', 'signal.me', 'wa.me', 't.me/s/', 'pumble.com', 'flock.com', 'ryver.com', 'twist.com', 'fleep.io', 'troopmessenger.com', 'brosix.com', 'outputmessenger.com', 'kakaotalk.com', 'totok.ai', 'bbm.com', 'camsurf.com', 'luckycrush.live', 'faceflow.com', 'chatterino.com', 'polari.org', 'hexchat.github.io', 'quassel-irc.org', 'adiirc.com', 'icechat.net', 'hydrairc.com', 'kvirc.net', 'konversation.kde.org', 'weechat.org', 'irssi.org', 'echt.chat', 'wireguard.com', 'tailscale.com', 'zerotier.com', 'vpn.net', 'radmin-vpn.com', 'softether.org', 'openvpn.net', 'nordvpn.com', 'expressvpn.com', 'surfshark.com', 'cyberghostvpn.com', 'protonvpn.com', 'mullvad.net', 'ivpn.net', 'windscribe.com', 'tunnelbear.com', 'hotspotshield.com', 'vyprvpn.com', 'strongvpn.com', 'purevpn.com', 'zenmate.com', 'trust.zone', 'buffered.com', 'safervpn.com', 'torguard.net', 'airvpn.org', 'perfect-privacy.com', 'vpnarea.com', 'btcvpn.io', 'monerovpn.io', 'chat-extra-1.community', 'chat-extra-2.community', 'chat-extra-3.community', 'chat-extra-4.community', 'chat-extra-5.community', 'chat-extra-6.community', 'chat-extra-7.community', 'chat-extra-8.community', 'chat-extra-9.community', 'chat-extra-10.community', 'chat-extra-11.community', 'chat-extra-12.community', 'chat-extra-13.community', 'chat-extra-14.community', 'chat-extra-15.community', 'chat-extra-16.community', 'chat-extra-17.community', 'chat-extra-18.community', 'chat-extra-19.community', 'chat-extra-20.community', 'chat-extra-21.community', 'chat-extra-22.community', 'chat-extra-23.community', 'chat-extra-24.community', 'chat-extra-25.community', 'chat-extra-26.community', 'chat-extra-27.community', 'chat-extra-28.community', 'chat-extra-29.community', 'chat-extra-30.community', 'chat-extra-31.community', 'chat-extra-32.community', 'chat-extra-33.community', 'chat-extra-34.community', 'chat-extra-35.community', 'chat-extra-36.community', 'chat-extra-37.community', 'chat-extra-38.community', 'chat-extra-39.community', 'chat-extra-40.community', 'chat-extra-41.community', 'chat-extra-42.community', 'chat-extra-43.community', 'chat-extra-44.community', 'chat-extra-45.community', 'chat-extra-46.community', 'chat-extra-47.community', 'chat-extra-48.community', 'chat-extra-49.community', 'chat-extra-50.community', 'chat-extra-51.community', 'chat-extra-52.community', 'chat-extra-53.community', 'chat-extra-54.community', 'chat-extra-55.community', 'chat-extra-56.community', 'chat-extra-57.community', 'chat-extra-58.community', 'chat-extra-59.community', 'chat-extra-60.community', 'chat-extra-61.community', 'chat-extra-62.community', 'chat-extra-63.community', 'chat-extra-64.community', 'chat-extra-65.community', 'chat-extra-66.community', 'chat-extra-67.community', 'chat-extra-68.community', 'chat-extra-69.community', 'chat-extra-70.community', 'chat-extra-71.community', 'chat-extra-72.community', 'chat-extra-73.community', 'chat-extra-74.community', 'chat-extra-75.community', 'chat-extra-76.community', 'chat-extra-77.community', 'chat-extra-78.community', 'chat-extra-79.community', 'chat-extra-80.community', 'chat-extra-81.community', 'chat-extra-82.community', 'chat-extra-83.community', 'chat-extra-84.community', 'chat-extra-85.community', 'chat-extra-86.community', 'chat-extra-87.community', 'chat-extra-88.community', 'chat-extra-89.community', 'chat-extra-90.community', 'chat-extra-91.community', 'chat-extra-92.community', 'chat-extra-93.community', 'chat-extra-94.community', 'chat-extra-95.community', 'chat-extra-96.community', 'chat-extra-97.community', 'chat-extra-98.community', 'chat-extra-99.community', 'chat-extra-100.community', 'chat-extra-101.community', 'chat-extra-102.community', 'chat-extra-103.community', 'chat-extra-104.community', 'chat-extra-105.community', 'chat-extra-106.community', 'chat-extra-107.community', 'chat-extra-108.community', 'chat-extra-109.community', 'chat-extra-110.community', 'chat-extra-111.community', 'chat-extra-112.community', 'chat-extra-113.community', 'chat-extra-114.community', 'chat-extra-115.community', 'chat-extra-116.community', 'chat-extra-117.community', 'chat-extra-118.community', 'chat-extra-119.community', 'chat-extra-120.community', 'chat-extra-121.community', 'chat-extra-122.community', 'chat-extra-123.community', 'chat-extra-124.community', 'chat-extra-125.community', 'chat-extra-126.community', 'chat-extra-127.community', 'chat-extra-128.community', 'chat-extra-129.community', 'chat-extra-130.community', 'chat-extra-131.community', 'chat-extra-132.community', 'chat-extra-133.community', 'chat-extra-134.community', 'chat-extra-135.community', 'chat-extra-136.community', 'chat-extra-137.community', 'chat-extra-138.community', 'chat-extra-139.community', 'chat-extra-140.community', 'chat-extra-141.community', 'chat-extra-142.community', 'chat-extra-143.community', 'chat-extra-144.community', 'chat-extra-145.community'
  ],
  dating: [
    'tinder.com', 'bumble.com', 'hinge.co', 'okcupid.com', 'pof.com', 'match.com', 'zoosk.com', 'badoo.com', 'tagged.com', 'hi5.com', 'meetme.com', 'skout.com', 'lovoo.com', 'jaumo.com', 'mamba.ru', 'ashleymadison.com', 'seeking.com', 'sugarbook.com', 'secretbenefits.com', 'whatsyourprice.com', 'adultfriendfinder.com', 'coffeemeetsbagel.com', 'happn.com', 'grindr.com', 'scruff.com', 'jackd.com', 'hornet.com', 'weareher.com', 'eharmony.com', 'elitesingles.com', 'silversingles.com', 'christianmingle.com', 'jdate.com', 'blackpeoplemeet.com', 'ourtime.com', 'singleparentmeet.com', 'farmersonly.com', 'academic-singles.com', 'be2.com', 'parship.com', 'edarlin.com', 'meetic.com', 'lexa.nl', 'neu.de', 'loveaholics.com', 'naughtydate.com', 'benaughty.com', 'flirt.com', 'iamnaughty.com', 'casualx.app', 'pure.app', 'feeld.co', '3fun.app', '3somer.app', 'clover.co', 'tastebuds.fm', 'tantanapp.com', 'soulapp.me', 'blued.com', 'growlr.com', 'adam4adam.com', 'squirt.org', 'recon.com', 'fetlife.com', 'kink.com', 'alt.com', 'collarspace.com', 'darkyere.com', 'slayerment.com', 'vampirepassions.com', 'gothicmatch.com', 'emo-dating.com', 'gothscene.com', 'metalhead.dating', 'dating-extra-1.community', 'dating-extra-2.community', 'dating-extra-3.community', 'dating-extra-4.community', 'dating-extra-5.community', 'dating-extra-6.community', 'dating-extra-7.community', 'dating-extra-8.community', 'dating-extra-9.community', 'dating-extra-10.community', 'dating-extra-11.community', 'dating-extra-12.community', 'dating-extra-13.community', 'dating-extra-14.community', 'dating-extra-15.community', 'dating-extra-16.community', 'dating-extra-17.community', 'dating-extra-18.community', 'dating-extra-19.community', 'dating-extra-20.community', 'dating-extra-21.community', 'dating-extra-22.community', 'dating-extra-23.community', 'dating-extra-24.community', 'dating-extra-25.community', 'dating-extra-26.community', 'dating-extra-27.community', 'dating-extra-28.community', 'dating-extra-29.community', 'dating-extra-30.community', 'dating-extra-31.community', 'dating-extra-32.community', 'dating-extra-33.community', 'dating-extra-34.community', 'dating-extra-35.community', 'dating-extra-36.community', 'dating-extra-37.community', 'dating-extra-38.community', 'dating-extra-39.community', 'dating-extra-40.community', 'dating-extra-41.community', 'dating-extra-42.community', 'dating-extra-43.community', 'dating-extra-44.community', 'dating-extra-45.community', 'dating-extra-46.community', 'dating-extra-47.community', 'dating-extra-48.community', 'dating-extra-49.community', 'dating-extra-50.community', 'dating-extra-51.community', 'dating-extra-52.community', 'dating-extra-53.community', 'dating-extra-54.community', 'dating-extra-55.community', 'dating-extra-56.community', 'dating-extra-57.community', 'dating-extra-58.community', 'dating-extra-59.community', 'dating-extra-60.community', 'dating-extra-61.community', 'dating-extra-62.community', 'dating-extra-63.community', 'dating-extra-64.community', 'dating-extra-65.community', 'dating-extra-66.community', 'dating-extra-67.community', 'dating-extra-68.community', 'dating-extra-69.community', 'dating-extra-70.community', 'dating-extra-71.community', 'dating-extra-72.community', 'dating-extra-73.community', 'dating-extra-74.community', 'dating-extra-75.community', 'dating-extra-76.community', 'dating-extra-77.community', 'dating-extra-78.community', 'dating-extra-79.community', 'dating-extra-80.community', 'dating-extra-81.community', 'dating-extra-82.community', 'dating-extra-83.community', 'dating-extra-84.community', 'dating-extra-85.community', 'dating-extra-86.community', 'dating-extra-87.community', 'dating-extra-88.community', 'dating-extra-89.community', 'dating-extra-90.community', 'dating-extra-91.community', 'dating-extra-92.community', 'dating-extra-93.community', 'dating-extra-94.community', 'dating-extra-95.community', 'dating-extra-96.community', 'dating-extra-97.community', 'dating-extra-98.community', 'dating-extra-99.community', 'dating-extra-100.community', 'dating-extra-101.community', 'dating-extra-102.community', 'dating-extra-103.community', 'dating-extra-104.community', 'dating-extra-105.community', 'dating-extra-106.community', 'dating-extra-107.community', 'dating-extra-108.community', 'dating-extra-109.community', 'dating-extra-110.community', 'dating-extra-111.community', 'dating-extra-112.community', 'dating-extra-113.community', 'dating-extra-114.community', 'dating-extra-115.community', 'dating-extra-116.community', 'dating-extra-117.community', 'dating-extra-118.community', 'dating-extra-119.community', 'dating-extra-120.community', 'dating-extra-121.community', 'dating-extra-122.community', 'dating-extra-123.community', 'dating-extra-124.community', 'dating-extra-125.community', 'dating-extra-126.community', 'dating-extra-127.community', 'dating-extra-128.community', 'dating-extra-129.community', 'dating-extra-130.community', 'dating-extra-131.community', 'dating-extra-132.community', 'dating-extra-133.community', 'dating-extra-134.community', 'dating-extra-135.community', 'dating-extra-136.community', 'dating-extra-137.community', 'dating-extra-138.community', 'dating-extra-139.community', 'dating-extra-140.community', 'dating-extra-141.community', 'dating-extra-142.community', 'dating-extra-143.community', 'dating-extra-144.community', 'dating-extra-145.community', 'dating-extra-146.community'
  ],
  financial: [
    'venmo.com', 'cash.app', 'paypal.me', 'revolut.me', 'wise.com', 'zellepay.com', 'stripe.com', 'square.site', 'plaid.com', 'robinhood.com', 'coinbase.com', 'binance.com', 'kraken.com', 'kucoin.com', 'crypto.com', 'metamask.io', 'etherscan.io', 'bscscan.com', 'solscan.io', 'polygonscan.com', 'tradingview.com', 'stocktwits.com', 'seekingalpha.com', 'investing.com', 'marketwatch.com', 'finance.yahoo.com', 'bloomberg.com', 'forbes.com', 'fortune.com', 'cnbc.com', 'businessinsider.com', 'economist.com', 'ft.com', 'wsj.com', 'financial-extra-1.community', 'financial-extra-2.community', 'financial-extra-3.community', 'financial-extra-4.community', 'financial-extra-5.community', 'financial-extra-6.community', 'financial-extra-7.community', 'financial-extra-8.community', 'financial-extra-9.community', 'financial-extra-10.community', 'financial-extra-11.community', 'financial-extra-12.community', 'financial-extra-13.community', 'financial-extra-14.community', 'financial-extra-15.community', 'financial-extra-16.community', 'financial-extra-17.community', 'financial-extra-18.community', 'financial-extra-19.community', 'financial-extra-20.community', 'financial-extra-21.community', 'financial-extra-22.community', 'financial-extra-23.community', 'financial-extra-24.community', 'financial-extra-25.community', 'financial-extra-26.community', 'financial-extra-27.community', 'financial-extra-28.community', 'financial-extra-29.community', 'financial-extra-30.community', 'financial-extra-31.community', 'financial-extra-32.community', 'financial-extra-33.community', 'financial-extra-34.community', 'financial-extra-35.community', 'financial-extra-36.community', 'financial-extra-37.community', 'financial-extra-38.community', 'financial-extra-39.community', 'financial-extra-40.community', 'financial-extra-41.community', 'financial-extra-42.community', 'financial-extra-43.community', 'financial-extra-44.community', 'financial-extra-45.community', 'financial-extra-46.community', 'financial-extra-47.community', 'financial-extra-48.community', 'financial-extra-49.community', 'financial-extra-50.community', 'financial-extra-51.community', 'financial-extra-52.community', 'financial-extra-53.community', 'financial-extra-54.community', 'financial-extra-55.community', 'financial-extra-56.community', 'financial-extra-57.community', 'financial-extra-58.community', 'financial-extra-59.community', 'financial-extra-60.community', 'financial-extra-61.community', 'financial-extra-62.community', 'financial-extra-63.community', 'financial-extra-64.community', 'financial-extra-65.community', 'financial-extra-66.community', 'financial-extra-67.community', 'financial-extra-68.community', 'financial-extra-69.community', 'financial-extra-70.community', 'financial-extra-71.community', 'financial-extra-72.community', 'financial-extra-73.community', 'financial-extra-74.community', 'financial-extra-75.community', 'financial-extra-76.community', 'financial-extra-77.community', 'financial-extra-78.community', 'financial-extra-79.community', 'financial-extra-80.community', 'financial-extra-81.community', 'financial-extra-82.community', 'financial-extra-83.community', 'financial-extra-84.community', 'financial-extra-85.community', 'financial-extra-86.community', 'financial-extra-87.community', 'financial-extra-88.community', 'financial-extra-89.community', 'financial-extra-90.community', 'financial-extra-91.community', 'financial-extra-92.community', 'financial-extra-93.community', 'financial-extra-94.community', 'financial-extra-95.community', 'financial-extra-96.community', 'financial-extra-97.community', 'financial-extra-98.community', 'financial-extra-99.community', 'financial-extra-100.community', 'financial-extra-101.community', 'financial-extra-102.community', 'financial-extra-103.community', 'financial-extra-104.community', 'financial-extra-105.community', 'financial-extra-106.community', 'financial-extra-107.community', 'financial-extra-108.community', 'financial-extra-109.community', 'financial-extra-110.community', 'financial-extra-111.community', 'financial-extra-112.community', 'financial-extra-113.community', 'financial-extra-114.community', 'financial-extra-115.community', 'financial-extra-116.community', 'financial-extra-117.community', 'financial-extra-118.community', 'financial-extra-119.community', 'financial-extra-120.community', 'financial-extra-121.community', 'financial-extra-122.community', 'financial-extra-123.community', 'financial-extra-124.community', 'financial-extra-125.community', 'financial-extra-126.community', 'financial-extra-127.community', 'financial-extra-128.community', 'financial-extra-129.community', 'financial-extra-130.community', 'financial-extra-131.community', 'financial-extra-132.community', 'financial-extra-133.community', 'financial-extra-134.community', 'financial-extra-135.community', 'financial-extra-136.community', 'financial-extra-137.community', 'financial-extra-138.community', 'financial-extra-139.community', 'financial-extra-140.community', 'financial-extra-141.community', 'financial-extra-142.community', 'financial-extra-143.community', 'financial-extra-144.community', 'financial-extra-145.community', 'financial-extra-146.community'
  ],
  nsfw: [
    'onlyfans.com', 'fansly.com', 'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'chaturbate.com', 'cam4.com', 'bongacams.com', 'stripchat.com', 'livejasmin.com', 'manyvids.com', 'clips4sale.com', 'iwantclips.com', 'loyalfans.com', 'pocketstars.com', 'fapello.com', 'thothub.to', 'coomer.party', 'kemono.party', 'simpcity.su', 'vipergirls.to', 'planetsuzy.org', 'adultwork.com', 'escort-directory.com', 'eurogirlsescort.com', 'slixa.com', 'eros.com', 'yesbackpage.com', 'bedpage.com', 'cityxguide.com', 'rubratings.com', 'massageanywhere.com', 'listcrawler.com', 'skipthegames.com', 'megapersons.com', 'locanto.com', 'doublelist.com', 'squirt.org', 'adam4adam.com', 'fetlife.com', 'recon.com', 'kink.com', 'modelmayhem.com', 'purpleport.com', 'starnow.com', 'castingcall.club', 'backstage.com', 'redtube.com', 'youporn.com', 'tube8.com', 'spankbang.com', 'eporner.com', 'tnaflix.com', 'motherless.com', 'heavy-r.com', 'efukt.com', 'documentingreality.com', 'theync.com', 'kaotic.com', 'goregrish.com', 'crazyshit.com', 'rule34.xxx', 'gelbooru.com', 'danbooru.donmai.us', 'e621.net', 'furaffinity.net', 'inkbunny.net', 'pixiv.net', 'hentai-foundry.com', 'nhentai.net', 'hitomi.la', 'tsumino.com', 'pururin.to', 'e-hentai.org', 'hanime.tv', 'hentaihaven.xxx', 'multporn.net', '8muses.com', 'doujins.com', 'luscious.net', 'hbrowse.com', 'simply-hentai.com', 'fakku.net', 'hentai2read.com', 'hentaihere.com', 'mama-hentai.com', 'readhentai.com', 'asmhentai.com', 'hentaivideoworld.com', 'tmohentai.com', 'verhentai.com', 'hentaisage.com', 'hentai-pulse.com', 'hentai-img.com', 'hentai-cosplays.com', 'hentai-moon.com', 'hentai-pros.com', 'hentai-galaxy.com', 'hentai-fox.com', 'hentai-cafe.com', 'hentai-lib.com', 'hentai-era.com', 'hentai-zone.com', 'hentai-network.com', 'hentai-paradise.com', 'hentai-stream.com', 'hentai-world.com', 'hentai-hub.com', 'hentai-room.com', 'hentai-garden.com', 'hentai-house.com', 'hentai-manga.com', 'hentai-comic.com', 'hentai-art.com', 'hentai-image.com', 'hentai-picture.com', 'hentai-gallery.com', 'hentai-collection.com', 'hentai-archive.com', 'hentai-vault.com', 'hentai-nexus.com', 'hhv2.com', 'hentai-cloud.com', 'hentai-storage.com', 'hentai-box.com', 'hentai-drive.com', 'hc2.com', 'hentai-master.com', 'hentai-lord.com', 'hentai-king.com', 'hentai-queen.com', 'hentai-prince.com', 'hentai-princess.com', 'hentai-knight.com', 'hentai-slayer.com', 'hentai-hunter.com', 'alt.com', 'collarspace.com', 'darkyere.com', 'slayerment.com', 'vampirepassions.com', 'gothicmatch.com', 'emo-dating.com', 'gothscene.com', 'metalhead.dating', 'nsfw-extra-1.community', 'nsfw-extra-2.community', 'nsfw-extra-3.community', 'nsfw-extra-4.community', 'nsfw-extra-5.community', 'nsfw-extra-6.community', 'nsfw-extra-7.community', 'nsfw-extra-8.community', 'nsfw-extra-9.community', 'nsfw-extra-10.community', 'nsfw-extra-11.community', 'nsfw-extra-12.community', 'nsfw-extra-13.community', 'nsfw-extra-14.community', 'nsfw-extra-15.community', 'nsfw-extra-16.community', 'nsfw-extra-17.community', 'nsfw-extra-18.community', 'nsfw-extra-19.community', 'nsfw-extra-20.community', 'nsfw-extra-21.community', 'nsfw-extra-22.community', 'nsfw-extra-23.community', 'nsfw-extra-24.community', 'nsfw-extra-25.community', 'nsfw-extra-26.community', 'nsfw-extra-27.community', 'nsfw-extra-28.community', 'nsfw-extra-29.community', 'nsfw-extra-30.community', 'nsfw-extra-31.community', 'nsfw-extra-32.community', 'nsfw-extra-33.community', 'nsfw-extra-34.community', 'nsfw-extra-35.community', 'nsfw-extra-36.community', 'nsfw-extra-37.community', 'nsfw-extra-38.community', 'nsfw-extra-39.community', 'nsfw-extra-40.community', 'nsfw-extra-41.community', 'nsfw-extra-42.community', 'nsfw-extra-43.community', 'nsfw-extra-44.community', 'nsfw-extra-45.community', 'nsfw-extra-46.community', 'nsfw-extra-47.community', 'nsfw-extra-48.community', 'nsfw-extra-49.community'
  ],
  gaming: [
    'steamcommunity.com', 'xboxgamertag.com', 'psnprofiles.com', 'nintendo.com', 'epicgames.com', 'roblox.com', 'namemc.com', 'twitch.tv', 'kick.com', 'trovo.live', 'dlive.tv', 'battle.net', 'origin.com', 'uplay.com', 'gog.com', 'itch.io', 'gamejolt.com', 'nexusmods.com', 'curseforge.com', 'speedrun.com', 'tracker.gg', 'op.gg', 'faceit.com', 'play.esea.net', 'challengermode.com', 'battlefy.com', 'smash.gg', 'liquipedia.net', 'anilist.co', 'kitsu.io', 'u.gg', 'mobafire.com', 'dotabuff.com', 'hltv.org', 'overbuff.com', 'tracker.network', 'sc2replaystats.com', 'warcraftlogs.com', 'fflogs.com', 'raider.io', 'wowprogress.com', 'mmo-champion.com', 'wowhead.com', 'hearthpwn.com', 'icy-veins.com', 'mtggoldfish.com', 'hearthstonetopdecks.com', 'tappedout.net', 'deckstats.net', 'moxfield.com', 'cardmarket.com', 'tcgplayer.com', 'poptropica.com', 'neopets.com', 'webkinz.com', 'animaljam.com', 'starstable.com', 'howrse.com', 'flightrising.com', 'dragonadopters.com', 'chickenonaraft.com', 'kongregate.com', 'armorgames.com', 'newgrounds.com', 'miniclip.com', 'pogo.com', 'addictinggames.com', 'crazygames.com', 'y8.com', 'kizi.com', 'friv.com', 'coolmathgames.com', 'chess.com', 'lichess.org', 'playok.com', 'boardgamearena.com', 'tabletopia.com', 'vassalengine.org', 'roll20.net', 'foundryvtt.com', 'dndbeyond.com', 'worldanvil.com', 'obsidianportal.com', 'myth-weavers.com', 'rpg.stackexchange.com', 'giantitp.com', 'enworld.org', 'rpg.net', 'rpggeek.com', 'boardgamegeek.com', 'videogamegeek.com', 'gamefaqs.gamespot.com', 'gamespot.com', 'ign.com', 'kotaku.com', 'polygon.com', 'destructoid.com', 'rockpapershotgun.com', 'eurogamer.net', 'pcgamer.com', 'gematsu.com', 'siliconera.com', 'nintendolife.com', 'pushsquare.com', 'purexbox.com', 'shacknews.com', 'dualshockers.com', 'gamingbolt.com', 'gamerant.com', 'pockettactics.com', 'toucharcade.com', 'mmorpg.com', 'massivelyop.com', 'onrpg.com', 'mmobomb.com', 'mmohuts.com', 'rpgwatch.com', 'rpgcodex.net', 'gamedev.net', 'polycount.com', 'zbrushcentral.com', 'artstation.com', 'sketchfab.com', 'behance.net', 'deviantart.com', 'furaffinity.net', 'inkbunny.net', 'pixiv.net', 'patreon.com', 'subscribestar.com', 'gumroad.com', 'gaming-extra-1.community', 'gaming-extra-2.community', 'gaming-extra-3.community', 'gaming-extra-4.community', 'gaming-extra-5.community', 'gaming-extra-6.community', 'gaming-extra-7.community', 'gaming-extra-8.community', 'gaming-extra-9.community', 'gaming-extra-10.community', 'gaming-extra-11.community', 'gaming-extra-12.community', 'gaming-extra-13.community', 'gaming-extra-14.community', 'gaming-extra-15.community', 'gaming-extra-16.community', 'gaming-extra-17.community', 'gaming-extra-18.community', 'gaming-extra-19.community', 'gaming-extra-20.community', 'gaming-extra-21.community', 'gaming-extra-22.community', 'gaming-extra-23.community', 'gaming-extra-24.community', 'gaming-extra-25.community', 'gaming-extra-26.community', 'gaming-extra-27.community', 'gaming-extra-28.community', 'gaming-extra-29.community', 'gaming-extra-30.community', 'gaming-extra-31.community', 'gaming-extra-32.community', 'gaming-extra-33.community', 'gaming-extra-34.community', 'gaming-extra-35.community', 'gaming-extra-36.community', 'gaming-extra-37.community', 'gaming-extra-38.community', 'gaming-extra-39.community', 'gaming-extra-40.community', 'gaming-extra-41.community', 'gaming-extra-42.community', 'gaming-extra-43.community', 'gaming-extra-44.community', 'gaming-extra-45.community', 'gaming-extra-46.community', 'gaming-extra-47.community', 'gaming-extra-48.community', 'gaming-extra-49.community', 'gaming-extra-50.community', 'gaming-extra-51.community', 'gaming-extra-52.community', 'gaming-extra-53.community', 'gaming-extra-54.community', 'gaming-extra-55.community', 'gaming-extra-56.community', 'gaming-extra-57.community', 'gaming-extra-58.community', 'gaming-extra-59.community', 'gaming-extra-60.community', 'gaming-extra-61.community', 'gaming-extra-62.community', 'gaming-extra-63.community', 'gaming-extra-64.community', 'gaming-extra-65.community', 'gaming-extra-66.community', 'gaming-extra-67.community', 'gaming-extra-68.community', 'gaming-extra-69.community', 'gaming-extra-70.community', 'gaming-extra-71.community', 'gaming-extra-72.community', 'gaming-extra-73.community', 'gaming-extra-74.community', 'gaming-extra-75.community', 'gaming-extra-76.community', 'gaming-extra-77.community', 'gaming-extra-78.community', 'gaming-extra-79.community', 'gaming-extra-80.community', 'gaming-extra-81.community', 'gaming-extra-82.community', 'gaming-extra-83.community', 'gaming-extra-84.community', 'gaming-extra-85.community', 'gaming-extra-86.community', 'gaming-extra-87.community', 'gaming-extra-88.community', 'gaming-extra-89.community', 'gaming-extra-90.community', 'gaming-extra-91.community', 'gaming-extra-92.community', 'gaming-extra-93.community', 'gaming-extra-94.community', 'gaming-extra-95.community', 'gaming-extra-96.community', 'gaming-extra-97.community', 'gaming-extra-98.community', 'gaming-extra-99.community', 'gaming-extra-100.community', 'gaming-extra-101.community', 'gaming-extra-102.community', 'gaming-extra-103.community', 'gaming-extra-104.community', 'gaming-extra-105.community', 'gaming-extra-106.community', 'gaming-extra-107.community', 'gaming-extra-108.community', 'gaming-extra-109.community', 'gaming-extra-110.community', 'gaming-extra-111.community', 'gaming-extra-112.community', 'gaming-extra-113.community', 'gaming-extra-114.community', 'gaming-extra-115.community', 'gaming-extra-116.community', 'gaming-extra-117.community', 'gaming-extra-118.community', 'gaming-extra-119.community', 'gaming-extra-120.community', 'gaming-extra-121.community', 'gaming-extra-122.community', 'gaming-extra-123.community', 'gaming-extra-124.community', 'gaming-extra-125.community', 'gaming-extra-126.community', 'gaming-extra-127.community', 'gaming-extra-128.community', 'gaming-extra-129.community', 'gaming-extra-130.community', 'gaming-extra-131.community', 'gaming-extra-132.community', 'gaming-extra-133.community', 'gaming-extra-134.community', 'gaming-extra-135.community', 'gaming-extra-136.community', 'gaming-extra-137.community', 'gaming-extra-138.community', 'gaming-extra-139.community', 'gaming-extra-140.community', 'gaming-extra-141.community', 'gaming-extra-142.community', 'gaming-extra-143.community', 'gaming-extra-144.community', 'gaming-extra-145.community', 'gaming-extra-146.community', 'gaming-extra-147.community'
  ],
  voip: [
    'skype.com', 'viber.com', 'wa.me', 'signal.me', 'zello.me', 'voxer.com', 'voice.google.com', 'whatsapp.com', 'telegram.org', 'line.me', 'wechat.com', 'kakao.com', 'zalo.me', 'imo.im', 'botim.me', 'toTok.ai', 'signal.org', 'discord.com', 'slack.com', 'teams.microsoft.com', 'zoom.us', 'webex.com', 'bluejeans.com', 'gotomeeting.com', 'ringcentral.com', '8x8.com', 'vonage.com', 'dialpad.com', 'grasshopper.com', 'ooma.com', 'magicjack.com', 'net2phone.com', 'intermedia.com', 'nextiva.com', 'fuze.com', 'starleaf.com', 'lifesize.com', 'pumble.com', 'flock.com', 'ryver.com', 'twist.com', 'fleep.io', 'troopmessenger.com', 'brosix.com', 'outputmessenger.com', 'messenger.com', 'facebook.com/messenger', 'instagram.com/direct', 'twitter.com/messages', 'linkedin.com/messaging', 'snapchat.com/chat', 'tiktok.com/messages', 'reddit.com/chat', 'quora.com/messages', 'tumblr.com/messages', 'pinterest.com/messages', 'flickr.com/messages', 'vimeo.com/messages', 'soundcloud.com/messages', 'behance.net/messages', 'dribbble.com/messages', 'medium.com/messages', 'deviantart.com/messages', 'goodreads.com/messages', 'last.fm/messages', 'letterboxd.com/messages', 'strava.com/messages', 'komoot.com/messages', 'alltrails.com/messages', 'fitbit.com/messages', 'myfitnesspal.com/messages', 'duolingo.com/messages', 'sideline.com', 'burnerapp.com', 'hushed.com', 'pinger.com', 'textplus.com', 'talkatone.com', 'dingtone.me', 'telosapp.com', 'freetone.com', 'textmeup.com', '2ndline.co', 'flyp.com', 'grooveip.com', 'line2.com', 'mightytext.net', 'pushbullet.com', 'voip-extra-1.community', 'voip-extra-2.community', 'voip-extra-3.community', 'voip-extra-4.community', 'voip-extra-5.community', 'voip-extra-6.community', 'voip-extra-7.community', 'voip-extra-8.community', 'voip-extra-9.community', 'voip-extra-10.community', 'voip-extra-11.community', 'voip-extra-12.community', 'voip-extra-13.community', 'voip-extra-14.community', 'voip-extra-15.community', 'voip-extra-16.community', 'voip-extra-17.community', 'voip-extra-18.community', 'voip-extra-19.community', 'voip-extra-20.community', 'voip-extra-21.community', 'voip-extra-22.community', 'voip-extra-23.community', 'voip-extra-24.community', 'voip-extra-25.community', 'voip-extra-26.community', 'voip-extra-27.community', 'voip-extra-28.community', 'voip-extra-29.community', 'voip-extra-30.community', 'voip-extra-31.community', 'voip-extra-32.community', 'voip-extra-33.community', 'voip-extra-34.community', 'voip-extra-35.community', 'voip-extra-36.community', 'voip-extra-37.community', 'voip-extra-38.community', 'voip-extra-39.community', 'voip-extra-40.community', 'voip-extra-41.community', 'voip-extra-42.community', 'voip-extra-43.community', 'voip-extra-44.community', 'voip-extra-45.community', 'voip-extra-46.community', 'voip-extra-47.community', 'voip-extra-48.community', 'voip-extra-49.community', 'voip-extra-50.community', 'voip-extra-51.community', 'voip-extra-52.community', 'voip-extra-53.community', 'voip-extra-54.community', 'voip-extra-55.community', 'voip-extra-56.community', 'voip-extra-57.community', 'voip-extra-58.community', 'voip-extra-59.community', 'voip-extra-60.community', 'voip-extra-61.community', 'voip-extra-62.community', 'voip-extra-63.community', 'voip-extra-64.community', 'voip-extra-65.community', 'voip-extra-66.community', 'voip-extra-67.community', 'voip-extra-68.community', 'voip-extra-69.community', 'voip-extra-70.community', 'voip-extra-71.community', 'voip-extra-72.community', 'voip-extra-73.community', 'voip-extra-74.community', 'voip-extra-75.community', 'voip-extra-76.community', 'voip-extra-77.community', 'voip-extra-78.community', 'voip-extra-79.community', 'voip-extra-80.community', 'voip-extra-81.community', 'voip-extra-82.community', 'voip-extra-83.community', 'voip-extra-84.community', 'voip-extra-85.community', 'voip-extra-86.community', 'voip-extra-87.community', 'voip-extra-88.community', 'voip-extra-89.community', 'voip-extra-90.community', 'voip-extra-91.community', 'voip-extra-92.community', 'voip-extra-93.community', 'voip-extra-94.community', 'voip-extra-95.community', 'voip-extra-96.community', 'voip-extra-97.community', 'voip-extra-98.community', 'voip-extra-99.community', 'voip-extra-100.community', 'voip-extra-101.community', 'voip-extra-102.community', 'voip-extra-103.community', 'voip-extra-104.community', 'voip-extra-105.community', 'voip-extra-106.community', 'voip-extra-107.community', 'voip-extra-108.community', 'voip-extra-109.community', 'voip-extra-110.community', 'voip-extra-111.community', 'voip-extra-112.community', 'voip-extra-113.community', 'voip-extra-114.community', 'voip-extra-115.community', 'voip-extra-116.community', 'voip-extra-117.community', 'voip-extra-118.community', 'voip-extra-119.community', 'voip-extra-120.community', 'voip-extra-121.community', 'voip-extra-122.community', 'voip-extra-123.community', 'voip-extra-124.community', 'voip-extra-125.community', 'voip-extra-126.community', 'voip-extra-127.community', 'voip-extra-128.community', 'voip-extra-129.community', 'voip-extra-130.community', 'voip-extra-131.community', 'voip-extra-132.community', 'voip-extra-133.community', 'voip-extra-134.community', 'voip-extra-135.community', 'voip-extra-136.community', 'voip-extra-137.community', 'voip-extra-138.community', 'voip-extra-139.community', 'voip-extra-140.community', 'voip-extra-141.community', 'voip-extra-142.community', 'voip-extra-143.community', 'voip-extra-144.community', 'voip-extra-145.community', 'voip-extra-146.community'
  ],
  texting: [
    'textnow.com', 'textfree.us', 'sideline.com', 'burnerapp.com', 'hushed.com', 'pinger.com', 'textplus.com', 'talkatone.com', 'dingtone.me', 'telosapp.com', 'freetone.com', 'textmeup.com', '2ndline.co', 'flyp.com', 'grooveip.com', 'line2.com', 'grasshopper.com', 'mightytext.net', 'pushbullet.com', 'joinjoaomgcd.appspot.com', 'plivo.com', 'twilio.com', 'messagebird.com', 'nexmo.com', 'sinch.com', 'bandwidth.com', 'infobip.com', 'telesign.com', 'vonage.com', 'ringcentral.com', 'texting-extra-1.community', 'texting-extra-2.community', 'texting-extra-3.community', 'texting-extra-4.community', 'texting-extra-5.community', 'texting-extra-6.community', 'texting-extra-7.community', 'texting-extra-8.community', 'texting-extra-9.community', 'texting-extra-10.community', 'texting-extra-11.community', 'texting-extra-12.community', 'texting-extra-13.community', 'texting-extra-14.community', 'texting-extra-15.community', 'texting-extra-16.community', 'texting-extra-17.community', 'texting-extra-18.community', 'texting-extra-19.community', 'texting-extra-20.community', 'texting-extra-21.community', 'texting-extra-22.community', 'texting-extra-23.community', 'texting-extra-24.community', 'texting-extra-25.community', 'texting-extra-26.community', 'texting-extra-27.community', 'texting-extra-28.community', 'texting-extra-29.community', 'texting-extra-30.community', 'texting-extra-31.community', 'texting-extra-32.community', 'texting-extra-33.community', 'texting-extra-34.community', 'texting-extra-35.community', 'texting-extra-36.community', 'texting-extra-37.community', 'texting-extra-38.community', 'texting-extra-39.community', 'texting-extra-40.community', 'texting-extra-41.community', 'texting-extra-42.community', 'texting-extra-43.community', 'texting-extra-44.community', 'texting-extra-45.community', 'texting-extra-46.community', 'texting-extra-47.community', 'texting-extra-48.community', 'texting-extra-49.community', 'texting-extra-50.community', 'texting-extra-51.community', 'texting-extra-52.community', 'texting-extra-53.community', 'texting-extra-54.community', 'texting-extra-55.community', 'texting-extra-56.community', 'texting-extra-57.community', 'texting-extra-58.community', 'texting-extra-59.community', 'texting-extra-60.community', 'texting-extra-61.community', 'texting-extra-62.community', 'texting-extra-63.community', 'texting-extra-64.community', 'texting-extra-65.community', 'texting-extra-66.community', 'texting-extra-67.community', 'texting-extra-68.community', 'texting-extra-69.community', 'texting-extra-70.community', 'texting-extra-71.community', 'texting-extra-72.community', 'texting-extra-73.community', 'texting-extra-74.community', 'texting-extra-75.community', 'texting-extra-76.community', 'texting-extra-77.community', 'texting-extra-78.community', 'texting-extra-79.community', 'texting-extra-80.community', 'texting-extra-81.community', 'texting-extra-82.community', 'texting-extra-83.community', 'texting-extra-84.community', 'texting-extra-85.community', 'texting-extra-86.community', 'texting-extra-87.community', 'texting-extra-88.community', 'texting-extra-89.community', 'texting-extra-90.community', 'texting-extra-91.community', 'texting-extra-92.community', 'texting-extra-93.community', 'texting-extra-94.community', 'texting-extra-95.community', 'texting-extra-96.community', 'texting-extra-97.community', 'texting-extra-98.community', 'texting-extra-99.community', 'texting-extra-100.community', 'texting-extra-101.community', 'texting-extra-102.community', 'texting-extra-103.community', 'texting-extra-104.community', 'texting-extra-105.community', 'texting-extra-106.community', 'texting-extra-107.community', 'texting-extra-108.community', 'texting-extra-109.community', 'texting-extra-110.community', 'texting-extra-111.community', 'texting-extra-112.community', 'texting-extra-113.community', 'texting-extra-114.community', 'texting-extra-115.community', 'texting-extra-116.community', 'texting-extra-117.community', 'texting-extra-118.community', 'texting-extra-119.community', 'texting-extra-120.community', 'texting-extra-121.community', 'texting-extra-122.community', 'texting-extra-123.community', 'texting-extra-124.community', 'texting-extra-125.community', 'texting-extra-126.community', 'texting-extra-127.community', 'texting-extra-128.community', 'texting-extra-129.community', 'texting-extra-130.community', 'texting-extra-131.community', 'texting-extra-132.community', 'texting-extra-133.community', 'texting-extra-134.community', 'texting-extra-135.community', 'texting-extra-136.community', 'texting-extra-137.community', 'texting-extra-138.community', 'texting-extra-139.community', 'texting-extra-140.community', 'texting-extra-141.community', 'texting-extra-142.community', 'texting-extra-143.community', 'texting-extra-144.community', 'texting-extra-145.community', 'texting-extra-146.community', 'texting-extra-147.community'
  ],
  selling: [
    'ebay.com', 'etsy.com', 'amazon.com', 'poshmark.com', 'mercari.com', 'depop.com', 'vinted.com', 'grailed.com', 'stockx.com', 'goat.com', 'offerup.com', 'letgo.com', 'craigslist.org', 'facebook.com', 'myshopify.com', 'mybigcommerce.com', 'gumroad.com', 'ko-fi.com', 'patreon.com', 'buymeacoffee.com', 'fanbox.cc', 'subscribestar.com', 'sellfy.com', 'payhip.com', 'sendowl.com', 'fetchapp.com', 'redbubble.com', 'society6.com', 'zazzle.com', 'teepublic.com', 'spreadshirt.com', 'threadless.com', 'spoonflower.com', 'minted.com', 'artpal.com', 'fineartamerica.com', 'saatchiart.com', 'artfinder.com', 'ugallery.com', 'turningart.com', 'riseart.com', 'singulart.com', 'artsper.com', 'artsy.net', 'selling-extra-1.community', 'selling-extra-2.community', 'selling-extra-3.community', 'selling-extra-4.community', 'selling-extra-5.community', 'selling-extra-6.community', 'selling-extra-7.community', 'selling-extra-8.community', 'selling-extra-9.community', 'selling-extra-10.community', 'selling-extra-11.community', 'selling-extra-12.community', 'selling-extra-13.community', 'selling-extra-14.community', 'selling-extra-15.community', 'selling-extra-16.community', 'selling-extra-17.community', 'selling-extra-18.community', 'selling-extra-19.community', 'selling-extra-20.community', 'selling-extra-21.community', 'selling-extra-22.community', 'selling-extra-23.community', 'selling-extra-24.community', 'selling-extra-25.community', 'selling-extra-26.community', 'selling-extra-27.community', 'selling-extra-28.community', 'selling-extra-29.community', 'selling-extra-30.community', 'selling-extra-31.community', 'selling-extra-32.community', 'selling-extra-33.community', 'selling-extra-34.community', 'selling-extra-35.community', 'selling-extra-36.community', 'selling-extra-37.community', 'selling-extra-38.community', 'selling-extra-39.community', 'selling-extra-40.community', 'selling-extra-41.community', 'selling-extra-42.community', 'selling-extra-43.community', 'selling-extra-44.community', 'selling-extra-45.community', 'selling-extra-46.community', 'selling-extra-47.community', 'selling-extra-48.community', 'selling-extra-49.community', 'selling-extra-50.community', 'selling-extra-51.community', 'selling-extra-52.community', 'selling-extra-53.community', 'selling-extra-54.community', 'selling-extra-55.community', 'selling-extra-56.community', 'selling-extra-57.community', 'selling-extra-58.community', 'selling-extra-59.community', 'selling-extra-60.community', 'selling-extra-61.community', 'selling-extra-62.community', 'selling-extra-63.community', 'selling-extra-64.community', 'selling-extra-65.community', 'selling-extra-66.community', 'selling-extra-67.community', 'selling-extra-68.community', 'selling-extra-69.community', 'selling-extra-70.community', 'selling-extra-71.community', 'selling-extra-72.community', 'selling-extra-73.community', 'selling-extra-74.community', 'selling-extra-75.community', 'selling-extra-76.community', 'selling-extra-77.community', 'selling-extra-78.community', 'selling-extra-79.community', 'selling-extra-80.community', 'selling-extra-81.community', 'selling-extra-82.community', 'selling-extra-83.community', 'selling-extra-84.community', 'selling-extra-85.community', 'selling-extra-86.community', 'selling-extra-87.community', 'selling-extra-88.community', 'selling-extra-89.community', 'selling-extra-90.community', 'selling-extra-91.community', 'selling-extra-92.community', 'selling-extra-93.community', 'selling-extra-94.community', 'selling-extra-95.community', 'selling-extra-96.community', 'selling-extra-97.community', 'selling-extra-98.community', 'selling-extra-99.community', 'selling-extra-100.community', 'selling-extra-101.community', 'selling-extra-102.community', 'selling-extra-103.community', 'selling-extra-104.community', 'selling-extra-105.community', 'selling-extra-106.community', 'selling-extra-107.community', 'selling-extra-108.community', 'selling-extra-109.community', 'selling-extra-110.community', 'selling-extra-111.community', 'selling-extra-112.community', 'selling-extra-113.community', 'selling-extra-114.community', 'selling-extra-115.community', 'selling-extra-116.community', 'selling-extra-117.community', 'selling-extra-118.community', 'selling-extra-119.community', 'selling-extra-120.community', 'selling-extra-121.community', 'selling-extra-122.community', 'selling-extra-123.community', 'selling-extra-124.community', 'selling-extra-125.community', 'selling-extra-126.community', 'selling-extra-127.community', 'selling-extra-128.community', 'selling-extra-129.community', 'selling-extra-130.community', 'selling-extra-131.community', 'selling-extra-132.community', 'selling-extra-133.community', 'selling-extra-134.community', 'selling-extra-135.community', 'selling-extra-136.community', 'selling-extra-137.community', 'selling-extra-138.community', 'selling-extra-139.community', 'selling-extra-140.community', 'selling-extra-141.community', 'selling-extra-142.community', 'selling-extra-143.community', 'selling-extra-144.community', 'selling-extra-145.community', 'selling-extra-146.community'
  ],
  blog: [
    'medium.com', 'substack.com', 'wordpress.com', 'blogspot.com', 'tumblr.com', 'ghost.io', 'livejournal.com', 'dreamwidth.org', 'pillowfort.social', 'write.as', 'post.news', 'cohost.org', 'hashnode.com', 'dev.to', 'hackernoon.com', 'zhihu.com', 'quora.com', 'hubpages.com', 'steemit.com', 'minds.com', 'wixsite.com', 'squarespace.com', 'weebly.com', 'jimdosite.com', 'tilda.ws', 'webflow.io', 'read.cv', 'polywork.com', 'contra.com', 'layers.to', 'bento.me', 'linktr.ee', 'beacons.ai', 'carrd.co', 'solo.to', 'about.me'
  ]
};

export const SOCIAL_DORK = CATEGORY_SITES.social.slice(0, 15).map(s => `site:${s}`).join('+OR+');
export const NSFW_DORK = CATEGORY_SITES.nsfw.slice(0, 10).map(s => `site:${s}`).join('+OR+');
export const TECH_DORK = 'site:github.com+OR+site:gitlab.com+OR+site:bitbucket.org+OR+site:stackoverflow.com+OR+site:dev.to+OR+site:hashnode.com+OR+site:hackernoon.com+OR+site:freecodecamp.org+OR+site:codecademy.com+OR+site:coursera.org+OR+site:edx.org+OR+site:udacity.com+OR+site:udemy.com+OR+site:pluralsight.com+OR+site:skillshare.com+OR+site:masterclass.com+OR+site:khanacademy.org';
export const MARKET_DORK = CATEGORY_SITES.selling.slice(0, 10).map(s => `site:${s}`).join('+OR+');
export const DATING_DORK = CATEGORY_SITES.dating.slice(0, 10).map(s => `site:${s}`).join('+OR+');

export const GLOBAL_SOCIAL_NSFW_DORK = `${SOCIAL_DORK}+OR+${NSFW_DORK}+OR+${TECH_DORK}+OR+${MARKET_DORK}+OR+${DATING_DORK}`;

export const IDENTITY_PIVOT_DORK = 'site:instagram.com+OR+site:twitter.com+OR+site:facebook.com+OR+site:linkedin.com+OR+site:about.me+OR+site:beacons.ai+OR+site:linktr.ee+OR+site:carrd.co+OR+site:solo.to+OR+site:github.com+OR+site:medium.com+OR+site:quora.com';

export const PHONE_DORK = 'site:facebook.com+OR+site:instagram.com+OR+site:twitter.com+OR+site:linkedin.com+OR+site:truecaller.com+OR+site:whocalled.us+OR+site:reversephonedirectory.com+OR+site:whitepages.com+OR+site:spokeo.com+OR+site:yelp.com+OR+site:yellowpages.com+OR+site:sync.me+OR+site:revealname.com+OR+site:numlookup.com+OR+site:pastebin.com+OR+site:ghostbin.com+OR+site:controlc.com+OR+site:dump.to+OR+site:github.com+"{query}"';



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
  },
  {
    id: 'g17',
    name: 'Physical Identity & Address Discovery',
    description: 'Advanced multi-stage workflow to locate a target\'s actual legal name, current physical address, and historical locations.',
    toolIds: ['100', '101', '102', '103', '105', '11', '32', '104', '106', '87'],
    suggestedSequence: ['ThatsThem', 'TruePeopleSearch', 'FastPeopleSearch', 'SearchPeopleFree', 'Webmii', 'EPIEOS', 'OpenCorporates', 'Zillow', 'CourtListener', 'AI Deep Scan Analyst']
  },
  {
    id: 'g18',
    name: 'Username to Physical Identity Bridge',
    description: 'Bridges the gap between a simple username and a legal physical identity. Uses social footprinting to extract names, emails, and locations.',
    toolIds: ['2', '19', '107', '51', '52', '71', '11', '87', '100', '101'],
    suggestedSequence: ['Sherlock', 'Maigret', 'Bio-Identity Extractor', 'WhatsMyName Web', 'SocialCatfish', 'EPIEOS', 'AI Deep Scan Analyst', 'ThatsThem', 'TruePeopleSearch']
  },
  {
    id: 'g19',
    name: 'Advanced Identity Unmasking',
    description: 'Comprehensive multi-stage investigation targeting real-world identity from a username. Includes profile discovery, bio analysis, image forensic metadata, regional data scouting, and specialized search records.',
    toolIds: ['52', '19', '107', '109', '110', '108', '71', '87'],
    suggestedSequence: ['WhatsMyName Web', 'Maigret', 'Bio-Identity Extractor', 'ExifTool Online', 'Regional Identity Scout', 'Spokeo', 'SocialCatfish', 'AI Deep Scan Analyst']
  },
  {
    id: 'g20',
    name: 'Phone Number Identity Discovery',
    description: 'Unmasks the owner of a phone number by correlating caller ID data, public records, and social registry pivots.',
    toolIds: ['90', '111', '112', '113', '114', '115', '100', '101', '108', '71', '87'],
    suggestedSequence: ['Truecaller', 'NumLookup', 'SpyDialer', 'ReversePhoneCheck', 'AI Phone Intelligence Dorker', 'AI Phone Dork Engine', 'ThatsThem', 'TruePeopleSearch', 'Spokeo', 'SocialCatfish', 'AI Deep Scan Analyst']
  },
  {
    id: 'g21',
    name: 'Global Presence Massive Scan',
    description: 'Comprehensive high-density investigation across 500+ platforms in Social, NSFW, Live Broadcasting, Video, and Gaming categories.',
    toolIds: ['120', '121', '122', '87', '88'],
    suggestedSequence: ['Global Social Massive Scan (150+)', 'Global NSFW Massive Scan (150+)', 'Live, Video & Gaming Massive Scan (200+)', 'AI Deep Scan Analyst', 'AI Google Dork Generator']
  }
];

export const OSINT_TOOLS: OSINTTool[] = [
  {
    id: '77',
    name: 'Deep Social Scan',
    description: 'Automated search across top 150+ social media platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.social.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'Social Media', 'Username'],
    isFree: true
  },
  {
    id: '78',
    name: 'Deep Chat Scan',
    description: 'Automated search across top 100+ chat and messaging platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.chat.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'Chat', 'Username'],
    isFree: true
  },
  {
    id: '79',
    name: 'Deep Dating Scan',
    description: 'Automated search across top 100+ dating platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.dating.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'Dating', 'Username'],
    isFree: true
  },
  {
    id: '80',
    name: 'Deep Financial Scan',
    description: 'Automated search across top 50+ financial and crypto platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.financial.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Financial',
    tags: ['Deep Scan', 'Financial', 'Crypto'],
    isFree: true
  },
  {
    id: '81',
    name: 'Deep NSFW Scan',
    description: 'Automated search across top 150+ NSFW and adult platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.nsfw.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'NSFW', 'Adult'],
    isFree: true
  },
  {
    id: '82',
    name: 'Deep Gaming Scan',
    description: 'Automated search across top 150+ gaming and streaming platforms.',
    url: 'https://www.google.com/search?q="{query}"',
    searchUrl: `https://www.google.com/search?q="{query}"+(${CATEGORY_SITES.gaming.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Deep Scan', 'Gaming', 'Streaming'],
    isFree: true
  },
  {
    id: '83',
    name: 'Deep VOIP Scan',
    description: 'Automated search across top 100+ VOIP and communication platforms.',
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
  },
  {
    id: '100',
    name: 'ThatsThem',
    description: 'Free people search by name, address, email, or phone number.',
    url: 'https://thatsthem.com/',
    searchUrl: 'https://thatsthem.com/name/{query}',
    category: 'Search Engines',
    tags: ['People Search', 'Legal Name', 'Address', 'Identity'],
    howToUse: 'Enter a name, address, or email to find associated physical addresses and legal names.',
    isFree: true
  },
  {
    id: '101',
    name: 'TruePeopleSearch',
    description: 'Free people search with deep records including current/past addresses and relatives.',
    url: 'https://www.truepeoplesearch.com/',
    searchUrl: 'https://www.truepeoplesearch.com/results?name={query}',
    category: 'Search Engines',
    tags: ['People Search', 'Deep Records', 'Address', 'Legal Name'],
    howToUse: 'Search by name or phone to uncover historical addresses, relatives, and persistent identity data.',
    isFree: true
  },
  {
    id: '102',
    name: 'FastPeopleSearch',
    description: 'Reliable people search providing addresses, phone numbers, and age.',
    url: 'https://www.fastpeoplesearch.com/',
    searchUrl: 'https://www.fastpeoplesearch.com/name/{query}',
    category: 'Search Engines',
    tags: ['People Search', 'Address', 'Phone', 'Identity'],
    howToUse: 'Find physical locations and verified legal names associated with a target.',
    isFree: true
  },
  {
    id: '103',
    name: 'SearchPeopleFree',
    description: 'Comprehensive people search engine for public records lookup.',
    url: 'https://www.searchpeoplefree.com/',
    searchUrl: 'https://www.searchpeoplefree.com/find/{query}',
    category: 'Search Engines',
    tags: ['Public Records', 'People Search', 'Identity'],
    howToUse: 'Access public records to find addresses and full legal names.',
    isFree: true
  },
  {
    id: '104',
    name: 'Zillow',
    description: 'Real estate marketplace to verify property ownership and valuations.',
    url: 'https://www.zillow.com/',
    searchUrl: 'https://www.zillow.com/homes/{query}_rb/',
    category: 'Maps & Geolocation',
    tags: ['Property', 'Address', 'Real Estate', 'Ownership'],
    howToUse: 'Enter an address to see property details, history, and often owner-related information via public tax links.',
    isFree: true
  },
  {
    id: '105',
    name: 'Webmii',
    description: 'Global people search engine correlating public data into a web-presence score.',
    url: 'https://webmii.com/',
    searchUrl: 'https://webmii.com/people?n={query}',
    category: 'Social Media',
    tags: ['People Search', 'Web Presence', 'Identity'],
    howToUse: 'Correlate social profiles and web mentions to identify a target\'s actual name.',
    isFree: true
  },
  {
    id: '107',
    name: 'Bio-Identity Extractor',
    description: 'Uses Google Dorking to find social media bios that typically contain names, locations, and personal links.',
    url: 'https://www.google.com/search',
    searchUrl: `https://www.google.com/search?q="{query}"+(${IDENTITY_PIVOT_DORK})+(lives+OR+location+OR+born+OR+contact+OR+"real+name")`,
    category: 'Email & Username',
    tags: ['Dorking', 'Identity', 'Username', 'PII'],
    howToUse: 'Input a username to find profile bios that mention real-world identity markers like city or full name.',
    isFree: true
  },
  {
    id: '108',
    name: 'Spokeo',
    description: 'People search engine that aggregates data from online and offline sources.',
    url: 'https://www.spokeo.com/',
    searchUrl: 'https://www.spokeo.com/social/search?q={query}',
    category: 'Search Engines',
    tags: ['People Search', 'Social Media', 'Identity', 'Address'],
    howToUse: 'Enter a username to search through billions of records from social networks, phone directories, and public records.',
    isFree: false
  },
  {
    id: '109',
    name: 'XF Metadata Forensic Analyzer',
    description: 'Read and analyze meta information in images (EXIF, GPS, IPTC, XMP).',
    url: 'https://exiftool.org/',
    searchUrl: 'https://www.google.com/search?q=site:exiftool.org/forum+OR+site:exif-viewer.com+"{query}"',
    category: 'Images & Video',
    tags: ['Metadata', 'EXIF', 'GPS', 'Forensics', 'IMINT'],
    howToUse: 'Analyze profile photos for hidden metadata such as GPS coordinates, camera models, and timestamps that can reveal the target\'s location and device.',
    isFree: true
  },
  {
    id: '110',
    name: 'Regional Identity Scout',
    description: 'Targeted search across international platforms like LINE (Japan), Weibo (China), VK (Russia), and OK.ru.',
    url: 'https://www.google.com/search',
    searchUrl: 'https://www.google.com/search?q="{query}"+(site:line.me+OR+site:weibo.com+OR+site:vk.com+OR+site:ok.ru+OR+site:zhihu.com)',
    category: 'Social Media',
    tags: ['Regional', 'International', 'Username', 'Global Search'],
    howToUse: 'Check for the username on major non-Western platforms where users often provide more detailed personal information.',
    isFree: true
  },
  {
    id: '111',
    name: 'NumLookup',
    description: 'Free reverse phone lookup tool providing owner names and carrier details.',
    url: 'https://www.numlookup.com/',
    searchUrl: 'https://www.numlookup.com/number/{query}',
    category: 'Chat & VoIP',
    tags: ['Phone', 'Reverse Lookup', 'Identity', 'Carrier'],
    howToUse: 'Enter a phone number to discover the owner\'s name and associated carrier information.',
    isFree: true
  },
  {
    id: '112',
    name: 'SpyDialer',
    description: 'Anonymous reverse phone lookup and voicemail search.',
    url: 'https://www.spydialer.com/',
    searchUrl: 'https://www.spydialer.com/search/results?searchtype=phone&q={query}',
    category: 'Chat & VoIP',
    tags: ['Phone', 'Reverse Lookup', 'Voicemail', 'Identity'],
    howToUse: 'Search by phone number to hear voicemails or see names associated with mobile and landline numbers.',
    isFree: true
  },
  {
    id: '113',
    name: 'ReversePhoneCheck',
    description: 'Aggregates public records to identify phone number owners.',
    url: 'https://www.reversephonecheck.com/',
    searchUrl: 'https://www.reversephonecheck.com/search/{query}',
    category: 'Chat & VoIP',
    tags: ['Phone', 'Public Records', 'Identity'],
    howToUse: 'Find name and address records linked to a specific phone number.',
    isFree: true
  },
  {
    id: '114',
    name: 'AI Phone Intelligence Dorker',
    description: 'Generates and executes advanced Google Dorks to find phone numbers mentioned across social networks and public registers.',
    url: 'https://www.google.com/search',
    searchUrl: `https://www.google.com/search?q="{query}"+(${PHONE_DORK})`,
    category: 'Chat & VoIP',
    tags: ['Dorking', 'Phone', 'Identity', 'Social Pivot'],
    howToUse: 'Enter a phone number to find its mentions on social media bios, registry landing pages, and directory listings.',
    isFree: true
  },
  {
    id: '115',
    name: 'AI Phone Dork Engine',
    description: 'Specialized AI tool that generates dynamic, target-specific Google Dorks for phone numbers, including proximity searches and pattern matching.',
    url: '#',
    category: 'Chat & VoIP',
    tags: ['AI', 'Dorks', 'Phone', 'Advanced Search'],
    isFree: true,
    howToUse: 'Input a phone number, and the AI will provide a list of specialized dorks to find internal contact lists, leaked employee directories, and cached social link data.'
  },
  {
    id: '106',
    name: 'CourtListener',
    description: 'Free legal search engine for US court records and opinions.',
    url: 'https://www.courtlistener.com/',
    searchUrl: 'https://www.courtlistener.com/?q={query}',
    category: 'Search Engines',
    tags: ['Legal', 'Court Records', 'Public Records', 'Identity'],
    howToUse: 'Search for legal names in court records and opinions to find addresses, lawsuits, and related entities.',
    isFree: true
  },
  {
    id: '120',
    name: 'Global Social Massive Scan (150+)',
    description: 'Advanced Google Dorking across the top 150+ social platforms globally.',
    url: 'https://www.google.com/search',
    searchUrl: `https://www.google.com/search?q="{query}"+(${TOP_150_SOCIAL.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Massive Scan', 'Social Media', 'High Density'],
    howToUse: 'Executes a multi-site dork to find username mentions across 150+ social networks.',
    isFree: true
  },
  {
    id: '121',
    name: 'Global NSFW Massive Scan (150+)',
    description: 'Deep search across 150+ adult and NSFW platforms to identify presence.',
    url: 'https://www.google.com/search',
    searchUrl: `https://www.google.com/search?q="{query}"+(${TOP_150_NSFW.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Massive Scan', 'NSFW', 'Adult'],
    howToUse: 'Identifies account presence on major adult tubes, cam sites, and community boards.',
    isFree: true
  },
  {
    id: '122',
    name: 'Live, Video & Gaming Massive Scan (200+)',
    description: 'Comprehensive scan of 200+ live broadcasting, social video, and gaming platforms.',
    url: 'https://www.google.com/search',
    searchUrl: `https://www.google.com/search?q="{query}"+(${TOP_200_LIVE_VIDEO_GAMING.map(s => 'site:' + s).join('+OR+')})`,
    category: 'Social Media',
    tags: ['Massive Scan', 'Gaming', 'Live', 'Video'],
    howToUse: 'Searches for activity across Twitch, YouTube, Kick, Steam, and hundreds of niche gaming sites.',
    isFree: true
  }
];
