import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getCharacterByUserId, getOfflineEvents } from '$lib/server/storage.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const character = await getCharacterByUserId(locals.user.id);
	if (!character) return json({ error: 'Character not found' }, { status: 404 });

	const limitStr = url.searchParams.get('limit') || '150';
	const limit = Math.min(300, Math.max(10, parseInt(limitStr, 10) || 150));

	const events = await getOfflineEvents(character.id, limit);

	return json({ 
		events: events.map(e => ({
			id: e.id,
			type: e.type,
			message: e.message,
			timestamp: e.timestamp,
			isRead: e.isRead
		}))
	});
};
