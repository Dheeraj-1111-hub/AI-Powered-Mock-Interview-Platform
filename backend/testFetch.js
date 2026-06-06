const axios = require('axios');

async function check() {
  try {
    const email = 'test_fetch_latest@test.com';
    let token = '';
    try {
      console.log('Registering...');
      const regRes = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/register', {
        name: 'Test', email, password: 'password123'
      });
      console.log('Register success');
    } catch (e) {
      console.log('Register error:', e.response?.status);
    }
    
    console.log('Logging in...');
    const loginRes = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/login', {
      email, password: 'password123'
    });
    console.log('Login success');
    token = loginRes.data.token;
    
    console.log('Got token:', token.substring(0, 10));

    console.log('Fetching problems...');
    const probsRes = await axios.get('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/codes/problems', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Production problems count:', probsRes.data.length);
  } catch(e) {
    console.log('ERROR:', e.message);
    if (e.response) console.log(e.response.status, e.response.data);
  }
}

check();
