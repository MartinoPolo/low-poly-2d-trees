// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User, Session } from 'better-auth';

type AppUser = User & {
	avatarPreset?: string | null;
	avatarColor?: string | null;
};

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: AppUser | null;
			session: Session | null;
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
