import { Schema, model, Document, Types } from 'mongoose';

export interface IInterview extends Document {
  user: Types.ObjectId;
  role: string;
  experience: string;
  stack: string;
  companyType: string;
  persona: {
    name: string;
    style: string;
    goals: string[];
  };
  rounds: Array<{
    name: string;
    duration: string;
    questions: Array<{
      text: string;
      answer?: string;
      latencyMs?: number;
      evaluation?: {
        accuracy: number;
        depth: number;
        communication: number;
        confidence: number;
        practicality: number;
        skillDelta: number;
        voiceMetrics?: {
          wpm: number;
          fillerWordCount: number;
        };
        mistakes: string[];
        idealAnswer: string;
      };
      status: 'pending' | 'answered' | 'skipped';
    }>;
  }>;
  overallScore: number;
  status: 'scheduled' | 'active' | 'completed';
  feedback: string;
  report?: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    verdict: string;
  };
  tags: string[];
  createdAt: Date;
}

const interviewSchema = new Schema<IInterview>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  experience: { type: String, required: true },
  stack: { type: String, required: true },
  companyType: { type: String, required: true },
  persona: {
    name: String,
    style: String,
    goals: [String]
  },
  rounds: [{
    name: String,
    duration: String,
    questions: [{
      text: String,
      answer: String,
      latencyMs: Number,
      evaluation: {
        accuracy: Number,
        depth: Number,
        communication: Number,
        confidence: Number,
        practicality: Number,
        skillDelta: Number,
        voiceMetrics: {
          wpm: Number,
          fillerWordCount: Number
        },
        mistakes: [String],
        idealAnswer: String
      },
      status: { type: String, enum: ['pending', 'answered', 'skipped'], default: 'pending' }
    }]
  }],
  overallScore: { type: Number, default: 0 },
  status: { type: String, enum: ['scheduled', 'active', 'completed'], default: 'scheduled' },
  feedback: String,
  report: {
    summary: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    verdict: String
  },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ role: 'text', stack: 'text' });

export default model<IInterview>('Interview', interviewSchema);
