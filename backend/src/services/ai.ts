import aiClient from './aiClient';

export const getDashboardRecommendations = async (stats: any, activity: any, userProfile: any) => {
  try {
    const response = await aiClient.post('/dashboard/recommendations', {
      stats,
      activity,
      userProfile
    }, { 
      // @ts-ignore
      retry: 2, retryCount: 0 
    });
    return response.data;
  } catch (error) {
    console.error('Error calling AI service for recommendations:', error);
    return {
      summary: "Keep practicing to unlock AI-driven insights and personalized growth roadmaps.",
      recommendations: [
        { title: "Start Mock Interview", description: "Take your first AI-moderated interview to begin tracking metrics.", action: "/room", priority: "High" }
      ],
      aiInsights: "Insufficient data for deep analysis. Complete more sessions to see skill-specific trends."
    };
  }
};

export const analyzeResume = async (formData: any) => {
  const response = await aiClient.post('/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // @ts-ignore
    retry: 1, retryCount: 0
  });
  return response.data;
};
