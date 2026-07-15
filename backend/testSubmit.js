const axios = require('axios');

async function testSubmit() {
  try {
    const loginRes = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/login', {
      email: 'batmandheeraj2@gmail.com',
      password: 'Saibindu@1507'
    });
    const token = loginRes.data.token;
    
    // Get a problem ID
    const probRes = await axios.get('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/codes/problems', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const problemId = probRes.data[0]._id;

    console.log(`Submitting code for problem ${problemId}...`);
    const submitRes = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/codes/submit', {
      problemId,
      code: 'int main() { return 0; }',
      language: 'cpp',
      telemetry: {}
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Submit Success!', submitRes.data);
  } catch (err) {
    console.error('Submit Failed!');
    console.error('Status:', err.response?.status);
    console.error('Data:', err.response?.data || err.message);
  }
}

testSubmit();
