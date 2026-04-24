import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	entry: [
		'src/hooks.ts',
		'src/lib/index.ts',
		'src/lib/components/ui/*/index.ts',
		'src/lib/trees/assets/*/index.ts',
	],
	project: ['src/**/*.{ts,svelte}'],
	ignoreBinaries: ['tsx'],
	ignoreDependencies: [
		'@typescript-eslint/parser',
		'@node-rs/argon2',
		'shadcn-svelte',
		'tw-animate-css',
		'vitest-browser-svelte',
	],
	tags: ['-knipignore'],
};

export default config;
