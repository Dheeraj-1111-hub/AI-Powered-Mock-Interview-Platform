export interface InterviewSummary {
  total: number;
  average: number;
  topicCounts: Record<string, number>;
  interviews: Array<{ _id: string; type: string; question: string; score?: number; createdAt: string}>;
}
