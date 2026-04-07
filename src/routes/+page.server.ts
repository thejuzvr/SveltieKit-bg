import type { PageServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { getCharacterByUserId } from '$lib/server/storage.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { user: null, hasCharacter: false };
	}

	const character = await getCharacterByUserId(locals.user.id);

	if (character) {
		redirect(302, '/character');
	}

	return {
		user: locals.user,
		hasCharacter: false
	};
};
