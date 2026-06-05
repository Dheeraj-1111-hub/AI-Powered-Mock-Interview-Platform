import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  user: Types.ObjectId;
  type: 'problem_solved' | 'interview_completed' | 'resume_scanned' | 'daily_login' | 'roadmap_completed' | 'onboarding_completed';
  xpAwarded: number;
  metadata?: {
    skillId?: string;
    score?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    durationSeconds?: number;
    interviewId?: string;
    problemId?: string;
    resumeScanId?: string;
  };
  timestamp: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'problem_solved', 'interview_completed', 'resume_scanned', 
      'daily_login', 'roadmap_completed', 'onboarding_completed'
    ],
    required: true
  },
  xpAwarded: { type: Number, default: 0 },
  metadata: {
    skillId: String,
    score: Number,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    durationSeconds: Number,
    interviewId: { type: Schema.Types.ObjectId, ref: 'Interview' },
    problemId: { type: Schema.Types.ObjectId, ref: 'CodingProblem' },
    resumeScanId: { type: Schema.Types.ObjectId, ref: 'ResumeAnalysis' }
  },
  timestamp: { type: Date, default: Date.now, index: true }
});

export default model<IActivityLog>('ActivityLog', activityLogSchema);
