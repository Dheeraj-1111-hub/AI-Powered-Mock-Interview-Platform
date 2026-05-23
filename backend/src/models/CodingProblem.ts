import { Schema, model, Document, Types } from 'mongoose';

export interface ICodingProblem extends Document {
  rawProblemId?: Types.ObjectId;
  slug: string;
  title: string;
  scenario?: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  acceptanceRate?: number;
  functionName: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    hidden: boolean;
    caseType: 'sample' | 'edge' | 'boundary' | 'stress' | 'hidden';
  }>;
  starterCode: Record<string, string>;
  constraints?: string[];
  hints?: string[];
  tags?: string[];
  companyTags?: string[];
  optimalComplexity?: string;
  relatedProblems?: string[];
  recommendedNext?: string;
  weaknessConnections?: string[];
  discussions?: Array<{
    author: string;
    timeAgo: string;
    content: string;
  }>;
  createdAt: Date;
}

const codingProblemSchema = new Schema<ICodingProblem>({
  rawProblemId: { type: Schema.Types.ObjectId, ref: 'RawProblem' },
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  scenario: { type: String },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  category: { type: String, required: true },
  acceptanceRate: { type: Number },
  functionName: { type: String, required: true },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  testCases: [{
    input: String,
    expectedOutput: String,
    hidden: { type: Boolean, default: false },
    caseType: { type: String, enum: ['sample', 'edge', 'boundary', 'stress', 'hidden'], default: 'hidden' }
  }],
  starterCode: { type: Map, of: String },
  constraints: [String],
  hints: [String],
  tags: [String],
  companyTags: [String],
  optimalComplexity: { type: String, default: "O(N) Time, O(1) Space" },
  relatedProblems: [String],
  recommendedNext: String,
  weaknessConnections: [String],
  discussions: [{
    author: String,
    timeAgo: String,
    content: String
  }],
  createdAt: { type: Date, default: Date.now },
});

export default model<ICodingProblem>('CodingProblem', codingProblemSchema);
