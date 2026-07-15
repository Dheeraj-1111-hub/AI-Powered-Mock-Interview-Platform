const axios = require('axios');

const PRODUCTION_URL = 'https://ai-powered-mock-interview-platform-ha0o.onrender.com';

async function seed() {
  try {
    const email = `admin_${Date.now()}@admin.com`;
    console.log(`Registering admin ${email}...`);
    await axios.post(`${PRODUCTION_URL}/api/auth/register`, {
      name: 'Admin Seeder', email, password: 'password123'
    });

    console.log('Logging in...');
    const loginRes = await axios.post(`${PRODUCTION_URL}/api/auth/login`, {
      email, password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('Got token.');

    const headers = { Authorization: `Bearer ${token}` };

    let enriched = 0;
    while (enriched < 45) {
      console.log(`Enriching next batch... (Total enriched so far: ${enriched})`);
      const enrichRes = await axios.post(`${PRODUCTION_URL}/api/codes/enrich-raw?batchSize=5`, {}, { headers });
      console.log('Enrich result:', enrichRes.data);
      enriched += enrichRes.data.enriched;
      
      // If nothing was enriched, maybe we hit the limit or everything is done
      if (enrichRes.data.enriched === 0) {
        console.log('No more problems to enrich.');
        break;
      }
    }

    console.log('Seeding complete! Verifying count...');
    const verifyRes = await axios.get(`${PRODUCTION_URL}/api/codes/problems`, { headers });
    console.log(`Verification: Production has ${verifyRes.data.length} problems!`);
    
  } catch (err) {
    console.error('Seeding failed:', err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}

seed();
