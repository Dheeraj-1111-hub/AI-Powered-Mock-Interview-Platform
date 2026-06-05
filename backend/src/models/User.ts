import { Schema, model, Document } from 'mongoose';

export interface ICareerProfile {
  targetRole: string;
  dreamCompany: string;
  backupCompany: string;
  timeline: string;
  targetCompany: string; // Legacy
  currentYear: string; // 'freshman' | 'sophomore' | 'junior' | 'senior' | 'professional'
  dailyHoursAvailable: number;
  weakTopics: string[];
  strongTopics: string[];
  initialized: boolean;
  savedStep: number; // for resumable onboarding (0-5)
  // v2 Behavioral Signals
  practiceFrequency?: string;
  platformsUsed?: string[];
  highestDifficulty?: string;
  version: number;
  initializationStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface IStrategy {
  _id?: any;
  targetCompany: string;
  targetRole: string;
  mode: string;
  dailyHours: number;
  state: 'draft' | 'active' | 'paused' | 'archived' | 'completed';
  whyStrategyChanged?: string;
  createdAt: Date;
  archivedAt?: Date;
  readinessSnapshot?: any;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  avatar?: string;
  skills: string[];
  experience: string;
  createdAt: Date;
  isEmailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  onboardingCompleted: boolean;
  resumeUrl?: string;
  resumeAnalyzed: boolean;
  lastActiveDate?: Date;
  solvedProblems: string[];
  // Career Intelligence (Legacy & New)
  careerProfile: ICareerProfile; // Legacy, kept for graceful migration
  careerStrategies: IStrategy[];
  activeStrategyId?: string;
  
  careerState: string; // 'Explorer' | 'Builder' | 'Interview Ready' | 'FAANG Ready' | 'Elite Candidate'
  readinessLastComputed?: Date;
  aiReflection?: string;

  trophies: Array<{
    id: string;
    title: string;
    description: string;
    unlockedAt: Date;
    evidence: string;
  }>;

  dailyFocus?: {
    date: Date;
    tasks: Array<{
      id: string;
      title: string;
      completed: boolean;
      type: 'solve' | 'interview' | 'learn' | 'review';
      estMinutes: number;
      metadata?: any;
      link?: string;
    }>;
  };
}

const careerProfileSchema = new Schema<ICareerProfile>({
  targetRole: { type: String, default: 'Software Engineer' },
  dreamCompany: { type: String, default: '' },
  backupCompany: { type: String, default: '' },
  timeline: { type: String, default: '12 months' },
  targetCompany: { type: String, default: '' },
  currentYear: { type: String, default: 'junior' },
  dailyHoursAvailable: { type: Number, default: 2 },
  weakTopics: { type: [String], default: [] },
  strongTopics: { type: [String], default: [] },
  initialized: { type: Boolean, default: false },
  savedStep: { type: Number, default: 0 },
  practiceFrequency: { type: String },
  platformsUsed: { type: [String] },
  highestDifficulty: { type: String },
  version: { type: Number, default: 2 },
  initializationStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' }
}, { _id: false });

const strategySchema = new Schema<IStrategy>({
  targetCompany: { type: String, required: true },
  targetRole: { type: String, required: true },
  mode: { type: String, required: true, default: 'faang_sprint' },
  dailyHours: { type: Number, default: 2 },
  state: { type: String, enum: ['draft', 'active', 'paused', 'archived', 'completed'], default: 'active' },
  whyStrategyChanged: { type: String },
  createdAt: { type: Date, default: Date.now },
  archivedAt: { type: Date },
  readinessSnapshot: { type: Schema.Types.Mixed },
});

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'candidate' },
  avatar: String,
  skills: { type: [String], default: [] },
  experience: { type: String, default: 'entry' },
  createdAt: { type: Date, default: Date.now },
  isEmailVerified: { type: Boolean, default: true },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  onboardingCompleted: { type: Boolean, default: false },
  resumeUrl: String,
  resumeAnalyzed: { type: Boolean, default: false },
  lastActiveDate: Date,
  solvedProblems: [{ type: Schema.Types.ObjectId, ref: 'CodingProblem' }],
  // Career Intelligence
  careerProfile: { type: careerProfileSchema, default: () => ({}) },
  careerStrategies: { type: [strategySchema], default: [] },
  activeStrategyId: { type: String },
  careerState: { type: String, default: 'Explorer' },
  readinessLastComputed: Date,
  
  aiReflection: { type: String },

  trophies: [{
    id: String,
    title: String,
    description: String,
    unlockedAt: { type: Date, default: Date.now },
    evidence: String
  }],

  dailyFocus: {
    date: Date,
    tasks: [{
      id: String,
      title: String,
      completed: { type: Boolean, default: false },
      type: { type: String, enum: ['solve', 'interview', 'learn', 'review'], default: 'solve' },
      estMinutes: Number,
      metadata: Schema.Types.Mixed,
      link: String
    }],
  },
});

export default model<IUser>('User', userSchema);
