import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import * as storage from '$lib/server/storage.js';
import { getRedis } from '$lib/server/redis.js';
import { refreshInterventionPower } from '$lib/server/divine.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { message } = await request.json();
	const character = await storage.getCharacterByUserId(locals.user.id);

	if (!character) return json({ error: 'Character not found' }, { status: 404 });

	const COST = 10;
    
    // Refresh power to account for time since last tick
    refreshInterventionPower(character);

	if (character.interventionPower.current < COST) {
		return json({ error: 'Insufficient Divine Power' }, { status: 400 });
	}

	// Update character power
	character.interventionPower.current -= COST;
	
    // Add message to divine queue
    await storage.addDivineMessage(character.id, message);
    
    // Log as system event so it shows in log immediately as "Whisper"
    await storage.addOfflineEvent(character.id, {
        type: 'system',
        message: `[божество] ${message}`
    });

	await storage.saveCharacter(character);

	const redis = getRedis();
	await redis.publish('ws:tick', JSON.stringify({
		type: 'tick',
		characterId: character.id,
		tickAt: Date.now(),
		stats: character.stats,
		interventionPower: character.interventionPower,
		adventureLog: [`[божество] ${message}`],
		combatLog: []
	}));

	return json({ 
		success: true, 
		interventionPower: character.interventionPower
	});
};
