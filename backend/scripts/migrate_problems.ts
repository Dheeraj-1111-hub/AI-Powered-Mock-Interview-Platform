import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingProblem from '../src/models/CodingProblem';

dotenv.config({ path: '../.env' });

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hireiq';

const seedProgressiveHints = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log('Connected to DB');

    const problems = await CodingProblem.find({});
    let updatedCount = 0;

    for (const problem of problems) {
      const isUpdated = false;
      const updates: any = {};

      // Migrate existing string hints to progressiveHints
      if (problem.hints && problem.hints.length > 0 && (!problem.progressiveHints || problem.progressiveHints.length === 0)) {
        updates.progressiveHints = problem.hints.map((hint, i) => {
          let type = 'conceptual';
          if (i === 1) type = 'structural';
          if (i === 2) type = 'pseudocode';
          if (i >= 3) type = 'solution';
          return { type, content: hint };
        });
      } else if (!problem.progressiveHints || problem.progressiveHints.length === 0) {
        // Provide fallback progressive hints if none exist
        updates.progressiveHints = [
          { type: 'conceptual', content: `Think about the core data structure or algorithm needed for ${problem.category}.` },
          { type: 'structural', content: `How can you iterate or recurse through the input to find the target?` },
          { type: 'pseudocode', content: `Initialize your tracking variables, then loop through the inputs updating your state.` }
        ];
      }

      // Migrate companyTags to new companies array
      if (problem.companyTags && problem.companyTags.length > 0 && (!problem.companies || problem.companies.length === 0)) {
        updates.companies = problem.companyTags.map(tag => ({
          name: tag,
          frequency: 'High',
          askCount: Math.floor(Math.random() * 50) + 10 // Fake ask count for existing data
        }));
      } else if (!problem.companies || problem.companies.length === 0) {
        updates.companies = [{
          name: 'Google',
          frequency: 'Medium',
          askCount: 15
        }];
      }

      // Add default global success rate if missing
      if (!problem.globalSuccessRate) {
        updates.globalSuccessRate = problem.acceptanceRate || (Math.floor(Math.random() * 40) + 30);
      }

      if (Object.keys(updates).length > 0) {
        await CodingProblem.findByIdAndUpdate(problem._id, updates);
        updatedCount++;
      }
    }

    console.log(`Successfully migrated ${updatedCount} problems.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedProgressiveHints();
