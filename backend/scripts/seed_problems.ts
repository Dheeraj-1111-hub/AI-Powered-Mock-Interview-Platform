import mongoose from 'mongoose';
import CodingProblem from '../src/models/CodingProblem';
import dotenv from 'dotenv';
import { top40Problems } from './top40';

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to DB');
    
    await CodingProblem.deleteMany({});
    await CodingProblem.insertMany(top40Problems);
    
    console.log('Problems seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
