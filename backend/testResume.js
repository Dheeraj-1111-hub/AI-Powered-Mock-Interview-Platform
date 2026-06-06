const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function test() {
  const form = new FormData();
  fs.writeFileSync('dummy.txt', 'This is a test resume for a software engineer');
  form.append('resume', fs.createReadStream('dummy.txt'));
  
  try {
    const res = await axios.post('https://ai-powered-mock-interview-platform-avpg.onrender.com/api/resume', form, {
      headers: form.getHeaders()
    });
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (e) {
    console.log('Status:', e.response?.status);
    console.log('Data:', e.response?.data || e.message);
  }
}
test();
