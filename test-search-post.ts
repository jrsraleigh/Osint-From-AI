import axios from 'axios';

async function testSearch() {
  try {
    const q = "test site:github.com OR site:twitter.com OR site:instagram.com OR site:reddit.com OR site:tiktok.com OR site:twitch.com OR site:steamcommunity.com OR site:youtube.com OR site:facebook.com OR site:linkedin.com OR site:pinterest.com OR site:tumblr.com OR site:flickr.com OR site:vimeo.com OR site:soundcloud.com OR site:medium.com OR site:behance.net OR site:dribbble.com OR site:deviantart.com OR site:quora.com OR site:stackauthor.com OR site:github.io OR site:gitlab.com OR site:bitbucket.org OR site:codepen.io OR site:replit.com OR site:glitch.me OR site:vercel.app OR site:netlify.app OR site:heroku.com OR site:github.com OR site:twitter.com OR site:instagram.com OR site:reddit.com OR site:tiktok.com OR site:twitch.com OR site:steamcommunity.com OR site:youtube.com OR site:facebook.com OR site:linkedin.com OR site:pinterest.com OR site:tumblr.com OR site:flickr.com OR site:vimeo.com OR site:soundcloud.com OR site:medium.com OR site:behance.net OR site:dribbble.com OR site:deviantart.com OR site:quora.com OR site:stackauthor.com OR site:github.io OR site:gitlab.com OR site:bitbucket.org OR site:codepen.io OR site:replit.com OR site:glitch.me OR site:vercel.app OR site:netlify.app OR site:heroku.com OR site:github.com OR site:twitter.com OR site:instagram.com OR site:reddit.com OR site:tiktok.com OR site:twitch.com OR site:steamcommunity.com OR site:youtube.com OR site:facebook.com OR site:linkedin.com OR site:pinterest.com OR site:tumblr.com OR site:flickr.com OR site:vimeo.com OR site:soundcloud.com OR site:medium.com OR site:behance.net OR site:dribbble.com OR site:deviantart.com OR site:quora.com OR site:stackauthor.com OR site:github.io OR site:gitlab.com OR site:bitbucket.org OR site:codepen.io OR site:replit.com OR site:glitch.me OR site:vercel.app OR site:netlify.app OR site:heroku.com";
    console.log('Testing search with query length:', q.length);
    const response = await axios.post('http://localhost:3000/api/osint/search', { q });
    console.log('Status:', response.status);
    console.log('Results count:', response.data.length);
    if (response.data.length > 0) {
      console.log('First result:', response.data[0].title);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSearch();
