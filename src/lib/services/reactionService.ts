import { db } from '../server/db.js';
import { characterInteractions } from '../schema/schema.js';
import { eq, desc } from 'drizzle-orm';

export async function listInteractions(characterId: string, limit = 50) {
  return await db
    .select()
    .from(characterInteractions)
    .where(eq(characterInteractions.characterId, characterId))
    .orderBy(desc(characterInteractions.createdAt))
    .limit(limit);
}

export const reactionService = {
  async processDivineReactions() { return []; },
  async processCompanionReactions() { return []; },
  listInteractions
};
