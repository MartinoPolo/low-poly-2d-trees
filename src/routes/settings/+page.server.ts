import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/auth/sign-in');
	}

	return {
		avatarPreset: locals.user.avatarPreset ?? null,
		avatarColor: locals.user.avatarColor ?? null,
	};
};
