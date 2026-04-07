import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createCharacter, getCharacterByUserId } from '$lib/server/storage.js';
import { scheduleCharacterTick } from '$lib/server/worker.js';
import type { Character } from '$lib/types/character.js';

// TES Starting locations by race
const RACE_START_LOCATIONS: Record<string, string> = {
	nord: 'whiterun',
	imperial: 'whiterun',
	dunmer: 'windhelm',
	altmer: 'winterhold',
	argonian: 'riften',
	khajiit: 'riften',
	bosmer: 'falkreath',
	orsimer: 'markarth',
	redguard: 'markarth',
	breton: 'solitude'
};

// Starting stats by race
const RACE_STATS: Record<string, { health: number; magicka: number; stamina: number }> = {
	nord:     { health: 120, magicka: 80,  stamina: 100 },
	imperial: { health: 100, magicka: 100, stamina: 100 },
	dunmer:   { health: 100, magicka: 120, stamina: 80  },
	altmer:   { health: 80,  magicka: 150, stamina: 70  },
	argonian: { health: 110, magicka: 90,  stamina: 100 },
	khajiit:  { health: 100, magicka: 90,  stamina: 110 },
	bosmer:   { health: 90,  magicka: 100, stamina: 110 },
	orsimer:  { health: 130, magicka: 70,  stamina: 100 },
	redguard: { health: 120, magicka: 80,  stamina: 100 },
	breton:   { health: 100, magicka: 130, stamina: 70  }
};

function createStartingCharacter(
	userId: string,
	name: string,
	gender: string,
	race: string,
	patronDeity: string,
	backstory: string
): Character {
	const baseStats = RACE_STATS[race] || RACE_STATS.nord;
	const startLocation = RACE_START_LOCATIONS[race] || 'whiterun';
	const now = Date.now();

	return {
		id: userId, // Character ID = User ID (one character per user)
		name,
		gender,
		race,
		backstory,
		patronDeity: patronDeity as Character['patronDeity'],
		level: 1,
		xp: { current: 0, required: 100 },
		stats: {
			health: { current: baseStats.health, max: baseStats.health },
			magicka: { current: baseStats.magicka, max: baseStats.magicka },
			stamina: { current: baseStats.stamina, max: baseStats.stamina },
			fatigue: { current: 100, max: 100 }
		},
		attributes: {
			strength: 10,
			agility: 10,
			intelligence: 10,
			endurance: 10
		},
		skills: {
			oneHanded: 15,
			block: 10,
			heavyArmor: 10,
			lightArmor: 10,
			persuasion: 10,
			alchemy: 10
		},
		points: { attribute: 0, skill: 0 },
		location: startLocation,
		status: 'idle',
		inventory: [
			{ id: 'gold', name: 'Gold Septim', type: 'gold', quantity: 50, weight: 0.003 }
		],
		equippedItems: {},
		factions: {},
		combat: null,
		sleepUntil: null,
		respawnAt: null,
		deathOccurredAt: null,
		activeSovngardeQuest: null,
		activeCryptQuest: null,
		currentAction: null,
		createdAt: now,
		lastUpdatedAt: now,
		deaths: 0,
		effects: [],
		knownSpells: [],
		interventionPower: { current: 50, max: 100, lastRegenAt: now },
		divineSuggestion: null,
		divineDestinationId: null,
		pendingTravel: null,
		completedQuests: [],
		season: 'Summer',
		weather: 'Clear',
		timeOfDay: 'morning',
		actionCooldowns: {},
		visitedLocations: [startLocation],
		gameDate: now,
		mood: 50,
		analytics: {
			killedEnemies: {},
			diceRolls: { d20: [] },
			encounteredEnemies: [],
			epicPhrases: []
		},
		divineFavor: 0,
		templeProgress: 0,
		templeCompletedFor: null,
		relationships: {},
		actionHistory: [],
		hasSeenWelcomeMessage: false,
		companions: [],
		activeCompanion: null
	};
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const character = await getCharacterByUserId(locals.user.id);
	if (!character) return json({ error: 'Not found' }, { status: 404 });

	return json({ character });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	// Check if character already exists
	const existing = await getCharacterByUserId(locals.user.id);
	if (existing) return json({ error: 'Character already exists' }, { status: 409 });

	const body = await request.json();
	const { name, gender, race, patronDeity, backstory } = body;

	// Validation
	if (!name?.trim() || name.trim().length < 2 || name.trim().length > 30) {
		return json({ error: 'Name must be 2-30 characters' }, { status: 400 });
	}

	const character = createStartingCharacter(
		locals.user.id,
		name.trim(),
		gender || 'male',
		race || 'nord',
		patronDeity || 'talos',
		backstory || ''
	);

	await createCharacter(character, locals.user.id);

	// Schedule first game tick
	await scheduleCharacterTick(character.id, 5000);

	return json({ character, success: true }, { status: 201 });
};
