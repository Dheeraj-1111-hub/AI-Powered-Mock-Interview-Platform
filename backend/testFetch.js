const axios = require('axios');

async function check() {
  try {
    let token = '';
    try {
      const regRes = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/register', {
        name: 'Test', email: 'test_12345@test.com', password: 'password123'
      });
      token = regRes.data.token;
    } catch (e) {
      const loginRes = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/login', {
        email: 'test_12345@test.com', password: 'password123'
      });
      token = loginRes.data.token;
    }
    
    console.log('Got token:', token.substring(0, 10));

    const probsRes = await axios.get('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/codes/problems', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Production problems count:', probsRes.data.length);
  } catch(e) {
    console.log('ERROR:', e.message);
    if (e.response) console.log(e.response.data);
  }
}

check();
