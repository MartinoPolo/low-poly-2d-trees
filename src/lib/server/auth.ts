import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { passkey } from '@better-auth/passkey';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from './db/index.js';
import * as schema from './db/schema.js';

if (env.AUTH_SECRET === undefined || env.AUTH_SECRET === '') {
	throw new Error('AUTH_SECRET environment variable is required');
}

const ORIGIN = env.ORIGIN ?? 'http://localhost:5173';
const RP_ID = new URL(ORIGIN).hostname;

function buildSocialProvider<Name extends string>(
	name: Name,
	clientId: string | undefined,
	clientSecret: string | undefined,
): Record<Name, { clientId: string; clientSecret: string }> | Record<string, never> {
	if (
		clientId === undefined ||
		clientId === '' ||
		clientSecret === undefined ||
		clientSecret === ''
	) {
		return {};
	}
	return { [name]: { clientId, clientSecret } } as Record<
		Name,
		{ clientId: string; clientSecret: string }
	>;
}

export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: env.AUTH_SECRET,

	database: drizzleAdapter(db, { provider: 'pg', schema }),

	socialProviders: {
		...buildSocialProvider('google', env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET),
		...buildSocialProvider('github', env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET),
	},

	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},

	plugins: [
		passkey({
			rpID: RP_ID,
			rpName: 'Low-Poly 2D Trees',
			origin: ORIGIN,
		}),
		sveltekitCookies(getRequestEvent), // must be last
	],
});
