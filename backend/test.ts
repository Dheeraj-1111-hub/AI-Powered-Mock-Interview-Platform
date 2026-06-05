import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './src/models/User';
import { computeCareerIntelligence } from './src/services/careerIntelligence/readinessEngine';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://dheeraj:dheeraj1111@hireiq.zxtig.mongodb.net/HireIQ?retryWrites=true&w=majority&appName=HireIQ');
        
        let user = await User.findOne().sort({ createdAt: -1 });
        if (!user) {
            console.log("No user found");
            process.exit(1);
        }
        
        console.log("Found user:", user._id);
        const intelligence = await computeCareerIntelligence(user._id.toString());
        console.log("Intelligence computed successfully");
        
        await User.findByIdAndUpdate(user._id, {
            interviewReadinessScore: intelligence.readiness.overall,
            careerState: intelligence.careerState,
            readinessLastComputed: new Date(),
            behavioralTelemetry: intelligence.behavioralTelemetry,
            archetype: intelligence.archetype,
            growthVelocity: intelligence.growthVelocity,
            $push: { trophies: { $each: intelligence.newTrophies } }
        });
        console.log("User updated successfully");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}
run();
