import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from '$lib/server/auth.js';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';

const paraglideHandle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
		event.request = localizedRequest;
		return resolve(event, {
			preload: ({ type }) => type === 'js' || type === 'css' || type === 'font',
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale)),
		});
	});

const authHandle: Handle = async ({ event, resolve }) => {
	try {
		const sessionData = await auth.api.getSession({ headers: event.request.headers });
		event.locals.session = sessionData?.session ?? null;
		event.locals.user = sessionData?.user ?? null;
	} catch {
		event.locals.session = null;
		event.locals.user = null;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle = sequence(paraglideHandle, authHandle);

export const handleError: HandleServerError = ({ error, status }) => {
	if (status === 404) {
		return { message: 'Not found' };
	}
	console.error(error instanceof Error ? error.message : 'Unknown error');
	return { message: 'An unexpected error occurred' };
};
