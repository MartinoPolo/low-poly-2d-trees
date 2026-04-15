import { TREE_SHAPES, FRUIT_TYPES, type TreeShape, type FruitType } from './types.js';

/**
 * Per-shape list of TreeConfig parameters that should be disabled in the UI.
 *
 * `fir` and `pine` have no branches (branchDepth forced to 0).
 */
export const DISABLED_PARAMS_BY_SHAPE = {
	[TREE_SHAPES.oak]: [],
	[TREE_SHAPES.pine]: [
		'branchesLevel1Range',
		'branchesLevel2Range',
		'branchesLevel3Range',
		'branchAngle',
		'branchSegments',
		'branchCrookedness',
		'branchDepthTaper',
		'branchWidthVariance',
	],
	[TREE_SHAPES.birch]: [],
	[TREE_SHAPES.fir]: [
		'branchesLevel1Range',
		'branchesLevel2Range',
		'branchesLevel3Range',
		'branchAngle',
		'branchSegments',
		'branchCrookedness',
		'branchDepthTaper',
		'branchWidthVariance',
	],
	[TREE_SHAPES.maple]: [],
	[TREE_SHAPES.willow]: [],
	[TREE_SHAPES.cypress]: [
		'branchesLevel1Range',
		'branchesLevel2Range',
		'branchesLevel3Range',
		'branchAngle',
		'branchSegments',
		'branchCrookedness',
		'branchDepthTaper',
		'branchWidthVariance',
	],
	[TREE_SHAPES.apple]: [],
	[TREE_SHAPES.cherry]: [],
	[TREE_SHAPES.bush]: [
		'branchesLevel1Range',
		'branchesLevel2Range',
		'branchesLevel3Range',
		'branchAngle',
		'branchSegments',
		'branchCrookedness',
		'branchDepthTaper',
		'branchLength',
		'branchLengthVariance',
		'branchThickness',
		'branchWidthVariance',
		'trunkThickness',
		'trunkHeight',
		'trunkLean',
		'trunkSegments',
		'trunkCrookedness',
		'crookednessMode',
		'trunkTwist',
		'trunkStripCount',
	],
	[TREE_SHAPES.baobab]: [],
	[TREE_SHAPES.acacia]: [],
	[TREE_SHAPES.custom]: [],
} as const satisfies Record<TreeShape, readonly string[]>;

/**
 * Config shape used for cross-param disable rules. Keeping this narrow so
 * callers only pass the fields that actually affect disable state.
 */
interface DisabledParamConfig {
	readonly trunkSegments?: number;
	readonly branchDepth?: number;
	readonly branchSegments?: number;
	readonly fruitType?: FruitType;
}

/**
 * Returns `true` when a given parameter should be disabled for the current
 * shape and config. Combines per-shape static rules with cross-param rules.
 */
export function isParamDisabled(
	shape: TreeShape,
	param: string,
	config: DisabledParamConfig,
): boolean {
	const shapeDisabledParams: readonly string[] = DISABLED_PARAMS_BY_SHAPE[shape];
	if (shapeDisabledParams.includes(param)) {
		return true;
	}

	if (
		(param === 'trunkCrookedness' || param === 'crookednessMode') &&
		config.trunkSegments === 1
	) {
		return true;
	}

	if (param === 'branchCrookedness' && (config.branchSegments ?? 1) === 1) {
		return true;
	}

	if (param === 'branchWidthVariance' && (config.branchDepth ?? 0) === 0) {
		return true;
	}

	// Per-level sliders only visible when branchDepth >= that level
	const branchDepth = config.branchDepth ?? 0;
	if (param === 'branchesLevel1Range' && branchDepth < 1) {
		return true;
	}
	if (param === 'branchesLevel2Range' && branchDepth < 2) {
		return true;
	}
	if (param === 'branchesLevel3Range' && branchDepth < 3) {
		return true;
	}

	if (param === 'fruitCount' && config.fruitType === FRUIT_TYPES.none) {
		return true;
	}

	// Fruit type is locked for non-custom shapes (auto-set from SHAPE_FRUIT_MAP)
	if (param === 'fruitType' && shape !== TREE_SHAPES.custom) {
		return true;
	}

	return false;
}
