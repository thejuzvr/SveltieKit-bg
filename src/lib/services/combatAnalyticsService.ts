export interface CombatAnalyticsData {
    characterId: string;
    enemyId: string;
    enemyName: string;
    enemyLevel: number;
    victory: boolean;
    fled: boolean;
    characterLevel: number;
    characterHealthStart: number;
    characterHealthEnd: number;
    enemyHealthStart: number;
    roundsCount: number;
    damageDealt: number;
    damageTaken: number;
    xpGained: number;
    combatLog: string[];
}

export const saveCombatAnalytics = async (data: CombatAnalyticsData) => {
    // Implementation placeholder - in a real app, this would save to a database or analytics provider
    return { success: true };
};
