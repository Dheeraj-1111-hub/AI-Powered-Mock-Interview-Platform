import { Request, Response } from 'express';
import Interview from '../models/Interview';
import CodingSubmission from '../models/CodingSubmission';
import { reqUser } from '../middleware/auth';
import { getDashboardRecommendations } from '../services/ai';
import User from '../models/User';
import IntelligenceEvent from '../models/IntelligenceEvent';
import ActivityLog from '../models/ActivityLog';

export const getSummary = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const interviews = await Interview.find({ user: userId }).sort({ createdAt: -1 });
    const codings = await CodingSubmission.find({ user: userId }).sort({ createdAt: -1 });
    const intelEvents = await IntelligenceEvent.find({ user: userId }).sort({ createdAt: 1 }).lean();
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Simulation Count
    let completedInterviews = 0;
    let abandonedInterviews = 0;
    let practiceSessions = 0;
    interviews.forEach(i => {
       if (i.status === 'completed') completedInterviews++;
       else if ((i as any).status === 'abandoned') abandonedInterviews++;
       else practiceSessions++;
    });

    // 2. Consistency Streak (Sourced from Immutable ActivityLog)
    const activityLogs = await ActivityLog.find({ user: userId }).sort({ timestamp: -1 }).lean();
    
    const allDates = activityLogs
      .map((log: any) => new Date(log.timestamp).toISOString().split('T')[0])
      .sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
    
    const uniqueDates = Array.from(new Set(allDates));
    let currentStreak = 0;
    let longestStreak = 0; // simplified for now
    let currentDate = new Date();
    
    for (const dateStr of uniqueDates) {
      const d = new Date(dateStr);
      const diffTime = Math.abs(currentDate.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays <= 1) {
        currentStreak++;
        currentDate = d;
      } else {
        break;
      }
    }
    longestStreak = Math.max(currentStreak, (user as any).longestStreak || 0);
    const lastActive = uniqueDates.length > 0 ? uniqueDates[0] : 'Never';
    const expectedGain = Math.min(10, Math.max(1, 7 - currentStreak)); // simplistic prediction

    // 3. Gather Topic Evidence (Heatmap & Skill DNA)
    const topicStats: Record<string, {
       codingAttempts: number, codingSolved: number, codingTimeMs: number,
       interviewAsked: number, interviewAccuracySum: number
    }> = {};

    codings.forEach(c => {
       const topic = (c as any).topic || 'General';
       if (!topicStats[topic]) topicStats[topic] = { codingAttempts: 0, codingSolved: 0, codingTimeMs: 0, interviewAsked: 0, interviewAccuracySum: 0 };
       topicStats[topic].codingAttempts++;
       if (c.status === 'Accepted' || (c as any).status === 'solved') topicStats[topic].codingSolved++;
       topicStats[topic].codingTimeMs += (c as any).executionTime || 1200000; // default 20m
    });

    interviews.forEach(i => {
       i.rounds.forEach(r => {
          r.questions.forEach(q => {
             if (q.status === 'answered' && q.evaluation) {
                const topic = i.role || 'General'; // Simplify: attach to role or extract from tags
                if (!topicStats[topic]) topicStats[topic] = { codingAttempts: 0, codingSolved: 0, codingTimeMs: 0, interviewAsked: 0, interviewAccuracySum: 0 };
                topicStats[topic].interviewAsked++;
                topicStats[topic].interviewAccuracySum += (q.evaluation as any).accuracy || 0;
             }
          });
       });
    });

    // 4. Calculate Skill DNA
    const skillDNA: any[] = [];
    let avgCodingAccuracy = 0;
    let totalCodingAttempts = 0;
    let totalCodingSolved = 0;
    
    Object.entries(topicStats).forEach(([topic, stats]) => {
       const codingAcc = stats.codingAttempts > 0 ? (stats.codingSolved / stats.codingAttempts) * 100 : 0;
       const intAcc = stats.interviewAsked > 0 ? (stats.interviewAccuracySum / stats.interviewAsked) : 0;
       const consistency = Math.min(100, stats.codingAttempts * 10); // simplistic
       const speed = stats.codingAttempts > 0 ? Math.max(0, 100 - (stats.codingTimeMs / stats.codingAttempts / 60000)) : 0; // max 100
       
       totalCodingAttempts += stats.codingAttempts;
       totalCodingSolved += stats.codingSolved;

       // SkillScore(topic) = 0.4 accuracy + 0.3 interview + 0.2 consistency + 0.1 speed
       const score = Math.round((0.4 * codingAcc) + (0.3 * intAcc) + (0.2 * consistency) + (0.1 * speed));
       
       skillDNA.push({
          topic,
          score,
          evidence: {
             solved: `${stats.codingSolved}/${stats.codingAttempts}`,
             interview: `${stats.interviewAsked} asked`,
             avgTime: `${Math.round(stats.codingTimeMs / stats.codingAttempts / 60000 || 0)} min`
          }
       });
    });
    
    if (totalCodingAttempts > 0) avgCodingAccuracy = (totalCodingSolved / totalCodingAttempts) * 100;

    const avgInterviewScore = interviews.length > 0 
      ? interviews.reduce((sum, item) => sum + (item.overallScore || 0), 0) / interviews.length 
      : 0;

    // 5. Intelligence Index (Sourced strictly from Readiness Engine)
    const { computeCareerIntelligence } = require('../services/careerIntelligence/readinessEngine');
    const intel = await computeCareerIntelligence(userId);
    const intelligenceIndex = Math.round(intel.readiness.overall);
    const consistencyScore = Math.min(100, (currentStreak / 14) * 100);
    const velocity = intel.growthVelocity;

    // 6. Growth Trajectory (Sourced strictly from ActivityLog)
    const trajectory = [];
    for (let i = 6; i >= 0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const dStr = d.toISOString().split('T')[0];
       
       const dayLogs = activityLogs.filter((log: any) => new Date(log.timestamp).toISOString().split('T')[0] === dStr);
       const dayXp = dayLogs.reduce((sum: number, log: any) => sum + (log.xpAwarded || 0), 0);
       
       trajectory.push({
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          score: dayXp,
          reason: dayLogs.length > 0 ? `+${dayXp} from ${dayLogs.length} events` : 'No activity'
       });
    }

    // 7. Persistent Memory (AI Conclusions backed by evidence)
    let persistentMemory = null;
    if (interviews.length > 0 || totalCodingAttempts > 0 || intel.reasoning.length > 0) {
       persistentMemory = {
          strengths: skillDNA.filter(s => s.score > 70).slice(0, 2),
          weaknesses: skillDNA.filter(s => s.score < 50).slice(0, 2),
          observation: intel.reasoning.join(' '),
          evidence: interviews.slice(0, 4).map(i => `Interview #${i._id.toString().slice(-4)} = ${i.overallScore}`)
       };
    }

    // Build Forensic Payload
    res.json({
       intelligenceIndex: {
          score: intelligenceIndex || 0,
          evidence: `Averaged from Coding Accuracy (${Math.round(avgCodingAccuracy)}%), Interview Readiness (${Math.round(avgInterviewScore)}%), and Consistency (${Math.round(consistencyScore)}%).`,
          breakdown: {
             "Technical Skill": Math.round(avgCodingAccuracy),
             "Interview Readiness": Math.round(avgInterviewScore),
             "Consistency": Math.round(consistencyScore),
             "Problem Solving": Math.round(velocity),
             "Communication": Math.round(avgInterviewScore * 0.9) // simplistic
          }
       },
       telemetry: {
          streak: {
             current: currentStreak,
             longest: longestStreak,
             lastActive: lastActive,
             expectedGain: `+${expectedGain}%`,
             evidence: `Calculated from daily interaction logs. Detected activity on ${uniqueDates.length} unique days.`
          },
          simulations: {
             total: interviews.length,
             completed: completedInterviews,
             abandoned: abandonedInterviews,
             practice: practiceSessions,
             evidence: `Direct count of InterviewSession records: ${completedInterviews} completed, ${abandonedInterviews} abandoned.`
          },
          mastery: {
             score: Math.round(avgCodingAccuracy),
             level: avgCodingAccuracy > 90 ? 'Expert' : avgCodingAccuracy > 70 ? 'Advanced' : avgCodingAccuracy > 40 ? 'Intermediate' : 'Beginner',
             neededForNext: avgCodingAccuracy > 90 ? 0 : avgCodingAccuracy > 70 ? Math.round(91 - avgCodingAccuracy) : avgCodingAccuracy > 40 ? Math.round(71 - avgCodingAccuracy) : Math.round(41 - avgCodingAccuracy),
             evidence: `Computed from ${totalCodingSolved} correct solutions out of ${totalCodingAttempts} total submissions.`
          }
       },
       trajectory,
       skillDNA: skillDNA.sort((a,b) => b.score - a.score),
       persistentMemory,
       recentInterviews: interviews.slice(0, 5).map(i => ({
          id: i._id,
          role: i.role,
          score: i.overallScore,
          date: i.createdAt
       }))
    });
  } catch (error: any) {
    console.error('Forensic Analytics Error:', error.message);
    res.status(500).json({ message: 'Failed to generate forensic analytics' });
  }
};
