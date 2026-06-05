import axios from 'axios';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:4000/api';
let token = '';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function uploadResume(filename: string, content: string, mimetype: string = 'text/plain', jd: string = '') {
  const fd = new FormData();
  fd.append('resume', Buffer.from(content, 'utf-8'), { filename, contentType: mimetype });
  if (jd) fd.append('jobDescription', jd);
  
  try {
    const res = await axios.post(`${BASE_URL}/resume/analyze`, fd, {
      headers: { ...fd.getHeaders(), Authorization: `Bearer ${token}` }
    });
    return { data: res.data, status: res.status };
  } catch (error: any) {
    return { data: error.response?.data, status: error.response?.status, error: error.message };
  }
}

async function runTests() {
  console.log('\n=============================================');
  console.log('   HIREIQ AI RESUME ANALYZER - E2E TEST RUN');
  console.log('=============================================\n');

  // PHASE 1: AUTHENTICATION
  console.log('>>> [PHASE 1] AUTHENTICATION');
  const email = `tester_${Date.now()}@hireiq.test`;
  await axios.post(`${BASE_URL}/auth/register`, { name: 'E2E Tester', email, password: 'password123' });
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email, password: 'password123' });
  token = loginRes.data.token;
  console.log(`✓ Test user authenticated: ${email}\n`);

  // PHASE 1 (CONT) - FILE VALIDATION TESTING
  console.log('>>> [PHASE 1.B] FILE VALIDATION');
  const badImageRes = await uploadResume('resume.png', 'fake image data', 'image/png');
  console.log(`✓ Image rejection: ${badImageRes.status === 400 ? 'Passed' : 'Failed'} (${badImageRes.data.message})`);

  // OVERSIZED FILE TEST
  // Create 6MB buffer
  const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, 'A');
  const fdOversized = new FormData();
  fdOversized.append('resume', oversizedBuffer, { filename: 'big.txt', contentType: 'text/plain' });
  try {
     const oversizedRes = await axios.post(`${BASE_URL}/resume/analyze`, fdOversized, {
         headers: { ...fdOversized.getHeaders(), Authorization: `Bearer ${token}` }
     });
     console.log(`❌ Oversized rejection failed. Status: ${oversizedRes.status}`);
  } catch(e: any) {
     console.log(`✓ Oversized rejection: Passed (${e.response?.data?.message || 'Payload Too Large'})`);
  }
  console.log('');

  // PHASE 2 & 3: TEXT EXTRACTION & SECTION DETECTION
  console.log('>>> [PHASE 2 & 3] SECTION DETECTION (Missing Skills)');
  const missingSkillsResume = `
  Sai Dheeraj
  Email: test@test.com
  
  Education:
  B.Tech CSE, 2024
  
  Projects:
  - Hospital Management System
  
  Experience:
  - None
  `;
  const res3 = await uploadResume('missing_skills.txt', missingSkillsResume);
  console.log(`✓ Skills Section Detected: ${res3.data?.sections?.skills ? 'Yes (Failed)' : 'No (Passed)'}\n`);

  // PHASE 4 & 5: ATS SCORE & JOB ALIGNMENT
  console.log('>>> [PHASE 4 & 5] ATS SCORE & JOB ALIGNMENT');
  const jd = `Frontend Engineer needed. Must know React, TypeScript, Redux, and Tailwind. Cache buster: ${Date.now()}`;
  const resumeA = `
  Sai Dheeraj
  
  Education:
  B.Tech Computer Science
  
  Skills:
  React, TypeScript, Tailwind
  
  Projects:
  Built responsive web app using React and Tailwind.
  
  Experience:
  Software Intern.
  `;
  
  const resA = await uploadResume('resumeA.txt', resumeA, 'text/plain', jd);
  console.log(`✓ ATS Score for good format: ${resA.data?.globalAts?.total || 'N/A'}`);
  const match = resA.data?.jobAlignment?.presentKeywords || [];
  const missing = resA.data?.jobAlignment?.missingKeywords || [];
  console.log(`✓ Job Alignment Score: ${resA.data?.jobAlignment?.score || 'N/A'}`);
  console.log(`✓ Matched JD Keywords: ${match.join(', ')}`);
  console.log(`✓ Missing JD Keywords: ${missing.join(', ')}\n`);

  // PHASE 7: BULLET OPTIMIZER
  console.log('>>> [PHASE 7] BULLET OPTIMIZER');
  const bullet = resA.data?.bulletImprovements?.[0];
  if (bullet) {
     console.log(`Original: ${bullet.original}`);
     console.log(`Improved: ${bullet.improved}`);
     console.log(`Reasoning: ${bullet.changes?.map((c: any) => c.type).join(', ') || 'N/A'}\n`);
  } else {
     console.log(`❌ No bullets improved.\n`);
  }

  // PHASE 15: REAL USER TEST (YOUR ACTUAL RESUME)
  console.log('>>> [PHASE 15] REAL USER PROFILE TEST');
  const realResume = `
  Sai Dheeraj
  4th Year CSE Student
  
  Education:
  B.Tech in Computer Science & Engineering
  
  Skills:
  React, Node.js, Express, MongoDB, FastAPI, Python
  
  Projects:
  - HireIQ AI Platform: Developed an AI career coach using React, Node, and AI models.
  - Hospital Management: Built a full-stack platform using React and Node for hospital operations.
  
  Experience:
  - Currently a student looking for full-time software engineering roles.
  `;
  
  const jdReal = `Software Engineer. Requires React, Node.js, PostgreSQL, AWS, and strong problem-solving skills. Cache Buster: ${Date.now()}`;
  
  const resReal = await uploadResume('sai_dheeraj_resume.txt', realResume, 'text/plain', jdReal);
  if (resReal.data?.error) console.log('ERROR:', resReal.data.error);
  console.log(`✓ Final ATS Score: ${resReal.data?.globalAts?.total || 'N/A'}`);
  console.log(`✓ Project Quality Score: ${resReal.data?.projectQuality?.score || 'N/A'}`);
  console.log(`✓ Recruiter Feedback (Strengths): ${resReal.data?.recruiterFeedback?.strengths?.join(' | ') || 'N/A'}`);
  console.log(`✓ Recruiter Recommendation: ${resReal.data?.recruiterFeedback?.recommendation || 'N/A'}\n`);

  // THE ULTIMATE DETERMINISM TEST (Modify and re-run)
  console.log('>>> [ULTIMATE E2E TEST] MUTATING RESUME');
  const mutatedResume = realResume.replace('Express, MongoDB, FastAPI', 'Express, PostgreSQL, AWS, FastAPI');
  const resMutated = await uploadResume('sai_dheeraj_mutated.txt', mutatedResume, 'text/plain', jdReal);
  
  const origScore = resReal.data?.jobAlignment?.score || 0;
  const mutScore = resMutated.data?.jobAlignment?.score || 0;
  console.log(`Original Alignment: ${origScore}%`);
  console.log(`Mutated Alignment: ${mutScore}%`);
  console.log(`Did alignment strictly increase? ${mutScore > origScore ? 'YES' : 'NO'}`);

  console.log('\n=============================================');
  console.log('   TEST RUN COMPLETED');
  console.log('=============================================\n');
}

runTests().catch(console.error);
