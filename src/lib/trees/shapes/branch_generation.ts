import type { TreeConfig, Point2D, CrookednessMode } from '../types.js';
import { BRANCH_MIRRORING, CROOKEDNESS_MODES, VIEWBOX_WIDTH } from '../types.js';
import { randomInRange } from '../prng.js';
import { sampleTrunkCenterX, computeZoneSplit } from './trunk.js';
import { isPointInSingleBlob, getBlobsBounds } from './shape_bounds.js';
import { branchesOverlap, resolveBranchLengthRange } from './geometry.js';
import type { Blob, BranchSegment } from './shape_types.js';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Branch path building (issue #105 — multi-junction branches)
// ---------------------------------------------------------------------------

/** Maximum absolute angle from branch axis (degrees) to prevent self-intersection. */
const MAX_BRANCH_ABSOLUTE_ANGLE_DEG = 85;

/**
 * Compute effective branch segments per depth (REQ-EV2-B-04):
 * L1 = config, L2 = max(config-1, 1), L3+ = 1.
 */
export function computeEffectiveBranchSegments(configSegments: number, depth: number): number {
	if (depth >= 3) {
		return 1;
	}
	if (depth === 2) {
		return Math.max(configSegments - 1, 1);
	}
	return configSegments;
}

/**
 * Build a crooked polyline path for a branch. Analogous to trunk's
 * `buildCrookedPath` but works in the branch's local coordinate frame
 * (arbitrary direction, not just vertical).
 *
 * Uses the same jitter model as the trunk: cumulative angle from branch
 * axis, per-junction jitter reduction, segment length variation, and
 * alternating/random mode.
 */
export function buildBranchPath(
	rng: () => number,
	startX: number,
	startY: number,
	endX: number,
	endY: number,
	segments: number,
	crookedness: number,
	crookednessMode: CrookednessMode,
): Point2D[] {
	const segmentCount = Math.max(1, Math.min(5, Math.round(segments)));
	const clampedCrookedness = Math.max(0, Math.min(100, crookedness));

	const totalDx = endX - startX;
	const totalDy = endY - startY;
	const totalLength = Math.sqrt(totalDx * totalDx + totalDy * totalDy);

	if (totalLength === 0) {
		return [
			{ x: startX, y: startY },
			{ x: endX, y: endY },
		];
	}

	// Unit vectors along branch axis and perpendicular
	const axisX = totalDx / totalLength;
	const axisY = totalDy / totalLength;
	const perpX = -axisY;
	const perpY = axisX;

	const baseSegmentLen = totalLength / segmentCount;

	// Segment length variation: only when crookedness > 0 (same as trunk)
	let segmentMultipliers: number[] | null = null;
	let normalizeScale = 1;
	if (clampedCrookedness > 0) {
		segmentMultipliers = [];
		let multiplierSum = 0;
		for (let i = 0; i < segmentCount; i++) {
			const mult = 0.7 + rng() * 0.6; // 0.7-1.3 range (+/-30%)
			segmentMultipliers.push(mult);
			multiplierSum += mult;
		}
		normalizeScale = segmentCount / multiplierSum;
	}

	const junctions: Point2D[] = [{ x: startX, y: startY }];

	const maxJitterDeg = lerp(0, 90, clampedCrookedness / 100);
	const maxAbsoluteRad = (MAX_BRANCH_ABSOLUTE_ANGLE_DEG * Math.PI) / 180;

	let currentAngleRad = 0; // Angle relative to branch axis
	let alternatingSign = clampedCrookedness > 0 ? (rng() < 0.5 ? -1 : 1) : 1;
	let cumulativeAxisLen = 0;
	let cumulativePerpOffset = 0;

	for (let i = 1; i <= segmentCount; i++) {
		const segmentLen =
			segmentMultipliers !== null
				? baseSegmentLen * segmentMultipliers[i - 1]! * normalizeScale
				: baseSegmentLen;

		if (i > 1 && clampedCrookedness > 0) {
			// Per-junction jitter reduction: up to 50% of max
			const jitterReduction = 0.5 + rng() * 0.5; // 0.5-1.0 multiplier
			const effectiveMaxJitter = maxJitterDeg * jitterReduction;

			let jitterSign: number;
			if (crookednessMode === CROOKEDNESS_MODES.alternating) {
				alternatingSign *= -1;
				jitterSign = alternatingSign;
			} else {
				jitterSign = rng() < 0.5 ? -1 : 1;
			}

			const jitterDeg =
				randomInRange(rng, effectiveMaxJitter * 0.3, effectiveMaxJitter) * jitterSign;
			currentAngleRad += (jitterDeg * Math.PI) / 180;
			currentAngleRad = Math.max(-maxAbsoluteRad, Math.min(maxAbsoluteRad, currentAngleRad));
		}

		cumulativeAxisLen += segmentLen;
		cumulativePerpOffset += segmentLen * Math.tan(currentAngleRad);

		junctions.push({
			x: startX + axisX * cumulativeAxisLen + perpX * cumulativePerpOffset,
			y: startY + axisY * cumulativeAxisLen + perpY * cumulativePerpOffset,
		});
	}

	return junctions;
}

/**
 * Sample a point along a polyline path at parametric position t ∈ [0,1].
 * Piecewise-linear interpolation: t=0 → first junction, t=1 → last junction.
 */
export function samplePointAlongPath(path: readonly Point2D[], t: number): Point2D {
	if (path.length < 2) {
		return path[0]!;
	}

	// Fast-path exact endpoints to avoid float-accumulation drift
	if (t <= 0) {
		return path[0]!;
	}
	if (t >= 1) {
		return path[path.length - 1]!;
	}

	const clampedT = t;

	// Compute cumulative segment lengths
	let totalLength = 0;
	const segmentLengths: number[] = [];
	for (let i = 0; i < path.length - 1; i++) {
		const dx = path[i + 1]!.x - path[i]!.x;
		const dy = path[i + 1]!.y - path[i]!.y;
		const len = Math.sqrt(dx * dx + dy * dy);
		segmentLengths.push(len);
		totalLength += len;
	}

	if (totalLength === 0) {
		return path[0]!;
	}

	const targetDistance = clampedT * totalLength;
	let accumulated = 0;

	for (let i = 0; i < segmentLengths.length; i++) {
		const segLen = segmentLengths[i]!;
		if (accumulated + segLen >= targetDistance || i === segmentLengths.length - 1) {
			const localT = segLen > 0 ? (targetDistance - accumulated) / segLen : 0;
			return {
				x: path[i]!.x + localT * (path[i + 1]!.x - path[i]!.x),
				y: path[i]!.y + localT * (path[i + 1]!.y - path[i]!.y),
			};
		}
		accumulated += segLen;
	}

	return path[path.length - 1]!;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Max total branches across all levels (Rule J). */
const MAX_TOTAL_BRANCHES = 25;

/** Angle divergence from parent direction (Rule E): 30-60 degrees. */
const ANGLE_DIVERGENCE_MIN_DEG = 30;
const ANGLE_DIVERGENCE_MAX_DEG = 60;

/** Child length ratio (Rule K): 20-80% of parent, default center 50%. */
const CHILD_LENGTH_RATIO_MIN = 0.2;
const CHILD_LENGTH_RATIO_MAX = 0.8;

// Bumped from 5 — with the upper zone now scaling with trunkSegments (see
// computeZoneSplit), adjacent L1 candidate origins can share junctions and
// repeatedly fail overlap checks. A higher retry budget recovers these.
const BRANCH_RETRY_ATTEMPTS = 15;

// Base length ranges for branches at branchLength=100 (proportional to viewport).
const TRUNK_BRANCH_BASE_MIN = VIEWBOX_WIDTH * 0.2;
const TRUNK_BRANCH_BASE_MAX = VIEWBOX_WIDTH * 0.4;

// ---------------------------------------------------------------------------
// Public enriched branch type
// ---------------------------------------------------------------------------

export interface GeneratedBranch {
	readonly segment: BranchSegment;
	/** Ordered junction list: path[0] = branch origin, path[last] = tip. */
	readonly path: readonly Point2D[];
	readonly depth: number;
	readonly parentIndex: number | null;
}

interface BranchContext {
	readonly rng: () => number;
	readonly config: TreeConfig;
	readonly trunkJunctions: readonly Point2D[];
	readonly blobs: readonly Blob[];
	readonly trunkTop: number;
	readonly trunkBottom: number;
	readonly canopyBottom: number;
	readonly trunkAxisAngle: number;
	readonly branchThicknessScale: number;
	readonly trunkBaseWidth: number;
	readonly trunkTopWidth: number;
}

// ---------------------------------------------------------------------------
// Fork width economics constants (REQ-EV2-F-04)
// ---------------------------------------------------------------------------

/** L1 branch width = this fraction of trunk width at fork point. */
const FORK_WIDTH_FRACTION_MIN = 0.3;
const FORK_WIDTH_FRACTION_MAX = 0.4;

/** L2 branch width = this fraction of parent L1 width at fork point (REQ-EV2-F-04). */
const L2_FORK_WIDTH_FRACTION_MIN = 0.2;
const L2_FORK_WIDTH_FRACTION_MAX = 0.3;

/** ±15° random angle variation around center branchAngle (REQ-EV2-V-01). */
const BRANCH_ANGLE_VARIATION_DEG = 15;

/** Multiplier for variance spread around the fork width center fraction (REQ-EV2-F-04). */
const FORK_WIDTH_VARIANCE_SPREAD_MULTIPLIER = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute trunk width at a given Y position via linear interpolation
 * between base and top widths.
 */
function trunkWidthAtY(
	y: number,
	trunkTop: number,
	trunkBottom: number,
	trunkTopWidth: number,
	trunkBaseWidth: number,
): number {
	const t = (y - trunkTop) / (trunkBottom - trunkTop);
	const clamped = Math.max(0, Math.min(1, t));
	return trunkTopWidth + clamped * (trunkBaseWidth - trunkTopWidth);
}

/**
 * Compute L1 branch widthStart using fork width economics (REQ-EV2-F-04).
 * Width = trunkWidthAtFork * (0.15-0.20 ± branchWidthVariance × random).
 */
function computeForkBranchWidth(
	rng: () => number,
	trunkWidth: number,
	branchWidthVariance: number,
	branchThicknessScale: number,
): number {
	const centerFraction = (FORK_WIDTH_FRACTION_MIN + FORK_WIDTH_FRACTION_MAX) / 2;
	const varianceSpread =
		(branchWidthVariance / 100) *
		(FORK_WIDTH_FRACTION_MAX - FORK_WIDTH_FRACTION_MIN) *
		FORK_WIDTH_VARIANCE_SPREAD_MULTIPLIER;
	const fraction = centerFraction + (rng() * 2 - 1) * varianceSpread;
	const clampedFraction = Math.max(0.05, fraction);
	return trunkWidth * clampedFraction * branchThicknessScale;
}

function blobsOverlap(a: Blob, b: Blob): boolean {
	const dx = (a.cx - b.cx) / (a.rx + b.rx);
	const dy = (a.cy - b.cy) / (a.ry + b.ry);
	return dx * dx + dy * dy < 1;
}

function findIsolatedBlobs(blobs: readonly Blob[]): number[] {
	const isolated: number[] = [];
	for (let i = 0; i < blobs.length; i++) {
		let hasOverlap = false;
		for (let j = 0; j < blobs.length; j++) {
			if (i === j) {
				continue;
			}
			if (blobsOverlap(blobs[i]!, blobs[j]!)) {
				hasOverlap = true;
				break;
			}
		}
		if (!hasOverlap) {
			isolated.push(i);
		}
	}
	return isolated;
}

function computeAxisAngle(x1: number, y1: number, x2: number, y2: number): number {
	return Math.atan2(y2 - y1, x2 - x1);
}

function angleDivergence(a: number, b: number): number {
	let diff = Math.abs(a - b) % (Math.PI * 2);
	if (diff > Math.PI) {
		diff = Math.PI * 2 - diff;
	}
	return diff;
}

/**
 * Snap an endpoint to the same side of the trunk center as the start point so
 * the branch cannot cross the trunk axis (Rule D).
 */
function reflectEndpointIfCrossing(startX: number, endX: number, centerX: number): number {
	const startSide = Math.sign(startX - centerX);
	const endSide = Math.sign(endX - centerX);
	if (startSide === 0 || endSide === 0 || startSide === endSide) {
		return endX;
	}
	return centerX + (centerX - endX);
}

/**
 * Map branchAngle slider (0-100%) to angle range.
 * 0% = wide spread (more horizontal), 100% = vertical growth.
 */
function mapBranchAngleRange(branchAngle: number): { minRad: number; maxRad: number } {
	const t = branchAngle / 100;
	// At 0%: 15-45 degrees from horizontal (wide). At 100%: 60-85 degrees (vertical).
	const minDeg = 15 + t * 45; // 15 -> 60
	const maxDeg = 45 + t * 40; // 45 -> 85
	return {
		minRad: (minDeg * Math.PI) / 180,
		maxRad: (maxDeg * Math.PI) / 180,
	};
}

/**
 * Get the branch count for a given depth level by sampling from the range.
 */
function sampleBranchCountForLevel(rng: () => number, config: TreeConfig, depth: number): number {
	let range: readonly [number, number];
	if (depth === 1) {
		range = config.branchesLevel1Range;
	} else if (depth === 2) {
		range = config.branchesLevel2Range;
	} else {
		range = config.branchesLevel3Range;
	}

	let [min, max] = range;

	// Preferred mirroring or trunkFork: L1 minimum = 2 (need at least one pair)
	if (
		depth === 1 &&
		(config.branchMirroring === BRANCH_MIRRORING.preferred || config.trunkFork)
	) {
		min = Math.max(min, 2);
		max = Math.max(max, min);
	}
	// Preferred mirroring: L2 minimum = 2 (paired sub-branches)
	if (depth === 2 && config.branchMirroring === BRANCH_MIRRORING.preferred) {
		min = Math.max(min, 2);
		max = Math.max(max, min);
	}

	if (min === max) {
		return min;
	}
	return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Check overlap only against branches at the same depth (Rule F).
 * When `relaxOppositeOverlap` is true, skip overlap checks against branches
 * on the opposite side of the trunk (for branchMirroring=allowed).
 */
function overlapsAnySameDepth(
	candidate: BranchSegment,
	branches: readonly GeneratedBranch[],
	depth: number,
	excludeParentSegment?: BranchSegment,
	relaxOppositeOverlap?: boolean,
): boolean {
	const candidateSide = Math.sign(candidate.x2 - candidate.x1);
	for (const other of branches) {
		if (other.depth !== depth) {
			continue;
		}
		if (excludeParentSegment !== undefined && other.segment === excludeParentSegment) {
			continue;
		}
		if (relaxOppositeOverlap === true) {
			const otherSide = Math.sign(other.segment.x2 - other.segment.x1);
			if (candidateSide !== 0 && otherSide !== 0 && candidateSide !== otherSide) {
				continue;
			}
		}
		if (branchesOverlap(candidate, other.segment)) {
			return true;
		}
	}
	return false;
}

// ---------------------------------------------------------------------------
// Branch generation — trunk-origin (depth 1)
// ---------------------------------------------------------------------------

/** Trunk fork arm width: 0.6-0.7 × trunkTopWidth (thicker than normal L1). */
const TRUNK_FORK_WIDTH_FRACTION_MIN = 0.6;
const TRUNK_FORK_WIDTH_FRACTION_MAX = 0.7;

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
	const effectiveSegments = computeEffectiveBranchSegments(ctx.config.branchSegments, 1);
	const path = buildBranchPath(
		ctx.rng,
		accepted.x1,
		accepted.y1,
		accepted.x2,
		accepted.y2,
		effectiveSegments,
		ctx.config.branchCrookedness,
		ctx.config.crookednessMode,
	);
	const tip = path[path.length - 1]!;
	const segmentWithCrookedTip: BranchSegment = {
		...accepted,
		x2: tip.x,
		y2: tip.y,
	};
	branches.push({ segment: segmentWithCrookedTip, path, depth: 1, parentIndex: null });
}

function generateTrunkBranches(ctx: BranchContext, branches: GeneratedBranch[]): void {
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

	// Trunk fork: force first pair from topmost junction with thick widths
	if (config.trunkFork && upperZoneJunctionIndices.length > 0) {
		const topIdx = upperZoneJunctionIndices[upperZoneJunctionIndices.length - 1]!;
		const topJunction = trunkJunctions[topIdx]!;
		const leftForkWidth =
			ctx.trunkTopWidth *
			randomInRange(rng, TRUNK_FORK_WIDTH_FRACTION_MIN, TRUNK_FORK_WIDTH_FRACTION_MAX);

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
			branchesGenerated++;
		}

		const rightForkWidth =
			ctx.trunkTopWidth *
			randomInRange(rng, TRUNK_FORK_WIDTH_FRACTION_MIN, TRUNK_FORK_WIDTH_FRACTION_MAX);
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
			branchesGenerated++;
		}
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

// ---------------------------------------------------------------------------
// Sub-branch generation (depth 2+)
// ---------------------------------------------------------------------------

function generateSubBranches(
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
					const childLength = Math.max(8, parentLength * lengthRatio);

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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fork reduction data for hybrid taper (REQ-EV2-T-01). */
export interface ForkReduction {
	readonly junctionIndex: number;
	readonly reduction: number;
}

interface BranchGenerationResult {
	readonly branches: GeneratedBranch[];
	readonly forkReductions: ForkReduction[];
}

export function generateBranches(
	rng: () => number,
	trunkTop: number,
	trunkBottom: number,
	trunkTopWidth: number,
	config: TreeConfig,
	trunkJunctions: readonly Point2D[],
	blobs: readonly Blob[],
	trunkBaseWidth: number = trunkTopWidth * 2,
): BranchGenerationResult {
	const branchDepth = config.branchDepth;
	if (branchDepth <= 0) {
		return { branches: [], forkReductions: [] };
	}

	const branchThicknessScale = config.branchThickness / 100;
	const canopyBottom = blobs.length > 0 ? getBlobsBounds(blobs).maxY : trunkTop;

	const baseJunction = trunkJunctions[0]!;
	const topJunction = trunkJunctions[trunkJunctions.length - 1]!;
	const trunkAxisAngle = computeAxisAngle(
		baseJunction.x,
		baseJunction.y,
		topJunction.x,
		topJunction.y,
	);

	const ctx: BranchContext = {
		rng,
		config,
		trunkJunctions,
		blobs,
		trunkTop,
		trunkBottom,
		canopyBottom,
		trunkAxisAngle,
		branchThicknessScale,
		trunkBaseWidth,
		trunkTopWidth,
	};

	const branches: GeneratedBranch[] = [];

	// Depth 1: trunk-origin branches
	generateTrunkBranches(ctx, branches);

	// Depth 2+: sub-branches (Rule J: stop deeper levels first when cap hit)
	for (let depth = 1; depth < branchDepth; depth++) {
		generateSubBranches(ctx, branches, depth);
	}

	// Floating-blob fallback (Rule G): last resort emergency branches
	const isolatedBlobIndices = findIsolatedBlobs(blobs);
	for (const idx of isolatedBlobIndices) {
		const blob = blobs[idx]!;
		const reached = branches.some((b) => isPointInSingleBlob(b.segment.x2, b.segment.y2, blob));
		if (reached) {
			continue;
		}

		const branchT = randomInRange(rng, 0.1, 0.3);
		const trunkHeight = trunkBottom - trunkTop;
		const originY = trunkTop + trunkHeight * branchT;
		const originX = sampleTrunkCenterX(trunkJunctions, originY);

		const fallbackSegment: BranchSegment = {
			x1: originX,
			y1: originY,
			x2: blob.cx,
			y2: blob.cy,
			widthStart: randomInRange(rng, 5.25, 8.75) * branchThicknessScale,
			widthEnd: randomInRange(rng, 1.75, 3.5) * branchThicknessScale,
		};
		// Fallback branches are straight (no crookedness) — emergency connectors
		branches.push({
			segment: fallbackSegment,
			path: [
				{ x: originX, y: originY },
				{ x: blob.cx, y: blob.cy },
			],
			depth: 1,
			parentIndex: null,
		});
	}

	// Compute fork reductions for L1 branches (REQ-EV2-T-01)
	// Each L1 branch removes its widthStart from the trunk at its junction
	const forkReductions: ForkReduction[] = [];
	for (const branch of branches) {
		if (branch.depth !== 1) {
			continue;
		}
		// Find closest junction index by Y position
		let closestJunctionIdx = 0;
		let closestDist = Infinity;
		for (let j = 0; j < trunkJunctions.length; j++) {
			const dist = Math.abs(trunkJunctions[j]!.y - branch.segment.y1);
			if (dist < closestDist) {
				closestDist = dist;
				closestJunctionIdx = j;
			}
		}
		forkReductions.push({
			junctionIndex: closestJunctionIdx,
			reduction: branch.segment.widthStart,
		});
	}

	return { branches, forkReductions };
}
