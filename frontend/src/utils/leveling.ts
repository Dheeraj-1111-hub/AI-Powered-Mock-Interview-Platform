export const calculateLevelFromXP = (xp: number): number => {
    return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
};

export const calculateXPForLevel = (level: number): number => {
    if (level <= 1) return 0;
    return Math.pow(level - 1, 2) * 100;
};
