// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User, Session } from 'better-auth';

type AppUser = User & {
	avatarPreset?: string | null;
	avatarColor?: string | null;
};

declare global {
	// Injected by vite.config.ts at build/dev time; holds the current git branch name.
	const __GIT_BRANCH__: string;

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
