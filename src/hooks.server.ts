import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { startGameWorker } from '$lib/server/worker';
import type { Handle } from '@sveltejs/kit';

// Start the game worker on server startup (not during build)
if (!building) {
	startGameWorker().catch((err) => {
		console.error('[Hooks] Failed to start GameWorker:', err);
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	// Let Better-Auth handle auth-specific paths
	if (event.url.pathname.startsWith('/api/auth')) {
		return svelteKitHandler({ event, resolve, auth, building });
	}

	// Attach session to locals for use in routes
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.user = (session?.user as any) ?? null;
	event.locals.session = (session?.session as any) ?? null;

	return resolve(event);
};
