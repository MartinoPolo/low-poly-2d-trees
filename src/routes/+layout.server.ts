import { SIDEBAR_COOKIE_NAME } from '$lib/components/ui/sidebar/constants.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = ({ locals, cookies }) => {
	const sidebarCookie = cookies.get(SIDEBAR_COOKIE_NAME);
	return {
		sidebarOpen: sidebarCookie !== 'false',
		user: locals.user
			? {
					id: locals.user.id,
					name: locals.user.name,
					email: locals.user.email,
					image: locals.user.image ?? null,
					avatarPreset: locals.user.avatarPreset ?? null,
					avatarColor: locals.user.avatarColor ?? null,
				}
			: null,
	};
};
