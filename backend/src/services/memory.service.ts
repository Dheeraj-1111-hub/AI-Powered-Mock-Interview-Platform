import Interview from '../models/Interview';
import CodingSubmission from '../models/CodingSubmission';

export const getUserIntelligenceMemory = async (userId: string) => {
  try {
    // Fetch last 5 interviews
    const recentInterviews = await Interview.find({ user: userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5);

    // Aggregate weaknesses
    const weaknesses = recentInterviews.flatMap(i => i.report?.weaknesses || []);
    const strengths = recentInterviews.flatMap(i => i.report?.strengths || []);
    
    // Aggregate technical mistakes from coding
    const codingPerformance = await CodingSubmission.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);
      
    const codingIssues = codingPerformance.flatMap(c => c.aiReview?.issues.map(iss => iss.description) || []);

    return {
      topWeaknesses: Array.from(new Set(weaknesses)).slice(0, 5),
      topStrengths: Array.from(new Set(strengths)).slice(0, 5),
      codingIssues: Array.from(new Set(codingIssues)).slice(0, 5),
      averageScore: recentInterviews.length > 0 
        ? recentInterviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / recentInterviews.length
        : 0
    };
  } catch (error) {
    console.error('Memory Service Error:', error);
    return null;
  }
};
