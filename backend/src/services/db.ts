import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hireiq';

export async function connectDatabase() {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log('Connected to MongoDB');
}
