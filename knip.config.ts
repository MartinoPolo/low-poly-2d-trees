import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	entry: ['src/hooks.ts', 'src/lib/components/ui/*/index.ts', 'src/lib/trees/assets/*/index.ts'],
	project: ['src/**/*.{ts,svelte}'],
	ignoreBinaries: ['tsx'],
	ignoreDependencies: [
		'@typescript-eslint/parser',
		'@node-rs/argon2',
		'shadcn-svelte',
		'tw-animate-css',
		'vitest-browser-svelte',
	],
	// Phase 1 (#95) cross-phase contract: exports consumed by Phase 2 (#96).
	// TODO(#96): Remove these ignores when Phase 2 consumes the exports.
	rules: {
		exports: 'warn',
	},
	tags: ['-knipignore'],
};

export default config;
