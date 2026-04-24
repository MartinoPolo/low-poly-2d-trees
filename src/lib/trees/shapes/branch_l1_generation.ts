import type { Point2D } from '../types.js';
import { BRANCH_MIRRORING } from '../types.js';
import { randomInRange } from '../prng.js';
import { computeZoneSplit } from './trunk.js';
import { resolveBranchLengthRange } from './geometry.js';
import { treeSizeW } from './tree_scale.js';
import type { BranchSegment } from './shape_types.js';
import type { BranchContext, GeneratedBranch } from './branch_types.js';
import {
	MAX_TOTAL_BRANCHES,
	BRANCH_RETRY_ATTEMPTS,
	BRANCH_ANGLE_VARIATION_DEG,
	ANGLE_DIVERGENCE_MIN_DEG,
	trunkWidthAtY,
	computeForkBranchWidth,
	angleDivergence,
	reflectEndpointIfCrossing,
	mapBranchAngleRange,
	sampleBranchCountForLevel,
	overlapsAnySameDepth,
} from './branch_geometry_helpers.js';
import { finalizeBranchSegment } from './branch_finalization.js';

// ---------------------------------------------------------------------------
// L1 branch generation constants
// ---------------------------------------------------------------------------

// Base length ranges for branches at branchLength=100 (scaled to 300-equivalent tree size).
const TRUNK_BRANCH_BASE_MIN = treeSizeW(0.2);
const TRUNK_BRANCH_BASE_MAX = treeSizeW(0.4);

/** Trunk fork arm width: 0.6-0.7 × trunkTopWidth (thicker than normal L1). */
const TRUNK_FORK_WIDTH_FRACTION_MIN = 0.6;
const TRUNK_FORK_WIDTH_FRACTION_MAX = 0.7;

// ---------------------------------------------------------------------------
// L1 branch generation — internal helpers
// ---------------------------------------------------------------------------

/**
 * Try to generate a single L1 branch candidate from a junction and side.
 * When `junctionPool` is provided, a random junction is picked per attempt
 * (matching the original retry-per-junction behavior for off/allowed modes).
 */
function tryGenerateL1Branch(
	ctx: BranchContext,
	branches: readonly GeneratedBranch[],
	junction: Point2D | null,
	side: 1 | -1,
	angleRange: { minRad: number; maxRad: number },
	overrideWidth: number | null,
	relaxOverlap: boolean,
	junctionPool?: { indices: readonly number[]; junctions: readonly Point2D[] },
): BranchSegment | null {
	const { rng, config, trunkTop, trunkAxisAngle } = ctx;

	for (let attempt = 0; attempt < BRANCH_RETRY_ATTEMPTS; attempt++) {
		let resolvedJunction: Point2D;
		if (junctionPool !== undefined) {
			const jIdx = junctionPool.indices[Math.floor(rng() * junctionPool.indices.length)]!;
			resolvedJunction = junctionPool.junctions[jIdx]!;
		} else {
			resolvedJunction = junction!;
		}
		const startX = resolvedJunction.x;
		const startY = resolvedJunction.y;

		const { min: lenMin, max: lenMax } = resolveBranchLengthRange(
			TRUNK_BRANCH_BASE_MIN,
			TRUNK_BRANCH_BASE_MAX,
			config.branchLength,
			config.branchLengthVariance,
			true,
		);
		const length = randomInRange(rng, lenMin, lenMax);

		const baseUpAngle = randomInRange(rng, angleRange.minRad, angleRange.maxRad);
		const angleVariationRad = ((rng() * 2 - 1) * BRANCH_ANGLE_VARIATION_DEG * Math.PI) / 180;
		const upAngle = baseUpAngle + angleVariationRad;

		const candidateAngle = Math.atan2(
			-Math.sin(upAngle) * length,
			Math.cos(upAngle) * length * side,
		);
		const divergence = angleDivergence(candidateAngle, trunkAxisAngle);
		const minDivRad = (ANGLE_DIVERGENCE_MIN_DEG * Math.PI) / 180;
		if (divergence < minDivRad) {
			continue;
		}

		const rawEndX = startX + Math.cos(upAngle) * length * side;
		const rawEndY = startY - Math.sin(upAngle) * length;
		const endX = reflectEndpointIfCrossing(startX, rawEndX, startX);

		let widthStart: number;
		if (overrideWidth !== null) {
			widthStart = overrideWidth;
		} else {
			const trunkWidthAtFork = trunkWidthAtY(
				startY,
				trunkTop,
				ctx.trunkBottom,
				ctx.trunkTopWidth,
				ctx.trunkBaseWidth,
			);
			widthStart = computeForkBranchWidth(
				rng,
				trunkWidthAtFork,
				config.branchWidthVariance,
				ctx.branchThicknessScale,
			);
		}
		const widthEnd = Math.max(0.5, widthStart * 0.4);

		const candidate: BranchSegment = {
			x1: startX,
			y1: startY,
			x2: endX,
			y2: rawEndY,
			widthStart,
			widthEnd,
		};

		if (overlapsAnySameDepth(candidate, branches, 1, undefined, relaxOverlap)) {
			continue;
		}

		return candidate;
	}
	return null;
}

function finalizeBranch(
	ctx: BranchContext,
	accepted: BranchSegment,
	branches: GeneratedBranch[],
): void {
	branches.push(
		finalizeBranchSegment(
			ctx.rng,
			accepted,
			1,
			null,
			ctx.config.branchSegments,
			ctx.config.branchCrookedness,
			ctx.config.crookednessMode,
		),
	);
}

// ---------------------------------------------------------------------------
// L1 branch generation helpers
// ---------------------------------------------------------------------------

function generateTrunkForkPair(
	ctx: BranchContext,
	branches: GeneratedBranch[],
	angleRange: { minRad: number; maxRad: number },
	upperZoneJunctionIndices: readonly number[],
): number {
	const topIdx = upperZoneJunctionIndices[upperZoneJunctionIndices.length - 1]!;
	const topJunction = ctx.trunkJunctions[topIdx]!;
	let generated = 0;

	const leftForkWidth =
		ctx.trunkTopWidth *
		randomInRange(ctx.rng, TRUNK_FORK_WIDTH_FRACTION_MIN, TRUNK_FORK_WIDTH_FRACTION_MAX);
	const leftArm = tryGenerateL1Branch(
		ctx,
		branches,
		topJunction,
		-1,
		angleRange,
		leftForkWidth,
		true,
	);
	if (leftArm !== null) {
		finalizeBranch(ctx, leftArm, branches);
		generated++;
	}

	const rightForkWidth =
		ctx.trunkTopWidth *
		randomInRange(ctx.rng, TRUNK_FORK_WIDTH_FRACTION_MIN, TRUNK_FORK_WIDTH_FRACTION_MAX);
	const rightArm = tryGenerateL1Branch(
		ctx,
		branches,
		topJunction,
		1,
		angleRange,
		rightForkWidth,
		true,
	);
	if (rightArm !== null) {
		finalizeBranch(ctx, rightArm, branches);
		generated++;
	}

	return generated;
}

// ---------------------------------------------------------------------------
// L1 branch generation — public entry point
// ---------------------------------------------------------------------------

export function generateTrunkBranches(ctx: BranchContext, branches: GeneratedBranch[]): void {
	const { rng, config, trunkJunctions } = ctx;
	const count = sampleBranchCountForLevel(rng, config, 1);
	if (count <= 0) {
		return;
	}

	const maxL1 = config.branchesLevel1Range[1];
	const actualSegments = Math.max(1, trunkJunctions.length - 1);
	const { lowerZoneSegments } = computeZoneSplit(actualSegments, maxL1);
	const effectiveLowerSegments = Math.min(lowerZoneSegments, trunkJunctions.length - 2);
	const upperZoneJunctionIndices: number[] = [];
	for (let j = Math.max(1, effectiveLowerSegments); j < trunkJunctions.length - 1; j++) {
		upperZoneJunctionIndices.push(j);
	}
	if (upperZoneJunctionIndices.length === 0 && trunkJunctions.length >= 2) {
		upperZoneJunctionIndices.push(Math.floor(trunkJunctions.length / 2));
	}

	const angleRange = mapBranchAngleRange(config.branchAngle);
	const isPreferred = config.branchMirroring === BRANCH_MIRRORING.preferred;
	const relaxOverlap = config.branchMirroring === BRANCH_MIRRORING.allowed || isPreferred;
	const startSide = rng() < 0.5 ? 0 : 1;
	let branchesGenerated = 0;

	if (config.trunkFork && upperZoneJunctionIndices.length > 0) {
		branchesGenerated += generateTrunkForkPair(
			ctx,
			branches,
			angleRange,
			upperZoneJunctionIndices,
		);
	}

	// Generate remaining branches
	if (isPreferred) {
		// Preferred: generate in left/right pairs from shared junctions
		while (branchesGenerated < count && branches.length < MAX_TOTAL_BRANCHES) {
			const junctionIdx =
				upperZoneJunctionIndices[Math.floor(rng() * upperZoneJunctionIndices.length)]!;
			const junction = trunkJunctions[junctionIdx]!;

			const leftSide: 1 | -1 = (branchesGenerated + startSide) % 2 === 0 ? 1 : -1;
			const rightSide: 1 | -1 = leftSide === 1 ? -1 : 1;

			const leftBranch = tryGenerateL1Branch(
				ctx,
				branches,
				junction,
				leftSide,
				angleRange,
				null,
				true,
			);
			if (leftBranch !== null) {
				finalizeBranch(ctx, leftBranch, branches);
				branchesGenerated++;
			}

			if (branchesGenerated >= count || branches.length >= MAX_TOTAL_BRANCHES) {
				break;
			}

			const rightBranch = tryGenerateL1Branch(
				ctx,
				branches,
				junction,
				rightSide,
				angleRange,
				null,
				true,
			);
			if (rightBranch !== null) {
				finalizeBranch(ctx, rightBranch, branches);
				branchesGenerated++;
			}
		}
	} else {
		// Off/Allowed: original alternating behavior with per-attempt junction selection
		const junctionPool = { indices: upperZoneJunctionIndices, junctions: trunkJunctions };
		for (let i = branchesGenerated; i < count; i++) {
			if (branches.length >= MAX_TOTAL_BRANCHES) {
				return;
			}

			const side: 1 | -1 = (i + startSide) % 2 === 0 ? 1 : -1;

			const accepted = tryGenerateL1Branch(
				ctx,
				branches,
				null,
				side,
				angleRange,
				null,
				relaxOverlap,
				junctionPool,
			);
			if (accepted !== null) {
				finalizeBranch(ctx, accepted, branches);
			}
		}
	}
}
