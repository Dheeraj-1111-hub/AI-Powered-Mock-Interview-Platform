/**
 * DETERMINISTIC READINESS ENGINE
 *
 * Computes interview readiness using hard math — NOT AI hallucination.
 * Architecture: Backend Analytics → AI Interpretation → UI Display
 *
 * Formula:
 *   score = (dsaAccuracy * 0.35) + (interviewPerf * 0.25) + (consistency * 0.15)
 *         + (optimizationQuality * 0.15) + (resumeStrength * 0.10)
 */

import CodingSubmission from '../../models/CodingSubmission';
import CodingProblem from '../../models/CodingProblem';
import InterviewSession from '../../models/InterviewSession';
import ResumeAnalysis from '../../models/ResumeAnalysis';
import User from '../../models/User';
import IntelligenceEvent from '../../models/IntelligenceEvent';
import { normalizeToCanonical, CanonicalTopic, TOPIC_REGISTRY } from './topicNormalizer';
import logger from '../logger';

export type ReadinessBand =
  | 'Foundation Building'
  | 'Emerging Solver'
  | 'Execution Capable'
  | 'Interview Ready'
  | 'Advanced Optimization';

export interface TopicScore {
  canonical: CanonicalTopic;
  label: string;
  current: number;      // 0-100, computed from all sources
  target: number;       // 0-100, what FAANG expects
  gap: number;          // target - current (negative = exceeded)
  trend: number;        // delta from last week (e.g., +5, -2, 0)
  source: {
    codingLab: number;
    interviewSession: number;
    aiAudit: number;
  };
}

export interface ReadinessBreakdown {
  overall: number;        // 0-95 (Adjusted score)
  rawScore: number;       // 0-100 (Unadjusted score)
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  band: ReadinessBand;
  multiplier: number;
  evidenceCount: {
    codingSessions: number;
    calibrationChecks: number;
    mockInterviews: number;
  };
  dsa: number;            
  systemDesign: number;   
  behavioral: number;     
  consistency: number;    
  optimization: number;   
  resumeStrength: number; 
}

export interface CareerIntelligenceReport {
  readiness: ReadinessBreakdown;
  systemConfidence: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string[];
  careerState: ReadinessBand;
  topicScores: TopicScore[];
  weeklyActivity: { week: string; solved: number; score: number }[];
  strugglingTopics: CanonicalTopic[];
  strongTopics: CanonicalTopic[];
  weeksToReadiness: number;       // Estimated weeks until FAANG ready at current velocity
  performanceDelta: string;       // Human-readable summary for AI mentor context
}

/** Determine Career State from adjusted readiness score */
const resolveReadinessBand = (score: number): ReadinessBand => {
  if (score >= 91) return 'Advanced Optimization';
  if (score >= 76) return 'Interview Ready';
  if (score >= 51) return 'Execution Capable';
  if (score >= 31) return 'Emerging Solver';
  return 'Foundation Building';
};

/** Clamp a number between min and max */
const clamp = (val: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, val));

/** Calculate Evidence Reliability Multiplier */
const computeDataSufficiencyMultiplier = (totalEvidence: number): number => {
  if (totalEvidence <= 5) return 0.35;
  if (totalEvidence <= 15) return 0.55;
  if (totalEvidence <= 40) return 0.75;
  if (totalEvidence <= 100) return 0.90;
  return 1.0;
};

/** Determine Confidence from Multiplier */
const computeConfidenceLevel = (multiplier: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (multiplier < 0.55) return 'LOW';
  if (multiplier < 0.8) return 'MEDIUM';
  return 'HIGH';
};

/** Compute consistency score from engagement stability (active weeks + frequency) */
const computeConsistency = (activeWeeks: number, submissionsLast30Days: number): number => {
  const weekScore = clamp((activeWeeks / 4) * 50, 0, 50);
  const frequencyScore = clamp(submissionsLast30Days * 1.5, 0, 50);
  return clamp(weekScore + frequencyScore);
};

/** Compute DSA accuracy from submission results */
const computeDSAAccuracy = (
  totalSubmissions: number,
  acceptedSubmissions: number,
  hardAccepted: number,
  totalHard: number
): number => {
  if (totalSubmissions === 0) return 0;
  const baseAccuracy = (acceptedSubmissions / totalSubmissions) * 70;
  const hardBonus = totalHard > 0 ? (hardAccepted / totalHard) * 30 : 0;
  return clamp(baseAccuracy + hardBonus);
};

/** Compute optimization quality from AI audit scores */
const computeOptimizationQuality = (auditScores: number[]): number => {
  if (auditScores.length === 0) return 0;
  const avg = auditScores.reduce((a, b) => a + b, 0) / auditScores.length;
  return clamp(avg);
};

/** Compute interview performance from session scorecards */
const computeInterviewPerformance = (sessions: any[]): number => {
  if (sessions.length === 0) return 0;
  const scores = sessions
    .filter(s => s.feedbackScorecard)
    .map(s => {
      const sc = s.feedbackScorecard;
      return (sc.problemSolving + sc.optimization + sc.codeQuality + sc.communication) / 4;
    });
  if (scores.length === 0) return 0;
  return clamp(scores.reduce((a, b) => a + b, 0) / scores.length);
};

/** Main intelligence computation function */
export const computeCareerIntelligence = async (
  userId: string
): Promise<CareerIntelligenceReport> => {
  logger.info(`[ReadinessEngine]: Computing career intelligence for user ${userId}`);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Parallel data fetching from all sources
  const [user, allSubmissions, recentSessions, latestResume] = await Promise.all([
    User.findById(userId),
    CodingSubmission.find({ user: userId }).populate('problem', 'difficulty category').lean(),
    InterviewSession.find({ user: userId, status: 'completed' }).sort({ createdAt: -1 }).limit(10).lean(),
    ResumeAnalysis.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!user) throw new Error('User not found for career intelligence computation');

  // --- DSA Accuracy Computation ---
  const last30Submissions = allSubmissions.filter(s => new Date(s.createdAt) > thirtyDaysAgo);
  const accepted = allSubmissions.filter(s => s.status === 'Accepted');
  const hardProblems = allSubmissions.filter(s => (s.problem as any)?.difficulty === 'Hard');
  const hardAccepted = hardProblems.filter(s => s.status === 'Accepted');

  const dsaAccuracy = computeDSAAccuracy(
    allSubmissions.length,
    accepted.length,
    hardAccepted.length,
    hardProblems.length
  );

  // --- Interview Performance ---
  const interviewPerf = computeInterviewPerformance(recentSessions);

  // --- Consistency ---
  const last4WeeksSubs = allSubmissions.filter(s => new Date(s.createdAt) > new Date(Date.now() - 28 * 24 * 60 * 60 * 1000));
  const activeWeeksSet = new Set(last4WeeksSubs.map(s => {
    return Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000));
  }));
  const consistency = computeConsistency(activeWeeksSet.size, last30Submissions.length);

  // --- Optimization Quality (from AI audit scores in submissions) ---
  const auditScores = (allSubmissions as any[])
    .filter(s => s.aiReview?.score)
    .map(s => s.aiReview.score);
  const optimizationQuality = computeOptimizationQuality(auditScores);

  // --- Resume Strength ---
  const resumeStrength = latestResume?.atsScore
    ? clamp(latestResume.atsScore)
    : user.resumeAnalyzed ? 40 : 0;

  // --- Evidence Counting & Sufficiency ---
  const evidenceCount = {
    codingSessions: allSubmissions.length,
    calibrationChecks: user.careerProfile?.initialized ? 1 : 0,
    mockInterviews: recentSessions.length
  };
  const totalEvidenceCount = evidenceCount.codingSessions + evidenceCount.calibrationChecks + evidenceCount.mockInterviews;
  
  const multiplier = computeDataSufficiencyMultiplier(totalEvidenceCount);
  const confidence = computeConfidenceLevel(multiplier);

  // --- FINAL READINESS FORMULA (Standardized) ---
  const rawScore = clamp(
    dsaAccuracy * 0.40 +
    interviewPerf * 0.30 +
    consistency * 0.15 +
    optimizationQuality * 0.15
  );

  const adjustedScore = clamp(rawScore * multiplier, 0, 95); // Cap strictly at 95

  const band = resolveReadinessBand(adjustedScore);

  const readiness: ReadinessBreakdown = {
    overall: Math.round(adjustedScore),
    rawScore: Math.round(rawScore),
    confidence,
    band,
    multiplier,
    evidenceCount,
    dsa: Math.round(dsaAccuracy),
    systemDesign: Math.round(interviewPerf * 0.5),  // placeholder until system design round is tracked
    behavioral: Math.round(
      recentSessions.length > 0
        ? recentSessions.filter(s => s.feedbackScorecard).reduce((acc, s) => acc + (s.feedbackScorecard?.communication || 0), 0) / Math.max(recentSessions.filter(s => s.feedbackScorecard).length, 1)
        : 0
    ),
    consistency: Math.round(consistency),
    optimization: Math.round(optimizationQuality),
    resumeStrength: Math.round(resumeStrength),
  };

  // --- Topic-Level Scoring ---
  // Source 1: Coding Lab (40% weight) — from topicMastery Map
  const codingLabScores: Partial<Record<CanonicalTopic, number>> = {};
  if (user.topicMastery) {
    for (const [rawTopic, count] of user.topicMastery.entries()) {
      const canonical = normalizeToCanonical(rawTopic);
      if (canonical) {
        // Convert solve count to 0-100 scale (15 solves = mastery)
        codingLabScores[canonical] = clamp(Math.round((count / 15) * 100));
      }
    }
  }

  // Source 2: Interview Session accuracy per topic (30% weight)
  const interviewTopicScores: Partial<Record<CanonicalTopic, number[]>> = {};
  for (const session of recentSessions) {
    if (session.feedbackScorecard) {
      // For now, map interview scores to the problem's category
      const problemId = session.problem;
      const problem = await CodingProblem.findById(problemId).lean();
      if (problem) {
        const canonical = normalizeToCanonical((problem as any).category || '');
        if (canonical) {
          if (!interviewTopicScores[canonical]) interviewTopicScores[canonical] = [];
          interviewTopicScores[canonical]!.push(session.feedbackScorecard.problemSolving || 0);
        }
      }
    }
  }

  // Source 3: AI Audit quality per topic (15% weight)
  const auditTopicScores: Partial<Record<CanonicalTopic, number[]>> = {};
  for (const sub of allSubmissions as any[]) {
    if (sub.aiReview?.score && sub.problem?.category) {
      const canonical = normalizeToCanonical(sub.problem.category);
      if (canonical) {
        if (!auditTopicScores[canonical]) auditTopicScores[canonical] = [];
        auditTopicScores[canonical]!.push(sub.aiReview.score);
      }
    }
  }

  // Source 4: Historical trend — compare last 7 days vs 8-14 days
  const last7Accepted = allSubmissions.filter(s => s.status === 'Accepted' && new Date(s.createdAt) > sevenDaysAgo);
  const prev7Accepted = allSubmissions.filter(s => s.status === 'Accepted' && new Date(s.createdAt) > fourteenDaysAgo && new Date(s.createdAt) <= sevenDaysAgo);

  const topicTrends: Partial<Record<CanonicalTopic, number>> = {};
  for (const sub of last7Accepted as any[]) {
    const canonical = normalizeToCanonical(sub.problem?.category || '');
    if (canonical) topicTrends[canonical] = (topicTrends[canonical] || 0) + 1;
  }
  for (const sub of prev7Accepted as any[]) {
    const canonical = normalizeToCanonical(sub.problem?.category || '');
    if (canonical) topicTrends[canonical] = (topicTrends[canonical] || 0) - 0.5; // subtract prev week
  }

  // Build final topic scores (weighted combination)
  const topicScores: TopicScore[] = [];
  const allCanonicals = new Set<CanonicalTopic>([
    ...Object.keys(codingLabScores) as CanonicalTopic[],
    ...Object.keys(interviewTopicScores) as CanonicalTopic[],
    ...Object.keys(auditTopicScores) as CanonicalTopic[],
  ]);

  for (const canonical of allCanonicals) {
    const meta = TOPIC_REGISTRY[canonical];
    if (!meta) continue;

    const labScore = codingLabScores[canonical] ?? 0;
    const interviewAvg = interviewTopicScores[canonical]?.length
      ? interviewTopicScores[canonical]!.reduce((a, b) => a + b, 0) / interviewTopicScores[canonical]!.length
      : 0;
    const auditAvg = auditTopicScores[canonical]?.length
      ? auditTopicScores[canonical]!.reduce((a, b) => a + b, 0) / auditTopicScores[canonical]!.length
      : 0;

    // Weighted combination: CodingLab 40%, Interview 30%, AuditQuality 15%, Bonus 15%
    const current = clamp(Math.round(labScore * 0.40 + interviewAvg * 0.30 + auditAvg * 0.15));
    const target = clamp(meta.faangWeight);
    const trend = Math.round(clamp((topicTrends[canonical] || 0) * 5, -20, 20));

    topicScores.push({
      canonical,
      label: meta.label,
      current,
      target,
      gap: target - current,
      trend,
      source: {
        codingLab: Math.round(labScore),
        interviewSession: Math.round(interviewAvg),
        aiAudit: Math.round(auditAvg),
      },
    });
  }

  // Sort by gap descending (most critical gaps first)
  topicScores.sort((a, b) => b.gap - a.gap);

  const strugglingTopics = topicScores.filter(t => t.gap > 40).map(t => t.canonical);
  const strongTopics = topicScores.filter(t => t.gap <= 10).map(t => t.canonical);

  // Weekly activity for trend chart (last 8 weeks)
  const weeklyActivity = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(Date.now() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000);
    const weekSubs = allSubmissions.filter(s => {
      const d = new Date(s.createdAt);
      return d > weekStart && d <= weekEnd;
    });
    const weekAccepted = weekSubs.filter(s => s.status === 'Accepted');
    weeklyActivity.push({
      week: `W${8 - w}`,
      solved: weekAccepted.length,
      score: weekSubs.length > 0 ? Math.round((weekAccepted.length / weekSubs.length) * 100) : 0,
    });
  }

  // Estimate weeks to FAANG readiness
  const avgImprovementPerWeek = weeklyActivity.slice(-4).reduce((a, b) => a + b.solved, 0) / 4;
  const gapToFAANG = Math.max(0, 75 - adjustedScore);
  const weeksToReadiness = avgImprovementPerWeek > 0
    ? Math.round(gapToFAANG / (avgImprovementPerWeek * 2))
    : 12;

  // Performance delta string for AI mentor context
  const performanceDelta = [
    `Adjusted Readiness Score: ${Math.round(adjustedScore)} (${band})`,
    `Data Sufficiency Multiplier: ${multiplier} (Confidence: ${confidence})`,
    `Evidence: ${evidenceCount.codingSessions} code submissions, ${evidenceCount.mockInterviews} mock interviews`,
    `DSA Accuracy: ${readiness.dsa}%`,
    `Top Weakness: ${strugglingTopics[0] ? TOPIC_REGISTRY[strugglingTopics[0]]?.label : 'Unknown'}`,
  ].join('. ');

  // Detect and emit Intelligence Events
  if (user.interviewReadinessScore !== undefined) {
    const scoreDelta = Math.round(adjustedScore) - user.interviewReadinessScore;
    if (Math.abs(scoreDelta) >= 2) {
      IntelligenceEvent.create({
        user: userId,
        type: 'optimization_detected', // reuse existing enum for system events
        eventType: 'SYSTEM',
        title: 'Readiness Recalibrated',
        description: `Readiness adjusted to ${Math.round(adjustedScore)} (${band}) due to recent activity.`,
        delta: scoreDelta,
      }).catch(err => logger.error(`Failed to log intelligence event: ${err.message}`));
    }
  }

  // --- Explainability Logic (Strictly Observed Facts) ---
  const reasoning: string[] = [];

  reasoning.push(`Base score is ${Math.round(rawScore)} out of 100.`);
  reasoning.push(`Data sufficiency multiplier is ${multiplier}x based on ${totalEvidenceCount} evidence points.`);
  reasoning.push(`Final adjusted readiness is ${Math.round(adjustedScore)}.`);

  if (evidenceCount.mockInterviews === 0) {
    reasoning.push('0 mock interviews completed. Missing behavioral and system design signals.');
  }

  if (evidenceCount.codingSessions < 15) {
    reasoning.push(`Only ${evidenceCount.codingSessions} coding sessions recorded. Score is heavily penalized for low evidence.`);
  }

  return {
    readiness,
    systemConfidence: confidence,
    reasoning,
    careerState: band,
    topicScores,
    weeklyActivity,
    strugglingTopics,
    strongTopics,
    weeksToReadiness,
    performanceDelta,
  };
};
