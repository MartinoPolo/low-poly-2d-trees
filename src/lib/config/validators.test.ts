import { describe, expect, it } from 'vitest';
import {
	isValidTreeConfig,
	isValidSceneConfig,
	isValidEnvironmentConfig,
	isValidEditorViewState,
	migrateStageValue,
} from './validators/index.js';
import { DEFAULT_TREE_CONFIG } from '$lib/trees/types.js';
import { SCENE_DEFAULTS } from '$lib/scene/scene_config.js';
import { ENVIRONMENT_DEFAULTS } from '$lib/environment/environment_config.js';
import { EDITOR_VIEW_DEFAULTS } from '$lib/config/editor_view_state.js';

describe('isValidTreeConfig', () => {
	it('accepts DEFAULT_TREE_CONFIG', () => {
		expect(isValidTreeConfig(DEFAULT_TREE_CONFIG)).toBe(true);
	});

	it('accepts DEFAULT_TREE_CONFIG with customBlobs', () => {
		expect(
			isValidTreeConfig({
				...DEFAULT_TREE_CONFIG,
				customBlobs: [{ size: 1, x: 0, y: 0, rotation: 0, boundaryKind: 'circle' }],
			}),
		).toBe(true);
	});

	it('rejects null', () => {
		expect(isValidTreeConfig(null)).toBe(false);
	});

	it('rejects empty object', () => {
		expect(isValidTreeConfig({})).toBe(false);
	});

	it('rejects config with wrong shape value', () => {
		expect(isValidTreeConfig({ ...DEFAULT_TREE_CONFIG, shape: 'invalid' })).toBe(false);
	});

	it('rejects config with wrong field type', () => {
		expect(isValidTreeConfig({ ...DEFAULT_TREE_CONFIG, seed: 'not-a-number' })).toBe(false);
	});

	it('rejects config missing required field', () => {
		const partial = Object.fromEntries(
			Object.entries(DEFAULT_TREE_CONFIG).filter(([k]) => k !== 'seed'),
		);
		expect(isValidTreeConfig(partial)).toBe(false);
	});

	it('rejects config with invalid branchesLevel1Range', () => {
		expect(isValidTreeConfig({ ...DEFAULT_TREE_CONFIG, branchesLevel1Range: [1] })).toBe(false);
	});
});

describe('isValidSceneConfig', () => {
	it('accepts SCENE_DEFAULTS', () => {
		expect(isValidSceneConfig(SCENE_DEFAULTS)).toBe(true);
	});

	it('rejects null', () => {
		expect(isValidSceneConfig(null)).toBe(false);
	});

	it('rejects empty object', () => {
		expect(isValidSceneConfig({})).toBe(false);
	});

	it('rejects config with wrong field type', () => {
		expect(isValidSceneConfig({ ...SCENE_DEFAULTS, treeCount: 'ten' })).toBe(false);
	});
});

describe('isValidEnvironmentConfig', () => {
	it('accepts ENVIRONMENT_DEFAULTS', () => {
		expect(isValidEnvironmentConfig(ENVIRONMENT_DEFAULTS)).toBe(true);
	});

	it('rejects null', () => {
		expect(isValidEnvironmentConfig(null)).toBe(false);
	});

	it('rejects empty object', () => {
		expect(isValidEnvironmentConfig({})).toBe(false);
	});

	it('rejects config with wrong field type', () => {
		expect(isValidEnvironmentConfig({ ...ENVIRONMENT_DEFAULTS, rainEnabled: 'yes' })).toBe(
			false,
		);
	});
});

describe('isValidEditorViewState', () => {
	it('accepts EDITOR_VIEW_DEFAULTS', () => {
		expect(isValidEditorViewState(EDITOR_VIEW_DEFAULTS)).toBe(true);
	});
});

describe('migrateStageValue', () => {
	it('migrates autumn to seasonal', () => {
		expect(migrateStageValue('autumn')).toBe('seasonal');
	});

	it('migrates ready to wilting', () => {
		expect(migrateStageValue('ready')).toBe('wilting');
	});

	it('passes through leafy unchanged', () => {
		expect(migrateStageValue('leafy')).toBe('leafy');
	});

	it('passes through seasonal unchanged', () => {
		expect(migrateStageValue('seasonal')).toBe('seasonal');
	});
});
