const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testResume() {
  try {
    const loginRes = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/auth/login', {
      email: 'batmandheeraj2@gmail.com',
      password: 'Saibindu@1507'
    });
    const token = loginRes.data.token;
    
    // Create a dummy text file to act as resume
    const dummyPath = path.join(__dirname, 'dummy_resume.txt');
    fs.writeFileSync(dummyPath, 'This is a test resume for Sai Dheeraj. Software Engineer with 5 years experience in React and Node.js.');

    const formData = new FormData();
    // Use buffer instead of stream
    formData.append('resume', fs.readFileSync(dummyPath), {
      filename: 'dummy_resume.txt',
      contentType: 'text/plain'
    });

    console.log(`Submitting resume buffer...`);
    const start = Date.now();
    const res = await axios.post('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/resume/analyze', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders()
      },
      timeout: 150000
    });
    
    console.log('Success! Took', Date.now() - start, 'ms');
    console.log(res.data);
    fs.unlinkSync(dummyPath);
  } catch (err) {
    console.error('Failed!');
    if (err.response) {
       console.error('Status:', err.response.status);
       console.error('Data:', err.response.data);
    } else {
       console.error('Error:', err.message);
    }
  }
}

testResume();
