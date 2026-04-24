import type { Point2D } from '../types.js';
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
import { samplePointAlongPath } from './branch_path.js';
import { finalizeBranchSegment } from './branch_finalization.js';

// ---------------------------------------------------------------------------
// Sub-branch generation (depth 2+)
// ---------------------------------------------------------------------------

function tryGenerateSubBranch(
	ctx: BranchContext,
	parent: BranchSegment,
	parentLength: number,
	parentAngle: number,
	origin: Point2D,
	forkSign: 1 | -1,
	targetDepth: number,
	branches: readonly GeneratedBranch[],
	isPreferred: boolean,
): BranchSegment | null {
	const { rng, config } = ctx;

	for (let attempt = 0; attempt < BRANCH_RETRY_ATTEMPTS; attempt++) {
		const lengthRatio = randomInRange(rng, CHILD_LENGTH_RATIO_MIN, CHILD_LENGTH_RATIO_MAX);
		const depthLengthMultiplier = targetDepth === 3 ? 0.35 : targetDepth === 2 ? 0.85 : 1.0;
		const childLength = Math.max(8, parentLength * lengthRatio * depthLengthMultiplier);

		const divergenceDeg = randomInRange(
			rng,
			ANGLE_DIVERGENCE_MIN_DEG,
			ANGLE_DIVERGENCE_MAX_DEG,
		);
		const divergenceRad = (divergenceDeg * Math.PI) / 180;
		const childAngle = parentAngle + divergenceRad * forkSign;

		const endX = origin.x + Math.cos(childAngle) * childLength;
		const endY = origin.y + Math.sin(childAngle) * childLength;

		const l2CenterFraction = (L2_FORK_WIDTH_FRACTION_MIN + L2_FORK_WIDTH_FRACTION_MAX) / 2;
		const l2VarianceSpread =
			(config.branchWidthVariance / 100) *
			(L2_FORK_WIDTH_FRACTION_MAX - L2_FORK_WIDTH_FRACTION_MIN) *
			FORK_WIDTH_VARIANCE_SPREAD_MULTIPLIER;
		const l2Fraction = Math.max(0.05, l2CenterFraction + (rng() * 2 - 1) * l2VarianceSpread);
		const widthStart = parent.widthStart * l2Fraction;
		const widthEnd = Math.max(0.5, widthStart * 0.55);

		const candidate: BranchSegment = {
			x1: origin.x,
			y1: origin.y,
			x2: endX,
			y2: endY,
			widthStart,
			widthEnd,
		};

		if (overlapsAnySameDepth(candidate, branches, targetDepth, parent, isPreferred)) {
			continue;
		}

		return candidate;
	}
	return null;
}

function computePathLength(path: readonly Point2D[]): number {
	let length = 0;
	for (let s = 0; s < path.length - 1; s++) {
		const dx = path[s + 1]!.x - path[s]!.x;
		const dy = path[s + 1]!.y - path[s]!.y;
		length += Math.sqrt(dx * dx + dy * dy);
	}
	return length;
}

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

		const parentLength = computePathLength(parentPath);
		const parentAngle = Math.atan2(parent.y2 - parent.y1, parent.x2 - parent.x1);
		const isPreferred = config.branchMirroring === BRANCH_MIRRORING.preferred;

		for (let c = 0; c < childCount; ) {
			if (branches.length >= MAX_TOTAL_BRANCHES) {
				return;
			}

			const originT = randomInRange(rng, 0.5, 1.0);
			const origin = samplePointAlongPath(parentPath, originT);

			const pairCount = isPreferred && c + 1 < childCount ? 2 : 1;
			const signs: (1 | -1)[] = pairCount === 2 ? [1, -1] : [rng() < 0.5 ? 1 : -1];

			for (const forkSign of signs) {
				if (branches.length >= MAX_TOTAL_BRANCHES) {
					return;
				}

				const accepted = tryGenerateSubBranch(
					ctx,
					parent,
					parentLength,
					parentAngle,
					origin,
					forkSign,
					targetDepth,
					branches,
					isPreferred,
				);

				if (accepted !== null) {
					branches.push(
						finalizeBranchSegment(
							rng,
							accepted,
							targetDepth,
							parentIndex,
							config.branchSegments,
							config.branchCrookedness,
							config.crookednessMode,
						),
					);
				}
				c++;
			}
		}
	}
}
