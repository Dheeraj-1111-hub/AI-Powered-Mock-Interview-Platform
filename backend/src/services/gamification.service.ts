import User from '../models/User';
import IntelligenceEvent from '../models/IntelligenceEvent';

export const awardGamificationXP = async (userId: string, xpAmount: number, sourceEvent: 'interview_completed' | 'skill_improved' | 'streak_milestone', title: string, description: string) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // Add XP
        const currentXP = user.xp || 0;
        user.xp = currentXP + xpAmount;

        // Manage Streak
        const now = new Date();
        if (!user.lastActiveDate) {
            user.streak = 1;
        } else {
            const lastActive = new Date(user.lastActiveDate);
            const diffTime = Math.abs(now.getTime() - lastActive.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                user.streak += 1;
                // Award extra XP for streak continuation
                if (user.streak % 7 === 0) {
                    await createIntelligenceEvent(userId, 'streak_milestone', `7-Day Streak!`, `You've maintained your momentum for ${user.streak} days.`, 'achievement', 500);
                    user.xp += 500;
                }
            } else if (diffDays > 1) {
                user.streak = 1;
            }
        }
        user.lastActiveDate = now;

        // Save Activity
        if (sourceEvent) {
            await createIntelligenceEvent(userId, sourceEvent, title, description, 'insight', xpAmount);
        }

        // Check overall milestones (e.g., leveling up)
        const { calculateLevelFromXP, calculateXPForLevel } = require('../utils/leveling');
        const oldLevel = calculateLevelFromXP(currentXP);
        const newLevel = calculateLevelFromXP(user.xp);
        
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
