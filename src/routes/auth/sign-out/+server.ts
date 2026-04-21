import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		await auth.api.signOut({ headers: request.headers });
	} catch {
		// Cookie becomes stale anyway — still redirect
	}
	redirect(303, '/');
};
