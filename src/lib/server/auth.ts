import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db.js';
import * as schema from '$lib/schema/schema.js';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications
		}
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8
	},
	session: {
		expiresIn: 60 * 60 * 24 * 30, // 30 days
		updateAge: 60 * 60 * 24 // Refresh if older than 1 day
	},
	trustedOrigins: [
		process.env.BETTER_AUTH_URL || 'http://localhost:5173',
		'http://localhost:5173',
		'http://localhost:5174'
	]
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
