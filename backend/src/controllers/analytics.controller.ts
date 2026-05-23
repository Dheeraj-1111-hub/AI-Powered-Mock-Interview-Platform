import { Request, Response } from 'express';
import Interview from '../models/Interview';
import CodingSubmission from '../models/CodingSubmission';
import { reqUser } from '../middleware/auth';
import { getDashboardRecommendations } from '../services/ai';
import User from '../models/User';
import IntelligenceEvent from '../models/IntelligenceEvent';

export const getSummary = async (req: Request, res: Response) => {
  const userId = reqUser(req);
  const interviews = await Interview.find({ user: userId }).sort({ createdAt: -1 });
  const codings = await CodingSubmission.find({ user: userId }).sort({ createdAt: -1 });
  const intelEvents = await IntelligenceEvent.find({ user: userId }).sort({ createdAt: 1 }).lean();
  
  // Profile Completion Calculation
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  let completionPoints = 0;
  if (user.onboardingCompleted) completionPoints += 40;
  if (user.resumeUrl) completionPoints += 30;
  if (user.skills.length > 0) completionPoints += 20;
  if (user.avatar) completionPoints += 10;
  const profileCompletion = completionPoints;

  const totalInterviews = interviews.length;
  const totalCoding = codings.length;
  const averageScore = interviews.length > 0 
    ? interviews.reduce((sum, item) => sum + (item.overallScore || 0), 0) / interviews.length 
    : 0;

  // Streak Calculation
  const allDates = [...interviews, ...codings, ...intelEvents]
    .map(item => (item.createdAt || (item as any).timestamp || new Date()).toISOString().split('T')[0])
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const uniqueDates = Array.from(new Set(allDates));
  let streak = 0;
  let currentDate = new Date();
  
  for (const dateStr of uniqueDates) {
    const d = new Date(dateStr);
    const diffTime = Math.abs(currentDate.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays <= 1) {
      streak++;
      currentDate = d;
    } else {
      break;
    }
  }

  // True Growth Trajectory (Trends) based on IntelligenceEvents (XP / Delta progression)
  let currentXP = 0;
  let trends = intelEvents.map((evt: any) => {
    let num = evt.metadata?.xpEarned || 0;
    
    // Fallback to legacy delta parsing if no metadata
    if (num === 0 && evt.delta) {
        if (typeof evt.delta === 'string') {
            const matches = evt.delta.match(/[-+]?[0-9]*\.?[0-9]+/);
            if (matches) num = parseFloat(matches[0]);
        } else if (typeof evt.delta === 'number') {
            num = evt.delta;
        }
    }
    
    // Add to cumulative XP
    if (evt.type !== 'milestone' && evt.type !== 'system_insight') {
        currentXP += num;
    }
    
    const dateStr = (evt.createdAt || evt.timestamp || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { name: dateStr, score: currentXP, originalDelta: num };
  });

  // If not enough events, fallback to legacy interview average progression
  if (trends.length < 2) {
    const trendMap: Record<string, { totalScore: number; count: number }> = {};
    interviews.forEach(interview => {
      const dateStr = interview.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!trendMap[dateStr]) trendMap[dateStr] = { totalScore: 0, count: 0 };
      trendMap[dateStr].totalScore += (interview.overallScore || 0);
      trendMap[dateStr].count += 1;
    });
    
    trends = Object.keys(trendMap).map(date => ({
      name: date,
      score: Math.round(trendMap[date].totalScore / trendMap[date].count)
    })).reverse();

    if (trends.length === 0) {
      trends = [{ name: 'Mon', score: 0 }, { name: 'Tue', score: 0 }, { name: 'Wed', score: 0 }];
    } else if (trends.length === 1) {
      const singleDate = new Date(trends[0].name);
      singleDate.setDate(singleDate.getDate() - 1);
      const prevDateStr = singleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      trends.unshift({ name: prevDateStr, score: 0 }); // Baseline start
    }
  } else {
    // Compress events to distinct days for chart readability
    const compressedMap: Record<string, number> = {};
    trends.forEach(t => {
        compressedMap[t.name] = t.score; // keeps the latest score for that day
    });
    trends = Object.keys(compressedMap).map(date => ({
        name: date,
        score: compressedMap[date]
    }));

    // Recharts AreaChart requires at least 2 data points to render a line.
    // If all events happened on the same day, we add a baseline starting point.
    if (trends.length === 1) {
        const singleDate = new Date(trends[0].name);
        singleDate.setDate(singleDate.getDate() - 1);
        const prevDateStr = singleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trends.unshift({ name: prevDateStr, score: 0 }); // Baseline start
    }
  }

  const topicStats: Record<string, { totalScore: number; count: number }> = {};
  
  interviews.forEach(interview => {
    interview.tags.forEach(tag => {
      if (!topicStats[tag]) topicStats[tag] = { totalScore: 0, count: 0 };
      topicStats[tag].totalScore += (interview.overallScore || 0);
      topicStats[tag].count += 1;
    });
  });

  codings.forEach(coding => {
    const tag = coding.language === 'python' ? 'Python / Algorithms' : 'Data Structures & Algos';
    if (!topicStats[tag]) topicStats[tag] = { totalScore: 0, count: 0 };
    topicStats[tag].totalScore += (coding.aiReview?.score || 75);
    topicStats[tag].count += 1;
  });

  const topicAverages = Object.keys(topicStats).map(tag => ({
    topic: tag,
    average: topicStats[tag].totalScore / topicStats[tag].count,
    attempts: topicStats[tag].count
  })).sort((a, b) => b.average - a.average);

  const weakTopics = topicAverages.slice(-3).reverse(); // Actual weakest topics

  const activityTimeline = [
    ...intelEvents.map(e => ({
        id: e._id,
        type: e.type,
        title: e.title,
        description: e.description,
        date: e.createdAt || (e as any).timestamp,
        tags: [e.delta].filter(Boolean)
    })),
    ...interviews.map(i => ({ id: i._id, type: 'interview', title: `${i.role} Interview`, description: `Scored ${i.overallScore}/100`, date: i.createdAt, tags: i.tags })),
    ...codings.map(c => ({ id: c._id, type: 'coding', title: `Coding Challenge (${c.language})`, description: `Status: ${c.status}`, date: c.createdAt, tags: [] }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15);

  const aiRecs = await getDashboardRecommendations(
    { totalInterviews, totalCoding, averageScore, streak },
    activityTimeline.slice(0, 5),
    { role: user.role, skills: user.skills, experience: user.experience }
  );

  if (aiRecs?.aiInsights) {
    user.aiReflection = aiRecs.aiInsights;
    await user.save();
  }

  const startScore = trends.length > 1 ? (trends[0].score || 0) : 0;
  const endScore = trends.length > 0 ? trends[trends.length-1].score : 0;
  
  let growthRate = "0%";
  if (trends.length > 1) {
    if (startScore === 0) {
      growthRate = endScore > 0 ? `+${endScore} XP` : "0%";
    } else {
      const pct = Math.round(((endScore - startScore) / startScore) * 100);
      growthRate = pct >= 0 ? `+${pct}%` : `${pct}%`;
    }
  }

  // Behavioral Telemetry Mapping
  const telemetry = user.behavioralTelemetry || {
    hintDependency: 'Medium',
    recoveryAbility: 'Medium',
    persistence: 'Medium',
    panicSignals: 'Medium',
    interviewStability: 'Medium'
  };

  const strToScore = (str: string) => {
    const s = String(str).toUpperCase();
    if (s.includes('LOW')) return 85;
    if (s.includes('HIGH')) return 30;
    return 60; // Medium
  };
  
  const positiveStrToScore = (str: string) => {
    const s = String(str).toUpperCase();
    if (s.includes('LOW')) return 30;
    if (s.includes('HIGH')) return 85;
    return 60; // Medium
  };

  const radarData = [
    { subject: 'Independence (No Hints)', A: strToScore(telemetry.hintDependency) },
    { subject: 'Recovery', A: positiveStrToScore(telemetry.recoveryAbility) },
    { subject: 'Composure (Low Panic)', A: strToScore(telemetry.panicSignals) },
    { subject: 'Persistence', A: positiveStrToScore(telemetry.persistence) },
    { subject: 'Stability', A: positiveStrToScore(telemetry.interviewStability) },
    { subject: 'Core Logic', A: Math.round(averageScore) || 50 }
  ];

  res.json({
    stats: { totalInterviews, totalCoding, averageScore: Number(averageScore.toFixed(1)), streak, profileCompletion },
    trends,
    radarData,
    topicAverages: topicAverages.map(t => ({
        topic: t.topic,
        average: Number(t.average.toFixed(1)),
        attempts: t.attempts
    })),
    insights: { 
      weakTopics: weakTopics.map(w => w.topic), 
      improvementPlan: aiRecs.summary, 
      quickActions: aiRecs.recommendations,
      aiInsights: aiRecs.aiInsights,
      memory: {
          pattern: aiRecs.memoryPattern || `I've observed a recurring pattern in your ${user.role} simulations. You excel at high-level abstractions but frequently overlook implementation details.`,
          growthRate: growthRate,
          criticalWeakness: weakTopics.length > 0 ? weakTopics[0].topic : 'System Design Fundamentals'
      }
    },
    activityTimeline
  });
};
