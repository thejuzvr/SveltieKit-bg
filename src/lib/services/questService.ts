import { db } from '../server/db.js';
import { characterInteractions } from '../schema/schema.js';
import { eq } from 'drizzle-orm';

// Quest related
export const getQuestsByLocation = async () => [];
export const getQuest = async (id: string) => null;
export const completeQuest = async (id: string) => {};
export const failQuest = async (id: string) => {};
export const applyRewardsToCharacter = async (char: any, rewards: any) => ({ character: char, log: '' });
export const setTaskStatus = async (taskId: string, status: string, progress: number) => {};
export const autoSelectNextQuest = async (charId: string) => ({ ok: false, quest: null });

// Reaction related
export const listInteractions = async (characterId: string, limit: number = 5) => {
    try {
        return await db.select().from(characterInteractions).where(eq(characterInteractions.characterId, characterId)).limit(limit);
    } catch {
        return [];
    }
};
export const recordInteraction = async (interaction: any) => {
    try {
        return await db.insert(characterInteractions).values(interaction);
    } catch {}
};

// Achievement related
export const evaluateAchievements = (char: any, data: any) => [];
export const persistAchievementUnlocks = async (userId: string, char: any, unlocks: any) => {};

// Other stubs for game-engine
export const getAllThoughts = async () => [];
export const decreaseLocationDanger = async (locationId: string, amount: number) => 0;

export const getActiveQuest = async (charId: string) => null;
export const setActiveQuest = async (charId: string, questId: string) => {};
export const listInProgressQuests = async (charId: string) => [];
export const selectQuestTemplatesForCharacter = async (char: any) => [];
export const createQuestFromTemplate = async (char: any, template: any, accept: boolean) => null;
export const acceptQuest = async (questId: string, setAsActive: boolean) => ({ ok: true });
export const updateQuestProgress = async (questId: string, progress: number) => {};
