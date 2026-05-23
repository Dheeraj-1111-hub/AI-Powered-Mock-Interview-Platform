import { Schema, model, Document, Types } from 'mongoose';

export interface IInterviewSession extends Document {
  user: Types.ObjectId;
  problem: Types.ObjectId;
  status: 'active' | 'completed' | 'abandoned';
  codeSnapshots: Array<{
    code: string;
    language: string;
    timestamp: Date;
  }>;
  messages: Array<{
    role: 'interviewer' | 'candidate';
    content: string;
    timestamp: Date;
  }>;
  tone: 'supportive' | 'interrogative' | 'silent' | 'demanding';
  interviewerPersona: string;
  weaknessAreas: string[];
  failureAnalysis?: {
    logic: number;
    optimization: number;
    communication: number;
    confidence: number;
    timeManagement: number;
    detailedSignals: string[];
    mentorRecommendation: string;
  };
  feedbackScorecard?: {
    problemSolving: number;
    optimization: number;
    codeQuality: number;
    communication: number;
    feedbackSummary: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const interviewSessionSchema = new Schema<IInterviewSession>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  problem: { type: Schema.Types.ObjectId, ref: 'CodingProblem', required: true },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  codeSnapshots: [{
    code: String,
    language: String,
    timestamp: { type: Date, default: Date.now }
  }],
  messages: [{
    role: { type: String, enum: ['interviewer', 'candidate'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  tone: { type: String, enum: ['supportive', 'interrogative', 'silent', 'demanding'], default: 'interrogative' },
  interviewerPersona: { type: String, default: 'A senior Staff Engineer at a FAANG company. Direct, professional, focusing on edge cases and optimal scalability.' },
  weaknessAreas: [String],
  failureAnalysis: {
    logic: Number,
    optimization: Number,
    communication: Number,
    confidence: Number,
    timeManagement: Number,
    detailedSignals: [String],
    mentorRecommendation: String
  },
  feedbackScorecard: {
    problemSolving: Number,
    optimization: Number,
    codeQuality: Number,
    communication: Number,
    feedbackSummary: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default model<IInterviewSession>('InterviewSession', interviewSessionSchema);
