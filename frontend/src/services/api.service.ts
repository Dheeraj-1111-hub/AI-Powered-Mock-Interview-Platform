import axios from 'axios';
import { authHeader } from './auth';

const baseURL =
  import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export const client = axios.create({
  baseURL,
  withCredentials: true,
});

// Auto refresh token interceptor
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true;

      try {
        const res = await client.post('/auth/refresh');

        if (res.data.token) {
          localStorage.setItem('hireiq_token', res.data.token);

          originalRequest.headers.Authorization = `Bearer ${res.data.token}`;

          return client(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('hireiq_token');
        localStorage.removeItem('hireiq_user');

        window.location.href = '/auth';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

//
// AUTH
//

export const registerUser = (payload: any) =>
  client.post('/auth/register', payload);

export const loginUser = (payload: any) =>
  client.post('/auth/login', payload);

export const logoutUser = () =>
  client.post('/auth/logout');

export const verifyEmail = (payload: any) =>
  client.post('/auth/verify-email', payload);

export const forgotPassword = (payload: any) =>
  client.post('/auth/forgot-password', payload);

export const resetPassword = (payload: any) =>
  client.post('/auth/reset-password', payload);

export const completeOnboarding = (payload: any) =>
  client.post('/auth/onboarding', payload, {
    headers: authHeader(),
  });

//
// DASHBOARD & INTERVIEWS
//

export const fetchDashboard = () =>
  client.get('/dashboard/summary', {
    headers: authHeader(),
  });

export const startInterview = (payload: any) =>
  client.post('/interviews/start', payload, {
    headers: authHeader(),
  });

export const submitAnswer = (payload: any) =>
  client.post('/interviews/answer', payload, {
    headers: authHeader(),
  });

export const endInterview = (payload: any) =>
  client.post('/interviews/end', payload, {
    headers: authHeader(),
  });

export const getInterviewDetails = (id: string) =>
  client.get(`/interviews/${id}`, {
    headers: authHeader(),
  });

export const getInterviewHistory = () =>
  client.get('/interviews/history', {
    headers: authHeader(),
  });

export const injectFollowUp = (payload: any) =>
  client.post('/interviews/inject', payload, {
    headers: authHeader(),
  });

//
// AI SERVICES
//

// IMPORTANT FIX
export const generateInterview = (payload: any) =>
  client.post('/ai/generate', payload, {
    headers: authHeader(),
  });

export const generateInterviewPlan = (payload: any) =>
  client.post('/ai/generate', payload, {
    headers: authHeader(),
  });

export const evaluateAnswer = (payload: any) =>
  client.post('/ai/evaluate', payload, {
    headers: authHeader(),
  });

export const getCodeReview = (payload: any) =>
  client.post('/ai/review', payload, {
    headers: authHeader(),
  });

export const fetchProblems = () =>
  client.get('/codes/problems', {
    headers: authHeader(),
  });

export const fetchProblemRecommendations = () =>
  client.get('/career/recommend-problem', {
    headers: authHeader(),
  });

export const fetchProblemById = (id: string) =>
  client.get(`/codes/problems/${id}`, {
    headers: authHeader(),
  });

export const addProblemDiscussion = (id: string, content: string) =>
  client.post(`/codes/problems/${id}/discussions`, { content }, {
    headers: authHeader(),
  });

export const runCodeExecution = (payload: any) =>
  client.post('/codes/run', payload, {
    headers: authHeader(),
  });

export const submitCodeChallenge = (payload: any) =>
  client.post('/codes/submit', payload, {
    headers: authHeader(),
  });

export const fetchMySubmissions = () =>
  client.get('/codes/submissions', {
    headers: authHeader(),
  });

export const getCodeSubmissions = () =>
  client.get('/codes/submissions', {
    headers: authHeader(),
  });

export const fetchCareerRoadmap = () =>
  client.get('/career/roadmap', {
    headers: authHeader(),
  });

export const fetchActivityFeed = () =>
  client.get('/career/activity', {
    headers: authHeader(),
  });

export const generateRoadmap = () =>
  client.post('/career/roadmap/generate', {}, {
    headers: authHeader(),
  });

export const analyzeSkillGap = (payload: any) =>
  client.post('/ai/career/gap', payload, {
    headers: authHeader(),
  });

export const saveInterview = (payload: any) =>
  client.post('/interviews/save', payload, {
    headers: authHeader(),
  });

export const chatWithMentor = (payload: any) =>
  client.post('/career/mentor/chat', payload, {
    headers: authHeader(),
  });

export const getFollowUpQuestion = (payload: any) =>
  client.post('/ai/follow-up', payload, {
    headers: authHeader(),
  });

//
// RESUME INTELLIGENCE
//

export const analyzeResume = (file: File, jobDescription?: string) => {
  const body = new FormData();
  body.append('resume', file);
  if (jobDescription) {
    body.append('jobDescription', jobDescription);
  }
  return client.post('/resume/analyze', body, {
    headers: {
      ...authHeader(),
    },
  });
};

export const getResumeHistory = () =>
  client.get('/resume/history', {
    headers: authHeader(),
  });

export const getLatestResumeAnalysis = () =>
  client.get('/resume/latest', {
    headers: authHeader(),
  });

export const startCodingInterview = (payload: { problemId: string; tone: string }) =>
  client.post('/codes/interview/start', payload, {
    headers: authHeader(),
  });

export const chatCodingInterview = (payload: { sessionId: string; message: string; currentCode?: string; language?: string }) =>
  client.post('/codes/interview/chat', payload, {
    headers: authHeader(),
  });

export const finishCodingInterview = (payload: { sessionId: string; currentCode?: string; language?: string }) =>
  client.post('/codes/interview/finish', payload, {
    headers: authHeader(),
  });

export const monitorCodingInterview = (payload: { sessionId: string; currentCode?: string; language?: string }) =>
  client.post('/codes/interview/monitor', payload, {
    headers: authHeader(),
  });

export const fetchSubmissionAuditStatus = (id: string) =>
  client.get(`/codes/submissions/${id}/audit-status`, {
    headers: authHeader(),
  });

// ─────────────────────────────────────────────────────────────────────────────
// CAREER AI INTELLIGENCE — Phase 3 API
// ─────────────────────────────────────────────────────────────────────────────

export const getCareerIntelligence = () =>
  client.get('/career/intelligence', { headers: authHeader() });

export const initCareerProfile = (payload: any) =>
  client.post('/career/profile/init', payload, { headers: authHeader() });

export const saveOnboardingProgress = (payload: { step: number; data: any }) =>
  client.post('/career/profile/save-progress', payload, { headers: authHeader() });

export const resetCareerOS = () =>
  client.post('/career/reset', {}, { headers: authHeader() });

export const adaptRoadmap = () =>
  client.post('/career/roadmap/adapt', {}, { headers: authHeader() });

export const completeWeek = (weekNumber: number) =>
  client.post('/career/roadmap/complete-week', { weekNumber }, { headers: authHeader() });

export const chatWithMentorV2 = (payload: { message: string; persona: string }) =>
  client.post('/career/mentor/chat', payload, { headers: authHeader() });

export const getTodayFocus = () =>
  client.get('/career/today', { headers: authHeader() });

export const completeTodayTask = (taskId: string) =>
  client.post('/career/today/complete', { taskId }, { headers: authHeader() });

export const getActivityFeed = () =>
  client.get('/career/activity', { headers: authHeader() });

export const getEngineeringDNA = () =>
  client.get('/career/dna', { headers: authHeader() });

export const previewStrategyShift = (payload: { newMode: string }) =>
  client.post('/career/strategy/preview', payload, { headers: authHeader() });

export const shiftStrategy = (payload: { targetCompany: string; targetRole: string; newMode: string; whyStrategyChanged: string }) =>
  client.post('/career/strategy/shift', payload, { headers: authHeader() });

export default client;