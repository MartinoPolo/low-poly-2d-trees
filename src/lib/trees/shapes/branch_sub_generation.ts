import { BRANCH_MIRRORING } from '../types.js';
import { randomInRange } from '../prng.js';
import type { BranchSegment } from './shape_types.js';
import type { BranchContext, GeneratedBranch } from './branch_types.js';
import {
	MAX_TOTAL_BRANCHES,
	BRANCH_RETRY_ATTEMPTS,
	ANGLE_DIVERGENCE_MIN_DEG,
	ANGLE_DIVERGENCE_MAX_DEG,
	CHILD_LENGTH_RATIO_MIN,
	CHILD_LENGTH_RATIO_MAX,
	L2_FORK_WIDTH_FRACTION_MIN,
	L2_FORK_WIDTH_FRACTION_MAX,
	FORK_WIDTH_VARIANCE_SPREAD_MULTIPLIER,
	overlapsAnySameDepth,
	sampleBranchCountForLevel,
} from './branch_geometry_helpers.js';
import {
	buildBranchPath,
	computeEffectiveBranchSegments,
	samplePointAlongPath,
} from './branch_path.js';

// ---------------------------------------------------------------------------
// Sub-branch generation (depth 2+)
// ---------------------------------------------------------------------------

export function generateSubBranches(
	ctx: BranchContext,
	branches: GeneratedBranch[],
	parentDepth: number,
): void {
	const { rng, config } = ctx;
	const targetDepth = parentDepth + 1;
	if (targetDepth > config.branchDepth) {
		return;
	}

	// Collect parent indices before we start adding children
	const parentIndices: number[] = [];
	for (let i = 0; i < branches.length; i++) {
		if (branches[i]!.depth === parentDepth) {
			parentIndices.push(i);
		}
	}

	for (const parentIndex of parentIndices) {
		if (branches.length >= MAX_TOTAL_BRANCHES) {
			return;
		}

		const parentBranch = branches[parentIndex]!;
		const parent = parentBranch.segment;
		const parentPath = parentBranch.path;
		const childCount = sampleBranchCountForLevel(rng, config, targetDepth);
		if (childCount <= 0) {
			continue;
		}

		// BR-5: Children originate from upper 50-100% of parent length
		// Compute parent length from the crooked path (piecewise sum)
		let parentLength = 0;
		for (let s = 0; s < parentPath.length - 1; s++) {
			const dx = parentPath[s + 1]!.x - parentPath[s]!.x;
			const dy = parentPath[s + 1]!.y - parentPath[s]!.y;
			parentLength += Math.sqrt(dx * dx + dy * dy);
		}
		// Overall parent direction (start to tip) for angle divergence
		const parentDirX = parent.x2 - parent.x1;
		const parentDirY = parent.y2 - parent.y1;
		const parentAngle = Math.atan2(parentDirY, parentDirX);

		const isPreferred = config.branchMirroring === BRANCH_MIRRORING.preferred;

		for (let c = 0; c < childCount; ) {
			if (branches.length >= MAX_TOTAL_BRANCHES) {
				return;
			}

			// Origin along upper 50-100% of parent — sample the crooked path
			const originT = randomInRange(rng, 0.5, 1.0);
			const origin = samplePointAlongPath(parentPath, originT);
			const originX = origin.x;
			const originY = origin.y;

			// How many to generate from this origin: 2 if preferred and room, else 1
			const pairCount = isPreferred && c + 1 < childCount ? 2 : 1;
			const signs: (1 | -1)[] = pairCount === 2 ? [1, -1] : [rng() < 0.5 ? 1 : -1];

			for (const forkSign of signs) {
				if (branches.length >= MAX_TOTAL_BRANCHES) {
					return;
				}

				let accepted: BranchSegment | null = null;

				for (let attempt = 0; attempt < BRANCH_RETRY_ATTEMPTS; attempt++) {
					const lengthRatio = randomInRange(
						rng,
						CHILD_LENGTH_RATIO_MIN,
						CHILD_LENGTH_RATIO_MAX,
					);
					// Deeper branches are progressively shorter stubs (issue #110).
					const depthLengthMultiplier =
						targetDepth === 3 ? 0.35 : targetDepth === 2 ? 0.85 : 1.0;
					const childLength = Math.max(
						8,
						parentLength * lengthRatio * depthLengthMultiplier,
					);

					const divergenceDeg = randomInRange(
						rng,
						ANGLE_DIVERGENCE_MIN_DEG,
						ANGLE_DIVERGENCE_MAX_DEG,
					);
					const divergenceRad = (divergenceDeg * Math.PI) / 180;
					const childAngle = parentAngle + divergenceRad * forkSign;

					const endX = originX + Math.cos(childAngle) * childLength;
					const endY = originY + Math.sin(childAngle) * childLength;

					const l2CenterFraction =
						(L2_FORK_WIDTH_FRACTION_MIN + L2_FORK_WIDTH_FRACTION_MAX) / 2;
					const l2VarianceSpread =
						(config.branchWidthVariance / 100) *
						(L2_FORK_WIDTH_FRACTION_MAX - L2_FORK_WIDTH_FRACTION_MIN) *
						FORK_WIDTH_VARIANCE_SPREAD_MULTIPLIER;
					const l2Fraction = Math.max(
						0.05,
						l2CenterFraction + (rng() * 2 - 1) * l2VarianceSpread,
					);
					const widthStart = parent.widthStart * l2Fraction;
					const widthEnd = Math.max(0.5, widthStart * 0.55);

					const candidate: BranchSegment = {
						x1: originX,
						y1: originY,
						x2: endX,
						y2: endY,
						widthStart,
						widthEnd,
					};

					if (
						overlapsAnySameDepth(candidate, branches, targetDepth, parent, isPreferred)
					) {
						continue;
					}

					accepted = candidate;
					break;
				}

				if (accepted !== null) {
					const effectiveSegments = computeEffectiveBranchSegments(
						config.branchSegments,
						targetDepth,
					);
					const childPath = buildBranchPath(
						rng,
						accepted.x1,
						accepted.y1,
						accepted.x2,
						accepted.y2,
						effectiveSegments,
						config.branchCrookedness,
						config.crookednessMode,
					);
					const tip = childPath[childPath.length - 1]!;
					const segmentWithCrookedTip: BranchSegment = {
						...accepted,
						x2: tip.x,
						y2: tip.y,
					};
					branches.push({
						segment: segmentWithCrookedTip,
						path: childPath,
						depth: targetDepth,
						parentIndex,
					});
				}
				c++;
			}
		}
	}
}
