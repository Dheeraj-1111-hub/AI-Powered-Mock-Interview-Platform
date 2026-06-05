import axios from 'axios';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:4000/api';
let token = '';

async function runTests() {
  const email = `tester_${Date.now()}@hireiq.test`;
  await axios.post(`${BASE_URL}/auth/register`, { name: 'E2E Tester', email, password: 'password123' });
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email, password: 'password123' });
  token = loginRes.data.token;

  const fd = new FormData();
  const realResume = `
  Sai Dheeraj
  4th Year CSE Student
  Skills: React, Node.js, Express, MongoDB, FastAPI, Python, Generative AI, Agentic AI
  Projects:
  - HireIQ AI Platform
  `;
  const jd = "fun go hand-in-hand If you love building things and want your code - and the agents you build - to make an impact, this is your cue. Apply now and let's build something awesome together. Cache buster: " + Date.now();
  
  fd.append('resume', Buffer.from(realResume, 'utf-8'), { filename: 'resume.txt', contentType: 'text/plain' });
  fd.append('jobDescription', jd);
  
  const res = await axios.post(`${BASE_URL}/resume/analyze`, fd, {
    headers: { ...fd.getHeaders(), Authorization: `Bearer ${token}` }
  });

  console.log("jobAlignment:", res.data?.jobAlignment);
  console.log("keywordIntelligence:", res.data?.keywordIntelligence);
}

runTests().catch(console.error);
