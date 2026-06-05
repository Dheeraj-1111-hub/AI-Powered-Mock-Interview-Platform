import { Schema, model, Document, Types } from 'mongoose';

export interface IRoadmap extends Document {
  user: Types.ObjectId;
  strategyId?: string;
  title: string;
  targetRole: string;
  targetCompany: string;
  persona: string;
  phases: Array<{
    name: string;
    duration: string;
    tasks: string[];
  }>;
  // Week-level granular plan
  weeklyPlan: Array<{
    week: number;
    focus: string;
    topics: string[];
    problems: number;
    specificProblems: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
    mockInterviews: number;
    status: 'locked' | 'active' | 'completed' | 'struggling' | 'regenerated' | 'skipped';
    confidenceScore?: number;
    decisionReasoning?: string;
    completedAt?: Date;    // null = not yet completed
    skippedTasks: string[]; // tasks the user explicitly skipped
    tasks: Array<{
      id: string;
      title: string;
      completed: boolean;
      type: 'solve' | 'interview' | 'learn' | 'review';
      xpReward: number;
    }>;
  }>;
  skillGaps: Array<{
    skill: string;
    importance: string;
    description: string;
  }>;
  // Adaptive signals — updated on regeneration
  adaptiveSignals: {
    lastAdaptedAt?: Date;
    velocityScore: number;        // problems/week rate
    strugglingTopics: string[];   // topics where user is falling behind
    completedWeeks: number[];     // week numbers that are FROZEN (never re-generate)
    regenerationCount: number;    // how many times roadmap was adapted
  };
  createdAt: Date;
}

const roadmapSchema = new Schema<IRoadmap>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  strategyId: { type: String },
  title: { type: String, required: true },
  targetRole: { type: String, required: true },
  targetCompany: { type: String, default: '' },
  persona: { type: String, default: 'faang_engineer' },
  phases: [{
    name: String,
    duration: String,
    tasks: [String]
  }],
  weeklyPlan: [{
    week: Number,
    focus: String,
    topics: [String],
    problems: Number,
    specificProblems: [String],
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Easy' },
    mockInterviews: { type: Number, default: 0 },
    status: { type: String, enum: ['locked', 'active', 'completed', 'struggling', 'regenerated', 'skipped'], default: 'locked' },
    confidenceScore: Number,
    decisionReasoning: String,
    completedAt: Date,
    dailyCompletions: { type: Number, default: 0 }, // counts days where all tasks done
    skippedTasks: [String],
    tasks: [{
      id: String,
      title: String,
      completed: { type: Boolean, default: false },
      type: { type: String, enum: ['solve', 'interview', 'learn', 'review'], default: 'solve' },
      xpReward: { type: Number, default: 10 },
    }],
  }],
  skillGaps: [{
    skill: String,
    importance: String,
    description: String
  }],
  adaptiveSignals: {
    lastAdaptedAt: Date,
    velocityScore: { type: Number, default: 0 },
    strugglingTopics: [String],
    completedWeeks: [Number],
    regenerationCount: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

export default model<IRoadmap>('Roadmap', roadmapSchema);
