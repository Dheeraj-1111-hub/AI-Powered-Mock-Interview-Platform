import { Schema, model, Document, Types } from 'mongoose';

/**
 * MentorSession — Persistent AI Mentor Memory
 * 
 * Stores conversation history + context snapshots so the AI mentor
 * can reference prior sessions, track weaknesses over time, and
 * provide continuity across visits.
 */

export interface IMentorSession extends Document {
  user: Types.ObjectId;
  persona: 'faang_engineer' | 'startup_cto' | 'dsa_coach' | 'career_recruiter';
  messages: Array<{
    role: 'user' | 'mentor';
    content: string;
    timestamp: Date;
  }>;
  extractedWeaknesses: string[];
  pastRecommendations: string[];
  // Snapshot of career state at session start — used for context injection
  contextSnapshot: {
    overallReadiness: number;
    careerState: string;
    targetRole: string;
    targetCompany: string;
    weakTopics: string[];
    strongTopics: string[];
    streak: number;
    weeksToReadiness: number;
    performanceDelta: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const mentorSessionSchema = new Schema<IMentorSession>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  persona: {
    type: String,
    enum: ['faang_engineer', 'startup_cto', 'dsa_coach', 'career_recruiter'],
    default: 'faang_engineer'
  },
  messages: [{
    role: { type: String, enum: ['user', 'mentor'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  extractedWeaknesses: { type: [String], default: [] },
  pastRecommendations: { type: [String], default: [] },
  contextSnapshot: {
    overallReadiness: { type: Number, default: 0 },
    careerState: { type: String, default: 'Explorer' },
    targetRole: { type: String, default: '' },
    targetCompany: { type: String, default: '' },
    weakTopics: [String],
    strongTopics: [String],
    streak: { type: Number, default: 0 },
    weeksToReadiness: { type: Number, default: 12 },
    performanceDelta: { type: String, default: '' },
  },
}, { timestamps: true });

export default model<IMentorSession>('MentorSession', mentorSessionSchema);
