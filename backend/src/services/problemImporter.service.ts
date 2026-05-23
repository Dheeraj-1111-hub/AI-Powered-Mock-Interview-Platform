import axios from 'axios';
import RawProblem from '../models/RawProblem';
import CodingProblem from '../models/CodingProblem';
import logger from './logger';

const CODEFORCES_API = 'https://codeforces.com/api/problemset.problems';

// Filter for quality DSA tags
const CORE_DSA_TAGS = new Set([
  'arrays', 'dp', 'graphs', 'trees', 'greedy', 'binary search', 
  'sliding window', 'two pointers', 'hashing', 'strings', 'sortings', 
  'data structures', 'implementation', 'brute force', 'dfs and similar',
  'constructive algorithms', 'bitmasks', 'math'
]);

// Exclude tags that usually mean obscure math olympiad / geometry / game theory
const EXCLUDED_TAGS = new Set([
  'geometry', 'number theory', 'probabilities', 'chinese remainder theorem', 
  'games', 'matrices', 'ternary search', 'schedules', 'expression parsing'
]);

export const syncCodeforcesProblems = async (limit: number = 100): Promise<{ imported: number; skipped: number }> => {
  try {
    logger.info('[SyncCodeforces]: Initiating sync from Codeforces API...');
    const response = await axios.get(CODEFORCES_API);
    
    if (response.data?.status !== 'OK') {
      throw new Error(`Codeforces API returned status: ${response.data?.status}`);
    }

    const { problems, problemStatistics } = response.data.result;
    logger.info(`[SyncCodeforces]: Received ${problems.length} problems from Codeforces.`);

    // Map stats by contestId-index for fast lookup
    const statsMap = new Map<string, number>();
    for (const stat of problemStatistics) {
      const key = `${stat.contestId}-${stat.index}`;
      statsMap.set(key, stat.solvedCount || 0);
    }

    // Merge problems and statistics
    const mergedProblems = problems.map((prob: any) => {
      const key = `${prob.contestId}-${prob.index}`;
      return {
        ...prob,
        solvedCount: statsMap.get(key) || 0
      };
    });

    // Filter problems
    const filtered = mergedProblems.filter((prob: any) => {
      // Must be standard programming problems
      if (prob.type !== 'PROGRAMMING') return false;

      // Rating must be between 800 and 2500
      if (!prob.rating || prob.rating < 800 || prob.rating > 2500) return false;

      // Must NOT contain excluded tags
      const hasExcluded = prob.tags.some((tag: string) => EXCLUDED_TAGS.has(tag.toLowerCase()));
      if (hasExcluded) return false;

      // Must contain at least one core DSA tag or popular category
      const hasCoreDSA = prob.tags.some((tag: string) => CORE_DSA_TAGS.has(tag.toLowerCase()));
      if (!hasCoreDSA) return false;

      return true;
    });

    // Sort by solvedCount descending (popularity)
    filtered.sort((a: any, b: any) => b.solvedCount - a.solvedCount);

    // Slice to the top desired count
    const topProblems = filtered.slice(0, limit);
    logger.info(`[SyncCodeforces]: Sorted & filtered top ${topProblems.length} popular DSA problems.`);

    let imported = 0;
    let skipped = 0;

    for (const prob of topProblems) {
      const sourceId = `${prob.contestId}-${prob.index}`;
      
      // Upsert into raw_problems
      await RawProblem.findOneAndUpdate(
        { sourceId },
        {
          source: 'codeforces',
          sourceId,
          originalTitle: prob.name,
          originalTags: prob.tags,
          originalRating: prob.rating,
          rawMetadata: prob,
        },
        { upsert: true, new: true }
      );
      imported++;
    }

    logger.info(`[SyncCodeforces]: Sync complete. Imported/updated ${imported} problems.`);
    return { imported, skipped };
  } catch (error: any) {
    logger.error(`[SyncCodeforces]: Failed to sync Codeforces problems: ${error.message}`);
    throw error;
  }
};

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';

export const enrichRawProblems = async (batchSize: number = 5): Promise<{ enriched: number; skipped: number; errors: number }> => {
  let enriched = 0;
  let skipped = 0;
  let errors = 0;

  try {
    logger.info(`[EnrichProblems]: Starting batch enrichment (size: ${batchSize})...`);
    // Find raw problems
    const rawProblems = await RawProblem.find({});
    logger.info(`[EnrichProblems]: Found ${rawProblems.length} total raw problems.`);

    for (const raw of rawProblems) {
      // Check if already enriched
      const exists = await CodingProblem.findOne({ rawProblemId: raw._id });
      if (exists) {
        skipped++;
        continue;
      }

      // Check limit
      if (enriched >= batchSize) {
        break;
      }

      const difficulty = raw.originalRating && raw.originalRating < 1200 ? 'Easy' : 
                         raw.originalRating && raw.originalRating < 1900 ? 'Medium' : 'Hard';

      logger.info(`[EnrichProblems]: Enriching "${raw.originalTitle}" (${difficulty})...`);
      
      try {
        const response = await axios.post(`${AI_SERVICE_URL}/enrich`, {
          title: raw.originalTitle,
          difficulty,
          tags: raw.originalTags
        });

        const data = response.data;
        if (data.error) {
          throw new Error(data.error);
        }

        // Create the CodingProblem document
        await CodingProblem.create({
          rawProblemId: raw._id,
          title: raw.originalTitle,
          scenario: data.scenario,
          description: data.description,
          difficulty,
          category: data.category || 'Algorithms',
          testCases: data.testCases || [],
          starterCode: data.starterCode || {},
          constraints: data.constraints || [],
          hints: data.hints || [],
          tags: data.tags || raw.originalTags,
          companyTags: data.companyTags || ['Google', 'Meta', 'Amazon'],
          optimalComplexity: data.optimalComplexity,
          relatedProblems: data.relatedProblems || [],
          weaknessConnections: data.weaknessConnections || [],
          discussions: data.discussions || []
        });

        enriched++;
        logger.info(`[EnrichProblems]: Successfully enriched and stored "${raw.originalTitle}".`);
      } catch (err: any) {
        errors++;
        logger.error(`[EnrichProblems]: Failed to enrich "${raw.originalTitle}": ${err.message}`);
      }
    }

    logger.info(`[EnrichProblems]: Enrichment batch complete. Enriched: ${enriched}, Skipped: ${skipped}, Errors: ${errors}`);
    return { enriched, skipped, errors };
  } catch (error: any) {
    logger.error(`[EnrichProblems]: Bulk enrichment task failed: ${error.message}`);
    throw error;
  }
};
