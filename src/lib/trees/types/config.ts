import type { CustomBlob } from './custom.js';
import { FRUIT_TYPES, type FruitType } from './fruit.js';

export const TREE_STAGES = {
	seed: 'seed',
	sprouting: 'sprouting',
	sapling: 'sapling',
	growing: 'growing',
	leafy: 'leafy',
	fruiting: 'fruiting',
	autumn: 'autumn',
	ready: 'ready',
	bare: 'bare',
	dead: 'dead',
	stump: 'stump',
} as const;

export type TreeStage = (typeof TREE_STAGES)[keyof typeof TREE_STAGES];

export const TREE_STAGE_OPTIONS: readonly { value: TreeStage; label: string }[] = [
	{ value: TREE_STAGES.seed, label: 'Seed' },
	{ value: TREE_STAGES.sprouting, label: 'Sprouting' },
	{ value: TREE_STAGES.sapling, label: 'Sapling' },
	{ value: TREE_STAGES.growing, label: 'Growing' },
	{ value: TREE_STAGES.leafy, label: 'Leafy' },
	{ value: TREE_STAGES.fruiting, label: 'Fruiting' },
	{ value: TREE_STAGES.autumn, label: 'Autumn' },
	{ value: TREE_STAGES.ready, label: 'Ready' },
	{ value: TREE_STAGES.bare, label: 'Bare' },
	{ value: TREE_STAGES.dead, label: 'Dead' },
	{ value: TREE_STAGES.stump, label: 'Stump' },
] as const;

export const TREE_SHAPES = {
	oak: 'oak',
	pine: 'pine',
	birch: 'birch',
	fir: 'fir',
	maple: 'maple',
	willow: 'willow',
	custom: 'custom',
} as const;

export type TreeShape = (typeof TREE_SHAPES)[keyof typeof TREE_SHAPES];

export const TREE_SHAPE_OPTIONS: readonly { value: TreeShape; label: string }[] = [
	{ value: TREE_SHAPES.oak, label: 'Oak' },
	{ value: TREE_SHAPES.pine, label: 'Pine' },
	{ value: TREE_SHAPES.birch, label: 'Birch' },
	{ value: TREE_SHAPES.fir, label: 'Fir' },
	{ value: TREE_SHAPES.maple, label: 'Maple' },
	{ value: TREE_SHAPES.willow, label: 'Willow' },
	{ value: TREE_SHAPES.custom, label: 'Custom' },
] as const;

export interface TreeConfig {
	readonly stage: TreeStage;
	readonly shape: TreeShape;
	readonly seed: number;
	readonly polygonsPerBlob: number;
	readonly trunkPolygons: number;
	/** Hex color used for fully-lit canopy faces (REQ-P-30, REQ-L-01). */
	readonly canopyLightColor: string;
	/** Hex color used for fully-shadowed canopy faces (REQ-P-31, REQ-L-01). */
	readonly canopyDarkColor: string;
	readonly trunkHue: number;
	readonly trunkSaturation: number;
	readonly trunkLightness: number;
	readonly lightAngle: number;
	readonly blobCount: number;
	readonly branchCount: number;
	readonly depthVariance: number;
	readonly blobSizeVariance: number;
	readonly blobCloseness: number;
	readonly trunkThickness: number;
	readonly branchThickness: number;
	readonly canopySize: number;
	readonly trunkHeight: number;
	readonly trunkBranchRatio: number;
	readonly trunkLean: number;
	readonly trunkSegments: number;
	readonly trunkCrookedness: number;
	readonly branchLength: number;
	readonly branchLengthVariance: number;
	/**
	 * Recursive branching depth: 0 = no branches, 1 = trunk-origin only,
	 * 2 = trunk + sub-branches (default), 3 = trunk + sub + sub-sub-branches.
	 */
	readonly branchDepth: number;
	/**
	 * Per-blob overrides for the `custom` tree shape. Only consulted when
	 * `shape === 'custom'`. Grown lazily in UI state as the user raises the
	 * blobCount slider; entries past the current blobCount are preserved but
	 * unused so re-growing never loses prior user tuning.
	 */
	readonly customBlobs?: readonly CustomBlob[];
	readonly fruitType: FruitType;
	readonly fruitCount: number;
}

export const DEFAULT_TREE_CONFIG: TreeConfig = {
	stage: TREE_STAGES.leafy,
	shape: TREE_SHAPES.oak,
	seed: 42,
	polygonsPerBlob: 12,
	trunkPolygons: 30,
	canopyLightColor: '#a8d84e',
	canopyDarkColor: '#1a472a',
	trunkHue: 25,
	trunkSaturation: 50,
	trunkLightness: 25,
	lightAngle: 130,
	blobCount: 5,
	branchCount: 2,
	depthVariance: 1.0,
	blobSizeVariance: 3.0,
	blobCloseness: 50,
	trunkThickness: 100,
	branchThickness: 100,
	canopySize: 100,
	trunkHeight: 100,
	trunkBranchRatio: 70,
	trunkLean: 0,
	trunkSegments: 1,
	trunkCrookedness: 0,
	branchLength: 100,
	branchLengthVariance: 50,
	branchDepth: 2,
	fruitType: FRUIT_TYPES.none,
	fruitCount: 0,
} as const;

/**
 * Per-shape defaults from REQUIREMENTS.md §2.5. `custom` is intentionally
 * excluded — the custom editor retains whatever the user has configured.
 */
export const SHAPE_DEFAULTS = {
	[TREE_SHAPES.oak]: {
		blobCount: 5,
		branchCount: 3,
		branchDepth: 2,
		blobSizeVariance: 2.5,
		blobCloseness: 45,
		branchThickness: 100,
		trunkSegments: 1,
		trunkCrookedness: 0,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#a8d84e',
		canopyDarkColor: '#1a472a',
		trunkHue: 25,
		trunkSaturation: 50,
		trunkLightness: 25,
		fruitType: FRUIT_TYPES.none,
		fruitCount: 0,
	},
	[TREE_SHAPES.pine]: {
		blobCount: 5,
		branchCount: 0,
		branchDepth: 0,
		blobSizeVariance: 2.0,
		blobCloseness: 30,
		branchThickness: 100,
		trunkSegments: 1,
		trunkCrookedness: 0,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#4a9e5c',
		canopyDarkColor: '#0d2b1a',
		trunkHue: 20,
		trunkSaturation: 45,
		trunkLightness: 20,
		fruitType: FRUIT_TYPES.none,
		fruitCount: 0,
	},
	[TREE_SHAPES.birch]: {
		blobCount: 6,
		branchCount: 2,
		branchDepth: 2,
		blobSizeVariance: 2.5,
		blobCloseness: 35,
		branchThickness: 80,
		trunkSegments: 1,
		trunkCrookedness: 0,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#b8e065',
		canopyDarkColor: '#2d5e3a',
		trunkHue: 40,
		trunkSaturation: 8,
		trunkLightness: 82,
		fruitType: FRUIT_TYPES.none,
		fruitCount: 0,
	},
	[TREE_SHAPES.fir]: {
		blobCount: 6,
		branchCount: 0,
		branchDepth: 0,
		blobSizeVariance: 2.5,
		blobCloseness: 45,
		branchThickness: 100,
		trunkSegments: 1,
		trunkCrookedness: 0,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#3d8b50',
		canopyDarkColor: '#0a2418',
		trunkHue: 22,
		trunkSaturation: 50,
		trunkLightness: 28,
		fruitType: FRUIT_TYPES.none,
		fruitCount: 0,
	},
	[TREE_SHAPES.maple]: {
		blobCount: 5,
		branchCount: 5,
		branchDepth: 2,
		blobSizeVariance: 1.3,
		blobCloseness: 40,
		branchThickness: 100,
		trunkSegments: 1,
		trunkCrookedness: 0,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#e8a028',
		canopyDarkColor: '#8b2010',
		trunkHue: 30,
		trunkSaturation: 20,
		trunkLightness: 35,
		fruitType: FRUIT_TYPES.none,
		fruitCount: 0,
	},
	[TREE_SHAPES.willow]: {
		blobCount: 6,
		branchCount: 5,
		branchDepth: 2,
		blobSizeVariance: 2.0,
		blobCloseness: 35,
		branchThickness: 80,
		trunkSegments: 2,
		trunkCrookedness: 25,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#7cc45a',
		canopyDarkColor: '#1a4020',
		trunkHue: 25,
		trunkSaturation: 40,
		trunkLightness: 22,
		fruitType: FRUIT_TYPES.none,
		fruitCount: 0,
	},
} as const satisfies Record<
	Exclude<TreeShape, 'custom'>,
	Pick<
		TreeConfig,
		| 'blobCount'
		| 'branchCount'
		| 'branchDepth'
		| 'blobSizeVariance'
		| 'blobCloseness'
		| 'branchThickness'
		| 'trunkSegments'
		| 'trunkCrookedness'
		| 'branchLength'
		| 'branchLengthVariance'
		| 'canopyLightColor'
		| 'canopyDarkColor'
		| 'trunkHue'
		| 'trunkSaturation'
		| 'trunkLightness'
		| 'fruitType'
		| 'fruitCount'
	>
>;

export const VIEWBOX_WIDTH = 200;
export const VIEWBOX_HEIGHT = 300;

export function isTreeStage(value: string): value is TreeStage {
	return (Object.values(TREE_STAGES) as readonly string[]).includes(value);
}
