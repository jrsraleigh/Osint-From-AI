import axios from 'axios';

async function testWhois() {
  try {
    const target = "google.com";
    console.log('Testing WHOIS for:', target);
    const response = await axios.get(`http://localhost:3000/api/osint/whois?target=${target}`);
    console.log('Status:', response.status);
    console.log('Data keys:', Object.keys(response.data));
    if (response.data.entities) {
      console.log('RDAP data found (entities present)');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testWhois();
