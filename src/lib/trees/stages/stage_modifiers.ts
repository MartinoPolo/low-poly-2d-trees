import { CROOKEDNESS_MODES, TREE_STAGES, type TreeConfig, type TreeStage } from '../types.js';
import { generateSeedGeometry } from './seed_generator.js';
import { generateSproutingGeometry } from './sprouting_generator.js';
import { generateStumpGeometry } from './stump_generator.js';
import type { StageResult } from './stage_types.js';

/** Autumn canopy palette — warm orange/red tones. */
const AUTUMN_CANOPY_LIGHT = '#E8A028';
const AUTUMN_CANOPY_DARK = '#8B2010';

function modifyConfig(config: TreeConfig, overrides: Partial<TreeConfig>): TreeConfig {
	return { ...config, ...overrides };
}

const STAGE_HANDLERS = {
	[TREE_STAGES.seed]: (): StageResult => ({
		kind: 'directGeometry',
		geometry: generateSeedGeometry(),
	}),

	[TREE_STAGES.sprouting]: (): StageResult => ({
		kind: 'directGeometry',
		geometry: generateSproutingGeometry(),
	}),

	[TREE_STAGES.sapling]: (_config: TreeConfig): StageResult => ({
		kind: 'modifiedConfig',
		config: modifyConfig(_config, {
			trunkHeight: 70,
			canopySize: 40,
			trunkThickness: 50,
			branchesLevel1Range: [0, 1],
			blobCount: Math.min(_config.blobCount, 2),
			polygonsPerBlob: 8,
		}),
		addStakes: false,
		addFruit: false,
		addFlowers: false,
		addFallingLeaves: false,
	}),

	[TREE_STAGES.growing]: (_config: TreeConfig): StageResult => ({
		kind: 'modifiedConfig',
		config: modifyConfig(_config, {
			trunkHeight: 75,
			canopySize: 50,
			trunkThickness: 60,
			branchesLevel1Range: [0, 1],
			blobCount: Math.min(_config.blobCount, 3),
			polygonsPerBlob: 9,
		}),
		addStakes: false,
		addFruit: false,
		addFlowers: false,
		addFallingLeaves: false,
	}),

	[TREE_STAGES.leafy]: (_config: TreeConfig): StageResult => ({
		kind: 'modifiedConfig',
		config: _config,
		addStakes: false,
		addFruit: false,
		addFlowers: false,
		addFallingLeaves: false,
	}),

	[TREE_STAGES.flowering]: (_config: TreeConfig): StageResult => ({
		kind: 'modifiedConfig',
		config: _config,
		addStakes: false,
		addFruit: false,
		addFlowers: true,
		addFallingLeaves: false,
	}),

	[TREE_STAGES.fruiting]: (_config: TreeConfig): StageResult => ({
		kind: 'modifiedConfig',
		config: _config,
		addStakes: false,
		addFruit: true,
		addFlowers: false,
		addFallingLeaves: false,
	}),

	[TREE_STAGES.autumn]: (_config: TreeConfig): StageResult => ({
		kind: 'modifiedConfig',
		config: modifyConfig(_config, {
			canopyLightColor: AUTUMN_CANOPY_LIGHT,
			canopyDarkColor: AUTUMN_CANOPY_DARK,
		}),
		addStakes: false,
		addFruit: false,
		addFlowers: false,
		addFallingLeaves: true,
	}),

	[TREE_STAGES.ready]: (_config: TreeConfig): StageResult => ({
		kind: 'modifiedConfig',
		config: _config,
		addStakes: false,
		addFruit: false,
		addFlowers: false,
		addFallingLeaves: false,
	}),

	[TREE_STAGES.bare]: (_config: TreeConfig): StageResult => ({
		kind: 'modifiedConfig',
		config: modifyConfig(_config, {
			blobCount: 0,
			polygonsPerBlob: 0,
		}),
		addStakes: false,
		addFruit: false,
		addFlowers: false,
		addFallingLeaves: false,
	}),

	[TREE_STAGES.dead]: (_config: TreeConfig): StageResult => ({
		kind: 'modifiedConfig',
		config: modifyConfig(_config, {
			trunkLean: 30,
			branchesLevel1Range: [1, 2],
			branchLength: 40,
			blobCount: 0,
			polygonsPerBlob: 0,
			trunkHue: 0,
			trunkSaturation: 5,
			trunkLightness: 35,
			crookednessMode: CROOKEDNESS_MODES.random,
		}),
		addStakes: false,
		addFruit: false,
		addFlowers: false,
		addFallingLeaves: false,
	}),

	[TREE_STAGES.stump]: (): StageResult => ({
		kind: 'directGeometry',
		geometry: generateStumpGeometry(),
	}),
} as const satisfies Record<TreeStage, (config: TreeConfig) => StageResult>;

export function applyStageModifiers(config: TreeConfig): StageResult {
	return STAGE_HANDLERS[config.stage](config);
}
