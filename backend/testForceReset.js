const axios = require('axios');

async function forceReset() {
  try {
    const res = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/force-reset', {
      email: 'batmandheeraj2@gmail.com',
      newPassword: 'Saibindu@1507'
    });
    console.log('Force reset successful!', res.data);
  } catch (err) {
    console.error('Force reset failed:', err.response?.status);
    console.error(err.response?.data || err.message);
  }
}

forceReset();
