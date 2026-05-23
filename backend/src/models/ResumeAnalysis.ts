import { Schema, model, Document, Types } from 'mongoose';

export interface IResumeAnalysis extends Document {
  user: Types.ObjectId;
  resumeUrl?: string;
  filename: string;
  atsScore: number;
  roleMatch: number;
  keywordGaps: string[];
  strengths: string[];
  weaknesses: string[];
  rewriteSuggestions: string[];
  bulletImprovements: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
  recruiterInsights: string;
  jobDescription?: string;

  sectionScores: {
    experience: number;
    education: number;
    skills: number;
    summary: number;
  };

  radarScores: {
    impact: number;
    keywords: number;
    brevity: number;
    actionVerbs: number;
    formatting: number;
  };

  keywordHighlighting: Array<{
    keyword: string;
    type: string;
    status: string;
  }>;

  createdAt: Date;
}

const resumeAnalysisSchema = new Schema<IResumeAnalysis>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  resumeUrl: {
    type: String,
  },

  filename: {
    type: String,
    required: true,
  },

  atsScore: {
    type: Number,
    required: true,
  },

  roleMatch: {
    type: Number,
    default: 0,
  },

  keywordGaps: {
    type: [String],
    default: [],
  },

  strengths: {
    type: [String],
    default: [],
  },

  weaknesses: {
    type: [String],
    default: [],
  },

  rewriteSuggestions: {
    type: [String],
    default: [],
  },
  
  bulletImprovements: [
    {
      original: String,
      improved: String,
      reason: String
    }
  ],

  jobDescription: {
    type: String,
    default: ''
  },

  recruiterInsights: {
    type: String,
    default: '',
  },

  sectionScores: {
    experience: {
      type: Number,
      default: 0,
    },

    education: {
      type: Number,
      default: 0,
    },

    skills: {
      type: Number,
      default: 0,
    },

    summary: {
      type: Number,
      default: 0,
    },
  },

  radarScores: {
    impact: {
      type: Number,
      default: 0,
    },

    keywords: {
      type: Number,
      default: 0,
    },

    brevity: {
      type: Number,
      default: 0,
    },

    actionVerbs: {
      type: Number,
      default: 0,
    },

    formatting: {
      type: Number,
      default: 0,
    },
  },

  keywordHighlighting: [
    {
      keyword: {
        type: String,
        default: '',
      },

      // REMOVED ENUM TO PREVENT AI VALIDATION ERRORS
      type: {
        type: String,
        default: 'skill',
      },

      status: {
        type: String,
        default: 'present',
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

resumeAnalysisSchema.index({ user: 1, createdAt: -1 });
resumeAnalysisSchema.index({ filename: 'text' });

export default model<IResumeAnalysis>(
  'ResumeAnalysis',
  resumeAnalysisSchema
);