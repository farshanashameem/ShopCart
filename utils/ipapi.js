const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Map country ISO code to phone code
const countryPhoneCodes = {
  IN: '+91',
  US: '+1',
  UK: '+44',
 
};

async function getCountryCodeFromIP(ip) {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    const country = data.country; // e.g., 'IN', 'US'
    return countryPhoneCodes[country] || '+91'; // default +91
  } catch (err) {
    console.log('Error fetching country code:', err);
    return '+91'; // fallback
  }
}

module.exports = { getCountryCodeFromIP };
