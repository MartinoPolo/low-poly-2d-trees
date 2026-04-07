// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User, Session } from 'better-auth/minimal';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: User;
			session?: Session;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
