const axios = require('axios');

async function testRegister() {
  try {
    const res = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/register', {
      name: 'Dheeraj Batman',
      email: 'batmandheeraj2@gmail.com',
      password: 'Saibindu@1507'
    });
    console.log('Registration successful! Token:', res.data.token.substring(0, 10) + '...');
  } catch (err) {
    console.error('Registration failed:', err.response?.status);
    console.error(err.response?.data);
  }
}

testRegister();
