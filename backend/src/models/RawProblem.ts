import { Schema, model, Document } from 'mongoose';

export interface IRawProblem extends Document {
  source: string; // 'codeforces'
  sourceId: string; // e.g., '1969-A' (contestId-index)
  originalTitle: string;
  originalTags: string[];
  originalRating?: number;
  rawMetadata: Record<string, any>;
  createdAt: Date;
}

const rawProblemSchema = new Schema<IRawProblem>({
  source: { type: String, default: 'codeforces', required: true },
  sourceId: { type: String, required: true, unique: true },
  originalTitle: { type: String, required: true },
  originalTags: [String],
  originalRating: Number,
  rawMetadata: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default model<IRawProblem>('RawProblem', rawProblemSchema);
