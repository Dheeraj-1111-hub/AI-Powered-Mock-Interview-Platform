const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/login', {
      email: 'batmandheeraj2@gmail.com',
      password: 'Saibindu@1507'
    });
    console.log('Login successful! Token:', res.data.token.substring(0, 10) + '...');
  } catch (err) {
    console.error('Login failed:', err.response?.status);
    console.error(err.response?.data);
  }
}

testLogin();
