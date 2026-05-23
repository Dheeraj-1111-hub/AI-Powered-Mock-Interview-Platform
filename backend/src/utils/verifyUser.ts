import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hireiq';

const verifyAllUsers = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const result = await User.updateMany({}, { $set: { isEmailVerified: true } });
    console.log(`Successfully verified ${result.modifiedCount} users.`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed to verify users:', err);
    process.exit(1);
  }
};

verifyAllUsers();
