import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import svelteConfig from './svelte.config.js';

export default [
	{
		ignores: [
			'.svelte-kit',
			'.storybook',
			'build',
			'node_modules',
			'src/lib/paraglide',
			'**/*.config.*',
			'*.d.ts',
		],
	},
	...tseslint.configs.recommended,
	...storybook.configs['flat/recommended'],
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				extraFileExtensions: ['.svelte'],
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			// typescript-eslint recommends disabling no-undef for TS projects
			// https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			// Gap rules not covered by OxLint
			'@typescript-eslint/strict-boolean-expressions': 'error',
			'@typescript-eslint/switch-exhaustiveness-check': [
				'error',
				{ considerDefaultExhaustiveForUnions: true },
			],
			'@typescript-eslint/require-array-sort-compare': 'error',
			'@typescript-eslint/naming-convention': [
				'warn',
				{
					selector: 'variableLike',
					format: ['snake_case', 'PascalCase'],
					leadingUnderscore: 'allow',
				},
				{
					selector: 'variable',
					format: ['UPPER_CASE', 'snake_case', 'PascalCase'],
					modifiers: ['global', 'const'],
					leadingUnderscore: 'allow',
				},
				{
					selector: 'typeLike',
					format: ['PascalCase'],
				},
			],
			'@typescript-eslint/consistent-type-definitions': 'warn',
			'@typescript-eslint/consistent-type-imports': [
				'warn',
				{ fixStyle: 'inline-type-imports' },
			],
			'@typescript-eslint/no-import-type-side-effects': 'warn',
		},
	},
	...sveltePlugin.configs['flat/recommended'],
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: '@typescript-eslint/parser',
				extraFileExtensions: ['.svelte'],
				project: true,
				svelteConfig,
				svelteFeatures: {
					experimentalGenerics: true,
				},
			},
		},
	},
];
