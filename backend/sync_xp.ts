import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User';
import Interview from './src/models/Interview';
import CodingSubmission from './src/models/CodingSubmission';
import { awardGamificationXP } from './src/services/gamification.service';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hireiq';

async function syncXP() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const users = await User.find();
    for (const user of users) {
        console.log(`Processing User: ${user.email}`);
        
        // Reset XP
        user.xp = 0;
        await user.save();

        // 1. Process Interviews
        const interviews = await Interview.find({ user: user._id, status: 'completed' });
        for (const interview of interviews) {
            const xp = (interview.overallScore || 0) * 10;
            if (xp > 0) {
                console.log(`Awarding ${xp} XP for Interview ${interview._id}`);
                await awardGamificationXP(
                    user._id.toString(), 
                    xp, 
                    'interview_completed', 
                    `${interview.role} Mock Interview`, 
                    `Completed simulation with a score of ${interview.overallScore}/100.`
                );
            }
        }

        // 2. Process Coding Submissions
        const codings = await CodingSubmission.find({ user: user._id, status: /accepted/i });
        for (const coding of codings) {
            console.log(`Awarding 150 XP for Coding ${coding._id}`);
            await awardGamificationXP(
                user._id.toString(), 
                150, 
                'skill_improved', 
                `Code Challenge Solved`, 
                `Successfully executed ${coding.language} code with optimal performance.`
            );
        }
        
        const updated = await User.findById(user._id);
        console.log(`Final XP for ${user.email}: ${updated?.xp}`);
    }

    console.log('Sync Complete.');
    process.exit(0);
}

syncXP().catch(console.error);
