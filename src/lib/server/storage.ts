import { db } from './db.js';
import { characters, offlineEvents, chronicle, divineMessages, characterInteractions } from '$lib/schema/schema.js';
import { eq, desc, and, lte, sql } from 'drizzle-orm';
import type { Character } from '$lib/types/character.js';

// ─── Characters ──────────────────────────────────────────────────────────────

export async function getAllActiveCharacters(): Promise<Character[]> {
	const rows = await db
		.select()
		.from(characters)
		.where(eq(characters.isActive, true));

	return rows.map(dbToCharacter);
}

export async function getCharacterById(id: string): Promise<Character | null> {
	const [row] = await db
		.select()
		.from(characters)
		.where(eq(characters.id, id))
		.limit(1);

	return row ? dbToCharacter(row) : null;
}

export async function getCharacterByUserId(userId: string): Promise<Character | null> {
	const [row] = await db
		.select()
		.from(characters)
		.where(eq(characters.userId, userId))
		.limit(1);

	return row ? dbToCharacter(row) : null;
}

export async function saveCharacter(character: Character): Promise<void> {
	const now = Date.now();
	await db
		.update(characters)
		.set({
			...characterToDb(character),
			lastUpdatedAt: now
		})
		.where(eq(characters.id, character.id));
}

export async function updateCharacterLastProcessed(id: string, timestamp: number): Promise<void> {
	await db
		.update(characters)
		.set({ lastProcessedAt: timestamp })
		.where(eq(characters.id, id));
}

// ─── Divine Messages ──────────────────────────────────────────────────────────

export async function addDivineMessage(characterId: string, text: string) {
	const [row] = await db
		.insert(divineMessages)
		.values({
			characterId,
			text,
			createdAt: Date.now(),
			processedAt: null
		})
		.returning();
	return row;
}

export async function getPendingDivineMessages(characterId: string, limit: number = 5) {
	return await db
		.select()
		.from(divineMessages)
		.where(
			and(
				eq(divineMessages.characterId, characterId),
				sql`${divineMessages.processedAt} IS NULL`
			)
		)
		.orderBy(desc(divineMessages.createdAt))
		.limit(limit);
}

export async function markDivineMessageProcessed(id: string) {
	await db
		.update(divineMessages)
		.set({ processedAt: Date.now() })
		.where(eq(divineMessages.id, id));
}

export async function createCharacter(character: any, userId: string): Promise<void> {
	await db.insert(characters).values({
		...characterToDb(character),
		id: character.id,
		userId,
		createdAt: character.createdAt || Date.now(),
		lastUpdatedAt: character.lastUpdatedAt || Date.now(),
		lastProcessedAt: Date.now(),
		isActive: true,
		hasSeenWelcomeMessage: false
	} as any);
}

// ─── Offline Events ──────────────────────────────────────────────────────────

export async function addOfflineEvent(
	characterId: string,
	event: {
		type: string;
		message: string;
		data?: Record<string, unknown>;
		timestamp?: number;
	}
): Promise<void> {
	await db.insert(offlineEvents).values({
		characterId,
		realmId: 'global',
		timestamp: event.timestamp ?? Date.now(),
		type: event.type,
		message: event.message,
		data: event.data ?? {},
		isRead: false
	});
}

export async function getOfflineEvents(
	characterId: string,
	limit = 50,
	onlyUnread = false
) {
	const conditions = [eq(offlineEvents.characterId, characterId)];
	if (onlyUnread) conditions.push(eq(offlineEvents.isRead, false));

	return db
		.select()
		.from(offlineEvents)
		.where(and(...conditions))
		.orderBy(desc(offlineEvents.timestamp))
		.limit(limit);
}

export async function markEventsRead(characterId: string): Promise<void> {
	await db
		.update(offlineEvents)
		.set({ isRead: true })
		.where(eq(offlineEvents.characterId, characterId));
}

export async function cleanupOldEvents(characterId: string): Promise<void> {
	// Delete read events older than 24 hours
	const cutoff = Date.now() - 24 * 60 * 60 * 1000;
	await db
		.delete(offlineEvents)
		.where(
			and(
				eq(offlineEvents.characterId, characterId),
				eq(offlineEvents.isRead, true),
				lte(offlineEvents.timestamp, cutoff)
			)
		);
}

// ─── Chronicle ───────────────────────────────────────────────────────────────

export async function addChronicleEntry(entry: {
	characterId: string;
	type: string;
	title: string;
	description: string;
	icon: string;
	data?: Record<string, unknown>;
}): Promise<void> {
	await db.insert(chronicle).values({
		characterId: entry.characterId,
		realmId: 'global',
		timestamp: Date.now(),
		type: entry.type,
		title: entry.title,
		description: entry.description,
		icon: entry.icon,
		data: entry.data ?? {}
	});
}

export async function getChronicle(characterId: string, limit = 20) {
	return db
		.select()
		.from(chronicle)
		.where(eq(chronicle.characterId, characterId))
		.orderBy(desc(chronicle.timestamp))
		.limit(limit);
}

// ─── Internal Mappers ────────────────────────────────────────────────────────

function dbToCharacter(row: any): Character {
	return {
		id: row.id,
		name: row.name,
		gender: row.gender,
		race: row.race,
		backstory: row.backstory,
		patronDeity: row.patronDeity as Character['patronDeity'],
		level: row.level,
		xp: row.xp as Character['xp'],
		stats: row.stats as Character['stats'],
		attributes: row.attributes as Character['attributes'],
		skills: row.skills as Character['skills'],
		points: row.points as Character['points'],
		location: row.location,
		status: row.status as Character['status'],
		inventory: (row.inventory as Character['inventory']) || [],
		equippedItems: (row.equippedItems as Record<string, string>) || {},
		factions: (row.factions as Record<string, { reputation: number }>) || {},
		combat: row.combat as Character['combat'],
		sleepUntil: row.sleepUntil ? Number(row.sleepUntil) : null,
		respawnAt: row.respawnAt ? Number(row.respawnAt) : null,
		deathOccurredAt: row.deathOccurredAt ? Number(row.deathOccurredAt) : null,
		activeSovngardeQuest: row.activeSovngardeQuest as Character['activeSovngardeQuest'],
		activeCryptQuest: row.activeCryptQuest as Character['activeCryptQuest'],
		currentAction: row.currentAction as Character['currentAction'],
		createdAt: Number(row.createdAt),
		lastUpdatedAt: Number(row.lastUpdatedAt),
		deaths: row.deaths,
		effects: (row.effects as Character['effects']) || [],
		knownSpells: (row.knownSpells as string[]) || [],
		interventionPower: row.interventionPower as Character['interventionPower'],
		divineSuggestion: row.divineSuggestion,
		divineDestinationId: row.divineDestinationId,
		pendingTravel: row.pendingTravel as Character['pendingTravel'],
		completedQuests: (row.completedQuests as string[]) || [],
		season: row.season as Character['season'],
		weather: row.weather as Character['weather'],
		timeOfDay: row.timeOfDay as Character['timeOfDay'],
		actionCooldowns: (row.actionCooldowns as Record<string, number>) || {},
		visitedLocations: (row.visitedLocations as string[]) || [],
		gameDate: Number(row.gameDate),
		mood: row.mood,
		analytics: (row.analytics as Character['analytics']) || {
			killedEnemies: {},
			diceRolls: { d20: [] },
			encounteredEnemies: [],
			epicPhrases: []
		},
		divineFavor: row.divineFavor,
		templeProgress: row.templeProgress,
		templeCompletedFor: row.templeCompletedFor as Character['templeCompletedFor'],
		relationships: (row.relationships as Character['relationships']) || {},
		actionHistory: (row.actionHistory as Character['actionHistory']) || [],
		hasSeenWelcomeMessage: row.hasSeenWelcomeMessage,
		companions: (row.companions as string[]) || [],
		activeCompanion: row.activeCompanion ?? null
	};
}

function characterToDb(char: Character): any {
	return {
		name: char.name,
		gender: char.gender,
		race: char.race,
		backstory: char.backstory,
		patronDeity: char.patronDeity,
		level: char.level,
		xp: char.xp,
		stats: char.stats,
		attributes: char.attributes,
		skills: char.skills,
		points: char.points,
		location: char.location,
		status: char.status,
		inventory: char.inventory,
		equippedItems: char.equippedItems as Record<string, string>,
		factions: char.factions as Record<string, { reputation: number }>,
		combat: char.combat,
		sleepUntil: char.sleepUntil,
		respawnAt: char.respawnAt,
		deathOccurredAt: char.deathOccurredAt,
		activeSovngardeQuest: char.activeSovngardeQuest,
		activeCryptQuest: char.activeCryptQuest,
		currentAction: char.currentAction,
		deaths: char.deaths,
		effects: char.effects,
		knownSpells: char.knownSpells ?? [],
		interventionPower: char.interventionPower,
		divineSuggestion: char.divineSuggestion,
		divineDestinationId: char.divineDestinationId,
		pendingTravel: char.pendingTravel,
		completedQuests: char.completedQuests,
		season: char.season,
		weather: char.weather,
		timeOfDay: char.timeOfDay,
		actionCooldowns: char.actionCooldowns as Record<string, number>,
		visitedLocations: char.visitedLocations,
		gameDate: char.gameDate,
		mood: char.mood,
		analytics: char.analytics,
		divineFavor: char.divineFavor,
		templeProgress: char.templeProgress,
		templeCompletedFor: char.templeCompletedFor,
		relationships: char.relationships,
		actionHistory: char.actionHistory,
		hasSeenWelcomeMessage: char.hasSeenWelcomeMessage ?? false,
		companions: char.companions ?? [],
		activeCompanion: char.activeCompanion ?? null
	};
}
