import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	entry: ['src/hooks.ts', 'src/lib/auth-client.ts'],
	project: ['src/**/*.{ts,svelte}'],
	ignoreDependencies: [
		'@typescript-eslint/parser',
		'@node-rs/argon2',
		'tailwindcss',
		'vitest-browser-svelte',
	],
};

export default config;
