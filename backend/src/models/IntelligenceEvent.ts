import { Schema, model, Document, Types } from 'mongoose';

export interface IIntelligenceEvent extends Document {
  user: Types.ObjectId;
  type: 
    | 'skill_improved'
    | 'skill_declined'
    | 'roadmap_completed'
    | 'interview_completed'
    | 'streak_milestone'
    | 'optimization_detected'
    | 'optimization_missing'
    | 'resume_improved'
    | 'mentor_intervention'
    | 'recovery_required';
  eventType?: 'FACT' | 'INFERENCE' | 'SYSTEM';
  title: string;
  description: string;
  topic?: string;
  delta?: number;
  metadata?: {
    previousScore?: number;
    newScore?: number;
    interviewId?: string;
    roadmapWeek?: number;
    xpEarned?: number;
  };
  severity?: 'insight' | 'warning' | 'milestone' | 'critical' | 'achievement' | 'low' | 'medium' | 'high';
  emotionalTone?: 'celebratory' | 'advisory' | 'urgent' | 'motivational';
  createdAt: Date;
}

const intelligenceEventSchema = new Schema<IIntelligenceEvent>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'skill_improved', 'skill_declined', 'roadmap_completed', 'interview_completed',
      'streak_milestone', 'optimization_detected', 'optimization_missing',
      'resume_improved', 'mentor_intervention', 'recovery_required'
    ],
    required: true
  },
  eventType: {
    type: String,
    enum: ['FACT', 'INFERENCE', 'SYSTEM'],
    default: 'INFERENCE'
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  topic: { type: String },
  delta: { type: Number },
  metadata: {
    previousScore: Number,
    newScore: Number,
    interviewId: String,
    roadmapWeek: Number,
    xpEarned: Number
  },
  severity: { type: String, enum: ['insight', 'warning', 'milestone', 'critical', 'achievement', 'low', 'medium', 'high'] },
  emotionalTone: { type: String, enum: ['celebratory', 'advisory', 'urgent', 'motivational'] },
  createdAt: { type: Date, default: Date.now },
});

export default model<IIntelligenceEvent>('IntelligenceEvent', intelligenceEventSchema);
