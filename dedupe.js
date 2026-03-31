
const fs = require('fs');
const content = fs.readFileSync('/src/constants.ts', 'utf8');
const match = content.match(/export const GLOBAL_SOCIAL_NSFW_DORK = '(.*?)';/);
if (match) {
  const dork = match[1];
  const sites = dork.split('+OR+');
  const uniqueSites = [...new Set(sites)];
  const newDork = uniqueSites.join('+OR+');
  const newContent = content.replace(match[0], `export const GLOBAL_SOCIAL_NSFW_DORK = '${newDork}';`);
  fs.writeFileSync('/src/constants.ts', newContent);
  console.log(`Deduplicated: ${sites.length} -> ${uniqueSites.length}`);
} else {
  console.log('Not found');
}
