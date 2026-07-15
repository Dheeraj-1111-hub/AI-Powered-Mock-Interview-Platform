const axios = require('axios');

const API = 'https://ai-powered-mock-interview-platform-ha0o.onrender.com/api';
// const API = 'http://localhost:4000/api';

async function QA() {
  let token = '';
  try {
    console.log('--- SYSTEM QA SUITE ---');
    console.log('1. Authentication');
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'batmandheeraj2@gmail.com',
      password: 'Saibindu@1507'
    });
    token = loginRes.data.token;
    console.log('✅ Login Successful');
    
    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n2. User Profile (/me)');
    const meRes = await axios.get(`${API}/auth/me`, { headers });
    console.log('✅ /me returned:', meRes.data.email);

    console.log('\n3. Dashboard Summary');
    const dashRes = await axios.get(`${API}/dashboard/summary`, { headers });
    console.log('✅ Dashboard Data:', Object.keys(dashRes.data));

    console.log('\n4. Career Intelligence (/career/intelligence)');
    const careerRes = await axios.get(`${API}/career/intelligence`, { headers });
    console.log('✅ Career Intelligence Data keys:', Object.keys(careerRes.data));

    console.log('\n5. Coding Problems');
    const codeRes = await axios.get(`${API}/codes/problems`, { headers });
    console.log(`✅ Loaded ${codeRes.data.length} Coding Problems`);

    console.log('\n6. Coding Submissions');
    const subRes = await axios.get(`${API}/codes/submissions`, { headers });
    console.log(`✅ Loaded ${subRes.data.length} Submissions`);

    console.log('\n7. AI Interview History');
    const intRes = await axios.get(`${API}/interviews/history`, { headers });
    console.log(`✅ Loaded ${intRes.data.length} Interviews`);

    console.log('\n8. Resume Analysis History');
    const resumeRes = await axios.get(`${API}/resume/history`, { headers });
    console.log(`✅ Loaded ${resumeRes.data.length} Resume Reviews`);

    console.log('\n🎉 ALL CORE READ ENDPOINTS HEALTHY 🎉');
  } catch (err) {
    console.error('\n❌ QA FAILED!');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

QA();
