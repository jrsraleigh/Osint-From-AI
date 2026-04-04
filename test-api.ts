import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/osint/search', {
      q: 'test site:instagram.com OR site:facebook.com OR site:twitter.com OR site:linkedin.com OR site:pinterest.com OR site:reddit.com OR site:github.com OR site:flickr.com OR site:vimeo.com OR site:soundcloud.com OR site:behance.net OR site:dribbble.com OR site:medium.com OR site:quora.com OR site:tumblr.com OR site:snapchat.com OR site:tiktok.com OR site:twitch.tv OR site:discord.com OR site:mastodon.social OR site:threads.net OR site:bluesky.social OR site:cohost.org OR site:post.news OR site:t2.social OR site:hive.social OR site:counter.social OR site:gab.com OR site:truthsocial.com OR site:parler.com OR site:gettr.com OR site:rumble.com OR site:odysee.com OR site:bitchute.com OR site:dailymotion.com'
    });
    console.log('Status:', res.status);
    console.log('Results:', res.data.length);
  } catch (e: any) {
    console.error('Error:', e.response?.status, e.response?.data || e.message);
  }
}

test();
