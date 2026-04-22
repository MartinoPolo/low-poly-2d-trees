import type { TreeConfig } from '../types.js';
import { BRANCH_MIRRORING } from '../types.js';
import { branchesOverlap } from './geometry.js';
import type { Blob, BranchSegment } from './shape_types.js';
import type { GeneratedBranch } from './branch_types.js';

// ---------------------------------------------------------------------------
// Branch generation constants
// ---------------------------------------------------------------------------

/** Max total branches across all levels (Rule J). */
export const MAX_TOTAL_BRANCHES = 25;

/** Angle divergence from parent direction (Rule E): 30-60 degrees. */
export const ANGLE_DIVERGENCE_MIN_DEG = 30;
export const ANGLE_DIVERGENCE_MAX_DEG = 60;

/** Child length ratio (Rule K): 20-80% of parent, default center 50%. */
export const CHILD_LENGTH_RATIO_MIN = 0.2;
export const CHILD_LENGTH_RATIO_MAX = 0.68;

// Bumped from 5 — with the upper zone now scaling with trunkSegments (see
// computeZoneSplit), adjacent L1 candidate origins can share junctions and
// repeatedly fail overlap checks. A higher retry budget recovers these.
export const BRANCH_RETRY_ATTEMPTS = 15;

/** ±15° random angle variation around center branchAngle (REQ-EV2-V-01). */
export const BRANCH_ANGLE_VARIATION_DEG = 15;

/** Multiplier for variance spread around the fork width center fraction (REQ-EV2-F-04). */
export const FORK_WIDTH_VARIANCE_SPREAD_MULTIPLIER = 3;

// ---------------------------------------------------------------------------
// Fork width economics constants (REQ-EV2-F-04)
// ---------------------------------------------------------------------------

/** L1 branch width = this fraction of trunk width at fork point. */
const FORK_WIDTH_FRACTION_MIN = 0.3;
const FORK_WIDTH_FRACTION_MAX = 0.4;

/** L2 branch width = this fraction of parent L1 width at fork point (REQ-EV2-F-04). */
export const L2_FORK_WIDTH_FRACTION_MIN = 0.2;
export const L2_FORK_WIDTH_FRACTION_MAX = 0.3;

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/**
 * Compute trunk width at a given Y position via linear interpolation
 * between base and top widths.
 */
export function trunkWidthAtY(
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
export function computeForkBranchWidth(
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

function blobsOverlapEllipse(a: Blob, b: Blob): boolean {
	const dx = (a.cx - b.cx) / (a.rx + b.rx);
	const dy = (a.cy - b.cy) / (a.ry + b.ry);
	return dx * dx + dy * dy < 1;
}

export function findIsolatedBlobs(blobs: readonly Blob[]): number[] {
	const isolated: number[] = [];
	for (let i = 0; i < blobs.length; i++) {
		let hasOverlap = false;
		for (let j = 0; j < blobs.length; j++) {
			if (i === j) {
				continue;
			}
			if (blobsOverlapEllipse(blobs[i]!, blobs[j]!)) {
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

export function computeAxisAngle(x1: number, y1: number, x2: number, y2: number): number {
	return Math.atan2(y2 - y1, x2 - x1);
}

export function angleDivergence(a: number, b: number): number {
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
export function reflectEndpointIfCrossing(startX: number, endX: number, centerX: number): number {
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
export function mapBranchAngleRange(branchAngle: number): { minRad: number; maxRad: number } {
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
export function sampleBranchCountForLevel(
	rng: () => number,
	config: TreeConfig,
	depth: number,
): number {
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
export function overlapsAnySameDepth(
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
