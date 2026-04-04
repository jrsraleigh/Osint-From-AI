import whois from 'whois-json';

async function testWhois() {
  try {
    const results = await whois('google.com');
    console.log('whois keys:', Object.keys(results));
    if (Object.keys(results).length > 0) {
      console.log('Domain Name:', results.domainName);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testWhois();
