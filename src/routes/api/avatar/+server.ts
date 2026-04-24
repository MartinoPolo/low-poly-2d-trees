import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { user } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { isValidPreset, isValidColor } from '$lib/avatar/presets.js';
import type { RequestHandler } from './$types.js';

export const PATCH: RequestHandler = async ({ locals, request, cookies }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const body: unknown = await request.json();

	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		error(400, 'Invalid request body');
	}

	const { avatarPreset, avatarColor } = body as Record<string, unknown>;
	const updates: { avatarPreset?: string; avatarColor?: string } = {};

	if (avatarPreset !== undefined) {
		if (typeof avatarPreset !== 'string' || !isValidPreset(avatarPreset)) {
			error(400, 'Invalid avatar preset');
		}
		updates.avatarPreset = avatarPreset;
	}

	if (avatarColor !== undefined) {
		if (typeof avatarColor !== 'string' || !isValidColor(avatarColor)) {
			error(400, 'Invalid avatar color');
		}
		updates.avatarColor = avatarColor;
	}

	if (Object.keys(updates).length === 0) {
		error(400, 'No fields to update');
	}

	await db.update(user).set(updates).where(eq(user.id, locals.user.id));

	cookies.delete('better-auth.session_data', { path: '/' });

	return json({ success: true });
};
