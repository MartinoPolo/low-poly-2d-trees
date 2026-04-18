import { BRANCH_MIRRORING, type TreeShape, type BranchMirroring } from '../types.js';
import { getShapeDefinition } from './blob_generators.js';
import { computeEffectiveTrunkTop } from './trunk.js';

const MIN_BRANCH_SPACING = 20;
const CHILD_LEVEL_SCALE_FACTOR = 0.6;
const MIN_BRANCHES_PER_LEVEL = 1;

interface BranchMaximums {
	readonly maxLevel1: number;
	readonly maxLevel2: number;
	readonly maxLevel3: number;
}

export function computeMaxBranches(shape: TreeShape, trunkHeight: number): BranchMaximums {
	const shapeDef = getShapeDefinition(shape);
	const effectiveTrunkTop = computeEffectiveTrunkTop(shapeDef, trunkHeight);
	const totalTrunkLength = shapeDef.trunkBottom - effectiveTrunkTop;

	const maxLevel1 = Math.max(
		MIN_BRANCHES_PER_LEVEL,
		Math.floor(totalTrunkLength / MIN_BRANCH_SPACING),
	);
	const maxLevel2 = Math.max(
		MIN_BRANCHES_PER_LEVEL,
		Math.floor(maxLevel1 * CHILD_LEVEL_SCALE_FACTOR),
	);
	const maxLevel3 = Math.max(
		MIN_BRANCHES_PER_LEVEL,
		Math.floor(maxLevel2 * CHILD_LEVEL_SCALE_FACTOR),
	);

	return { maxLevel1, maxLevel2, maxLevel3 };
}

/**
 * Clamp branch maximums so they respect symmetry-forced minimums.
 *
 * When branchMirroring is 'preferred' or trunkFork is true, L1 needs at least 2.
 * When branchMirroring is 'preferred', L2 needs at least 2.
 */
export function clampBranchMaximums(
	maxBranches: BranchMaximums,
	branchMirroring: BranchMirroring,
	trunkFork: boolean,
): BranchMaximums {
	let { maxLevel1, maxLevel2 } = maxBranches;
	const { maxLevel3 } = maxBranches;

	if (branchMirroring === BRANCH_MIRRORING.preferred || trunkFork) {
		maxLevel1 = Math.max(maxLevel1, 2);
	}

	if (branchMirroring === BRANCH_MIRRORING.preferred) {
		maxLevel2 = Math.max(maxLevel2, 2);
	}

	return { maxLevel1, maxLevel2, maxLevel3 };
}
