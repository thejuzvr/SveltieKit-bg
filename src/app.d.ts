// See https://svelte.dev/docs/kit/types#app.d.ts
import type { User, Session } from '$lib/server/auth.js';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			session: Session | null;
		}
		interface PageData {
			user?: User | null;
		}
	}
}

export {};
