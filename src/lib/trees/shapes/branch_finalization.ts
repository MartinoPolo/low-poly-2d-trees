import type { CrookednessMode } from '../types.js';
import type { BranchSegment } from './shape_types.js';
import type { GeneratedBranch } from './branch_types.js';
import { buildBranchPath, computeEffectiveBranchSegments } from './branch_path.js';

export function finalizeBranchSegment(
	rng: () => number,
	accepted: BranchSegment,
	depth: number,
	parentIndex: number | null,
	branchSegments: number,
	branchCrookedness: number,
	crookednessMode: CrookednessMode,
): GeneratedBranch {
	const effectiveSegments = computeEffectiveBranchSegments(branchSegments, depth);
	const path = buildBranchPath(
		rng,
		accepted.x1,
		accepted.y1,
		accepted.x2,
		accepted.y2,
		effectiveSegments,
		branchCrookedness,
		crookednessMode,
	);
	const tip = path[path.length - 1]!;
	const segmentWithCrookedTip: BranchSegment = {
		...accepted,
		x2: tip.x,
		y2: tip.y,
	};
	return { segment: segmentWithCrookedTip, path, depth, parentIndex };
}
