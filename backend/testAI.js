const axios = require('axios');

async function testAI() {
  try {
    const loginRes = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/login', {
      email: 'batmandheeraj2@gmail.com',
      password: 'Saibindu@1507'
    });
    const token = loginRes.data.token;
    
    console.log('Testing AI generation (requires backend -> ai-service communication)...');
    const aiRes = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/ai/review', {
      code: 'function test() { return 1; }',
      language: 'javascript',
      problemId: 'dummy'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('AI Response Success!', aiRes.data);
  } catch (err) {
    console.error('AI Test Failed!');
    console.error('Status:', err.response?.status);
    console.error('Data:', err.response?.data || err.message);
  }
}

testAI();
