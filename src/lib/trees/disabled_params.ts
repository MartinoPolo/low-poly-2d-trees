import { TREE_SHAPES, FRUIT_TYPES, type TreeShape, type FruitType } from './types.js';

/**
 * Per-shape list of TreeConfig parameters that should be disabled in the UI.
 *
 * `fir` shares pine's disabled set per REQ-S-12 (branchCount always 0,
 * trunkBranchRatio not applicable to tiered canopies).
 */
export const DISABLED_PARAMS_BY_SHAPE = {
	[TREE_SHAPES.oak]: [],
	[TREE_SHAPES.pine]: ['branchCount', 'trunkBranchRatio'],
	[TREE_SHAPES.birch]: [],
	[TREE_SHAPES.fir]: ['branchCount', 'trunkBranchRatio'],
	[TREE_SHAPES.maple]: [],
	[TREE_SHAPES.willow]: [],
	[TREE_SHAPES.custom]: [],
} as const satisfies Record<TreeShape, readonly string[]>;

/**
 * Config shape used for cross-param disable rules. Keeping this narrow so
 * callers only pass the fields that actually affect disable state.
 */
interface DisabledParamConfig {
	readonly trunkSegments?: number;
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

	if (param === 'trunkCrookedness' && config.trunkSegments === 1) {
		return true;
	}

	if (param === 'fruitCount' && config.fruitType === FRUIT_TYPES.none) {
		return true;
	}

	return false;
}
