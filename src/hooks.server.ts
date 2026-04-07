import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from '$lib/server/auth.js';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';

const paraglide_handle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request: localized_request, locale }) => {
		event.request = localized_request;
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale)),
		});
	});

const auth_handle: Handle = async ({ event, resolve }) => {
	const session_data = await auth.api.getSession({ headers: event.request.headers });

	if (session_data) {
		event.locals.session = session_data.session;
		event.locals.user = session_data.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle = sequence(paraglide_handle, auth_handle);
