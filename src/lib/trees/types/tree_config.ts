import type { CustomBlob } from './custom.js';
import { FRUIT_TYPES, type FruitType } from './fruit.js';
import type { TreeStage } from './tree_stages.js';
import { TREE_STAGES } from './tree_stages.js';
import type { TreeShape } from './tree_shapes.js';
import { TREE_SHAPES } from './tree_shapes.js';
import {
	BRANCH_MIRRORING,
	CROOKEDNESS_MODES,
	type BranchMirroring,
	type CrookednessMode,
} from './tree_config_enums.js';

export const VIEWBOX_WIDTH = 500;
export const VIEWBOX_HEIGHT = 500;

export interface TreeConfig {
	readonly stage: TreeStage;
	readonly shape: TreeShape;
	readonly seed: number;
	readonly polygonsPerBlob: number;
	/** Hex color used for fully-lit canopy faces (REQ-P-30, REQ-L-01). */
	readonly canopyLightColor: string;
	/** Hex color used for fully-shadowed canopy faces (REQ-P-31, REQ-L-01). */
	readonly canopyDarkColor: string;
	readonly trunkHue: number;
	readonly trunkSaturation: number;
	readonly trunkLightness: number;
	readonly lightAngle: number;
	readonly blobCount: number;
	readonly depthVariance: number;
	readonly blobSizeVariance: number;
	readonly blobCloseness: number;
	readonly trunkThickness: number;
	readonly branchThickness: number;
	readonly canopySize: number;
	readonly trunkHeight: number;
	readonly trunkLean: number;
	readonly trunkSegments: number;
	readonly trunkCrookedness: number;
	readonly crookednessMode: CrookednessMode;
	readonly branchLength: number;
	readonly branchLengthVariance: number;
	/**
	 * Recursive branching depth: 0 = no branches, 1 = trunk-origin only,
	 * 2 = trunk + sub-branches (default), 3 = trunk + sub + sub-sub-branches.
	 */
	readonly branchDepth: number;
	/** Per-level branch count ranges. When min === max, fixed count. */
	readonly branchesLevel1Range: readonly [number, number];
	readonly branchesLevel2Range: readonly [number, number];
	readonly branchesLevel3Range: readonly [number, number];
	/** Number of segments per branch (1-3). */
	readonly branchSegments: number;
	/** Branch crookedness (0-100). Default = 50% of trunk crookedness. */
	readonly branchCrookedness: number;
	/** Branch angle slider (0-100%). 0% = wide spread, 100% = vertical. */
	readonly branchAngle: number;
	/** Branch mirror symmetry: off, allowed (relaxed overlap), preferred (paired generation). */
	readonly branchMirroring: BranchMirroring;
	/** When true, trunk flares at top and forces two thick L1 branches from topmost junction. */
	readonly trunkFork: boolean;
	/** Trunk face-width variation (0-100%). Controls twist and per-face randomness. */
	readonly trunkTwist: number;
	/** Number of visible strip faces on trunk/branch cross-section (REQ-EV2-X-01). */
	readonly trunkStripCount: number;
	/** Branch width randomness per branch (0-50, REQ-EV2-V-02). */
	readonly branchWidthVariance: number;
	/**
	 * Per-blob overrides for the `custom` tree shape. Only consulted when
	 * `shape === 'custom'`. Grown lazily in UI state as the user raises the
	 * blobCount slider; entries past the current blobCount are preserved but
	 * unused so re-growing never loses prior user tuning.
	 */
	readonly customBlobs?: readonly CustomBlob[];
	readonly fruitType: FruitType;
	readonly fruitCount: number;
	readonly showMushrooms?: boolean;
}

export const DEFAULT_TREE_CONFIG: TreeConfig = {
	stage: TREE_STAGES.leafy,
	shape: TREE_SHAPES.oak,
	seed: 42,
	polygonsPerBlob: 12,
	canopyLightColor: '#a8d84e',
	canopyDarkColor: '#1a472a',
	trunkHue: 25,
	trunkSaturation: 50,
	trunkLightness: 25,
	lightAngle: 130,
	blobCount: 5,
	depthVariance: 1.0,
	blobSizeVariance: 2.0,
	blobCloseness: 50,
	trunkThickness: 100,
	branchThickness: 100,
	canopySize: 100,
	trunkHeight: 100,
	trunkLean: 0,
	trunkSegments: 3,
	trunkCrookedness: 10,
	crookednessMode: CROOKEDNESS_MODES.alternating,
	branchLength: 100,
	branchLengthVariance: 50,
	branchDepth: 2,
	branchesLevel1Range: [1, 3],
	branchesLevel2Range: [1, 2],
	branchesLevel3Range: [0, 1],
	branchSegments: 1,
	branchCrookedness: 0,
	branchAngle: 50,
	branchMirroring: BRANCH_MIRRORING.allowed,
	trunkFork: false,
	trunkTwist: 25,
	trunkStripCount: 3,
	branchWidthVariance: 25,
	fruitType: FRUIT_TYPES.none,
	fruitCount: 3,
} as const;
