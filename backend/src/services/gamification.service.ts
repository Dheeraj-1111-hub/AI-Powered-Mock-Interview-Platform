import User from '../models/User';
import IntelligenceEvent from '../models/IntelligenceEvent';
import ActivityLog from '../models/ActivityLog';

export const awardGamificationXP = async (userId: string, xpAmount: number, sourceEvent: 'interview_completed' | 'skill_improved' | 'streak_milestone', title: string, description: string) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // --- Phase 1: EVENT SOURCED XP & STREAK ---
        // 1. Calculate Current XP dynamically from ActivityLog
        const logs = await ActivityLog.find({ user: userId }).sort({ timestamp: -1 }).lean();
        const currentXP = logs.reduce((sum: number, log: any) => sum + (log.xpAwarded || 0), 0);
        let newTotalXP = currentXP + xpAmount;

        // 2. Calculate Current Streak dynamically from ActivityLog
        const allDates = logs
            .map((log: any) => new Date(log.timestamp).toISOString().split('T')[0])
            .sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
        
        const uniqueDates = Array.from(new Set(allDates));
        let currentStreak = 0;
        let currentDate = new Date();
        
        for (const dateStr of uniqueDates) {
            const d = new Date(dateStr);
            const diffTime = Math.abs(currentDate.getTime() - d.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays <= 1) {
                currentStreak++;
                currentDate = d;
            } else {
                break;
            }
        }

        // Award extra XP for streak continuation
        if (currentStreak > 1 && currentStreak % 7 === 0) {
            await createIntelligenceEvent(userId, 'streak_milestone', `7-Day Streak!`, `You've maintained your momentum for ${currentStreak} days.`, 'achievement', 500);
            newTotalXP += 500;
        }

        // Save Activity
        if (sourceEvent) {
            await createIntelligenceEvent(userId, sourceEvent, title, description, 'insight', xpAmount);
        }

        // Check overall milestones (e.g., leveling up)
        const { calculateLevelFromXP, calculateXPForLevel } = require('../utils/leveling');
        const oldLevel = calculateLevelFromXP(currentXP);
        const newLevel = calculateLevelFromXP(newTotalXP);
        
        if (newLevel > oldLevel) {
            await createIntelligenceEvent(
                userId, 
                'streak_milestone', 
                `Level Up: Rank ${newLevel}`, 
                `You surpassed ${calculateXPForLevel(newLevel)} XP and unlocked a new intelligence tier.`, 
                'milestone', 
                0
            );
        }
        
        user.lastActiveDate = new Date();
        await user.save();
        return user;
    } catch (err) {
        console.error('[GAMIFICATION] XP Update Error:', err);
    }
};

const createIntelligenceEvent = async (userId: string, type: string, title: string, description: string, severity: string, xpEarned: number) => {
    await IntelligenceEvent.create({
        user: userId,
        type,
        title,
        description,
        severity,
        metadata: { xpEarned }
    });
};
