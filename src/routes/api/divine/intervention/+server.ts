import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import * as storage from '$lib/server/storage.js';
import { getRedis } from '$lib/server/redis.js';
import { refreshInterventionPower } from '$lib/server/divine.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { type } = await request.json();
	const character = await storage.getCharacterByUserId(locals.user.id);

	if (!character) return json({ error: 'Character not found' }, { status: 404 });

	const COST = 20;
    
    // Refresh power to account for time since last tick
    refreshInterventionPower(character);

	if (character.interventionPower.current < COST) {
		return json({ error: 'Insufficient Divine Power' }, { status: 400 });
	}

	// Update character
	character.interventionPower.current -= COST;
	
	// Add effect/action
	if (type === 'bless') {
		character.stats.health.current = Math.min(character.stats.health.max, character.stats.health.current + 20);
		await storage.addOfflineEvent(character.id, {
			type: 'system',
			message: 'Божественное сияние окутывает героя, исцеляя раны.'
		});
	} else if (type === 'punish') {
		character.stats.health.current = Math.max(1, character.stats.health.current - 15);
		await storage.addOfflineEvent(character.id, {
			type: 'system',
			message: 'Громовой разряд с небес поражает героя. Видимо, боги гневаются.'
		});
	}

	await storage.saveCharacter(character);

	const redis = getRedis();
	await redis.publish('ws:tick', JSON.stringify({
		type: 'tick',
		characterId: character.id,
		tickAt: Date.now(),
		stats: character.stats,
		interventionPower: character.interventionPower,
		adventureLog: [type === 'bless' ? 'Божественное сияние окутывает героя, исцеляя раны.' : 'Громовой разряд с небес поражает героя. Видимо, боги гневаются.'],
		combatLog: []
	}));

	return json({ 
		success: true, 
		interventionPower: character.interventionPower,
		stats: character.stats
	});
};
