import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { getCharacterByUserId, getOfflineEvents } from '$lib/server/storage.js';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Root paths allowed without character
	const publicPaths = ['/', '/auth/login', '/auth/register'];
	const isPublic = publicPaths.includes(url.pathname);

	if (!locals.user) {
		if (!isPublic) redirect(302, '/auth/login');
		return { user: null, character: null };
	}

	const character = await getCharacterByUserId(locals.user.id);
	
	if (!character && !url.pathname.startsWith('/character/create') && !isPublic) {
		redirect(302, '/character/create');
	}

	const offlineEvents = character ? await getOfflineEvents(character.id, 50) : [];

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
