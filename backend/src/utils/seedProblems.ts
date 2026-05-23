import CodingProblem from '../models/CodingProblem';
import fs from 'fs';
import path from 'path';
import logger from '../services/logger';

export const seedProblems = async () => {
  try {
    const dataPath = path.join(__dirname, 'problemsData.json');
    if (!fs.existsSync(dataPath)) {
      logger.warn('problemsData.json not found. Skipping massive seed.');
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const problems = JSON.parse(rawData);

    // Clean the database to remove any generic/procedural placeholders
    await CodingProblem.deleteMany({});
    
    let newCount = 0;
    for (const prob of problems) {
      await CodingProblem.create(prob);
      newCount++;
    }
    
    logger.info(`Coding Problems Seeded: ${problems.length} total (${newCount} new)`);
  } catch (error) {
    logger.error('Failed to seed massive problems database', error);
  }
};
