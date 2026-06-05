import { Schema, model, Document, Types } from 'mongoose';

export interface IResumeAnalysis extends Document {
  user: Types.ObjectId;
  resumeUrl?: string;
  filename: string;
  parsedText: string;
  jobDescription?: string;

  globalAts: {
    format: number;
    keywords: number;
    sections: number;
    readability: number;
    parsing: number;
    total: number;
  };

  jobAlignment: {
    score: number;
    presentKeywords: string[];
    missingKeywords: string[];
  };

  recruiterImpact: {
    score: number;
    metrics: {
      actionVerbs: number;
      leadership: number;
      impactMetrics: number;
      ownership: number;
      technicalDepth: number;
    };
  };

  projectQuality: {
    score: number;
    evaluations: Array<{
      projectName: string;
      complexity: number;
      techDepth: number;
      architecture: number;
      impact: number;
      reason: string;
    }>;
  };

  dynamicGuidelines: Array<{
    rule: string;
    status: 'passed' | 'failed';
    message: string;
  }>;

  sectionQuality: Array<{
    name: string;
    score: number;
    feedback: string;
  }>;

  skillDNA: {
    keywords: number;
    impact: number;
    brevity: number;
    actionVerbs: number;
    formatting: number;
  };

  bulletImprovements: Array<{
    original: string;
    improved: string;
    changes: Array<{
      type: string; // e.g., 'Added Metric', 'Action Verb'
      description: string;
    }>;
  }>;

  keywordIntelligence: {
    present: string[];
    missing: string[];
    overused: string[];
    weak: string[];
  };

  strategicStrengths: string[];
  criticalGaps: Array<{
    topic: string;
    reason: string;
  }>;

  recruiterFeedback: {
    strengths: string[];
    concerns: string[];
    recommendation: 'Interview Worthy' | 'Borderline' | 'Needs Work';
  };

  sixSecondScan: {
    good: string[];
    bad: string[];
  };

  createdAt: Date;
}

const resumeAnalysisSchema = new Schema<IResumeAnalysis>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resumeUrl: String,
  filename: { type: String, required: true },
  parsedText: { type: String, default: '' },
  jobDescription: { type: String, default: '' },

  globalAts: {
    format: { type: Number, default: 0 },
    keywords: { type: Number, default: 0 },
    sections: { type: Number, default: 0 },
    readability: { type: Number, default: 0 },
    parsing: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },

  jobAlignment: {
    score: { type: Number, default: 0 },
    presentKeywords: [String],
    missingKeywords: [String],
  },

  recruiterImpact: {
    score: { type: Number, default: 0 },
    metrics: {
      actionVerbs: { type: Number, default: 0 },
      leadership: { type: Number, default: 0 },
      impactMetrics: { type: Number, default: 0 },
      ownership: { type: Number, default: 0 },
      technicalDepth: { type: Number, default: 0 },
    }
  },

  projectQuality: {
    score: { type: Number, default: 0 },
    evaluations: [{
      projectName: String,
      complexity: Number,
      techDepth: Number,
      architecture: Number,
      impact: Number,
      reason: String
    }]
  },

  dynamicGuidelines: [{
    rule: String,
    status: String,
    message: String
  }],

  sectionQuality: [{
    name: String,
    score: Number,
    feedback: String
  }],

  skillDNA: {
    keywords: { type: Number, default: 0 },
    impact: { type: Number, default: 0 },
    brevity: { type: Number, default: 0 },
    actionVerbs: { type: Number, default: 0 },
    formatting: { type: Number, default: 0 }
  },

  bulletImprovements: [{
    original: String,
    improved: String,
    changes: [{
      type: { type: String },
      description: String
    }]
  }],

  keywordIntelligence: {
    present: [String],
    missing: [String],
    overused: [String],
    weak: [String]
  },

  strategicStrengths: [String],
  criticalGaps: [{
    topic: String,
    reason: String
  }],

  recruiterFeedback: {
    strengths: [String],
    concerns: [String],
    recommendation: String
  },

  sixSecondScan: {
    good: [String],
    bad: [String]
  },

  createdAt: { type: Date, default: Date.now }
});

resumeAnalysisSchema.index({ user: 1, createdAt: -1 });
resumeAnalysisSchema.index({ filename: 'text' });

export default model<IResumeAnalysis>(
  'ResumeAnalysis',
  resumeAnalysisSchema
);