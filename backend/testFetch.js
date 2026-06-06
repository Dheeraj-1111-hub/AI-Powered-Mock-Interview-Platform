const axios = require('axios');

async function check() {
  try {
    const email = `test_${Date.now()}@test.com`;
    let token = '';
    
    console.log('Registering...');
    await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/register', {
      name: 'Test', email, password: 'password123'
    });
    
    console.log('Logging in...');
    const loginRes = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/login', {
      email, password: 'password123'
    });
    console.log('Login success');
    token = loginRes.data.token;
    
    console.log('Got token:', token.substring(0, 10));

    console.log('Fetching submissions...');
    const probsRes = await axios.get('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/codes/submissions', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Production submissions count:', probsRes.data.length);
  } catch(e) {
    console.log('ERROR:', e.message);
    if (e.response) console.log(e.response.status, e.response.data);
  }
}

check();
