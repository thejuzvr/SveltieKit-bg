import type { PageServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { getCharacterByUserId, getOfflineEvents } from '$lib/server/storage.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/auth/login');

	const character = await getCharacterByUserId(locals.user.id);

	if (!character) redirect(302, '/character/create');

	// Get recent offline events (last 30)
	const offlineEvents = await getOfflineEvents(character.id, 30);

	return {
		user: locals.user,
		character,
		offlineEvents: offlineEvents.map(e => ({
			id: e.id,
			type: e.type,
			message: e.message,
			timestamp: Number(e.timestamp),
			isRead: e.isRead
		}))
	};
};
