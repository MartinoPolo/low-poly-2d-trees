import { resolve } from '$app/paths';
import type { PathnameWithSearchOrHash } from '$app/types';
import { localizeHref } from '$lib/paraglide/runtime.js';

/**
 * Resolves a route path with both locale prefix (via Paraglide) and base path (via SvelteKit).
 * Use this instead of bare `resolve()` for all navigation hrefs and goto() calls.
 */
export function localizedResolve(path: PathnameWithSearchOrHash): string {
	return (resolve as (path: string) => string)(localizeHref(path));
}
