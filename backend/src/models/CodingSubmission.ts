import { Schema, model, Document, Types } from 'mongoose';

export interface ICodingSubmission extends Document {
  user: Types.ObjectId;
  problem: Types.ObjectId;
  language: string;
  code: string;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Pending';
  results: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    hidden?: boolean;
    caseType?: 'sample' | 'edge' | 'boundary' | 'stress' | 'hidden';
    time?: number;
    memory?: number;
  }>;
  aiReview?: {
    complexity: {
      time: string;
      space: string;
    };
    issues: Array<{
      type: string;
      description: string;
      suggestion: string;
      severity?: string;
    }>;
    overallFeedback: string;
    optimizedCode: string;
    score: number;
    interviewerFeedback?: string;
    betterApproach?: string;
  };
  telemetry?: {
    timeToFirstCode: number; // Time in seconds from problem opened to first keystroke
    totalThinkingTime: number; // Time in seconds spent not typing
    totalTime: number; // Total time spent on problem
    compileAttempts: number;
    hintsUsed: number;
    editorialViewed: boolean;
  };
  runtime?: number;
  memory?: number;
  createdAt: Date;
}

const codingSubmissionSchema = new Schema<ICodingSubmission>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  problem: { type: Schema.Types.ObjectId, ref: 'CodingProblem', required: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  results: [{
    input: String,
    expected: String,
    actual: String,
    passed: Boolean,
    hidden: { type: Boolean, default: false },
    caseType: { type: String, enum: ['sample', 'edge', 'boundary', 'stress', 'hidden'], default: 'hidden' },
    time: Number,
    memory: Number
  }],
  aiReview: {
    complexity: { time: String, space: String },
    issues: [{ type: { type: String }, description: String, suggestion: String, severity: String }],
    overallFeedback: String,
    optimizedCode: String,
    score: Number,
    interviewerFeedback: String,
    betterApproach: String
  },
  telemetry: {
    timeToFirstCode: Number,
    totalThinkingTime: Number,
    totalTime: Number,
    compileAttempts: Number,
    hintsUsed: Number,
    editorialViewed: { type: Boolean, default: false }
  },
  runtime: Number,
  memory: Number,
  createdAt: { type: Date, default: Date.now },
});

export default model<ICodingSubmission>('CodingSubmission', codingSubmissionSchema);
