import type { TreeConfig, Point2D } from '../types.js';
import { VIEWBOX_WIDTH } from '../types.js';
import { randomInRange } from '../prng.js';
import { sampleTrunkCenterX, computeZoneSplit } from './trunk.js';
import { isPointInSingleBlob, getBlobsBounds } from './shape_bounds.js';
import {
	computeVisibleBranchLength,
	branchesOverlap,
	resolveBranchLengthRange,
} from './geometry.js';
import type { Blob, BranchSegment } from './shape_types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Max total branches across all levels (Rule J). */
const MAX_TOTAL_BRANCHES = 25;

/** Minimum visible branch length in pixels (Rule C). */
const MIN_VISIBLE_LENGTH = 5;

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
const FORK_WIDTH_FRACTION_MIN = 0.15;
const FORK_WIDTH_FRACTION_MAX = 0.2;

/** L2 branch width = this fraction of parent L1 width at fork point (REQ-EV2-F-04). */
const L2_FORK_WIDTH_FRACTION_MIN = 0.1;
const L2_FORK_WIDTH_FRACTION_MAX = 0.15;

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

	const [min, max] = range;
	if (min === max) {
		return min;
	}
	return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Check overlap only against branches at the same depth (Rule F).
 */
function overlapsAnySameDepth(
	candidate: BranchSegment,
	branches: readonly GeneratedBranch[],
	depth: number,
	excludeParentSegment?: BranchSegment,
): boolean {
	for (const other of branches) {
		if (other.depth !== depth) {
			continue;
		}
		if (excludeParentSegment !== undefined && other.segment === excludeParentSegment) {
			continue;
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

function generateTrunkBranches(ctx: BranchContext, branches: GeneratedBranch[]): void {
	const { rng, config, trunkJunctions, blobs, trunkTop, trunkAxisAngle } = ctx;
	const count = sampleBranchCountForLevel(rng, config, 1);
	if (count <= 0) {
		return;
	}

	// REQ-EV2-TZ-01, G-03: L1 branches only at upper-zone junctions.
	// Pass the ACTUAL segment count (trunkJunctions.length - 1) rather than
	// config.trunkSegments — buildCrookedPath caps segmentCount at 5, so
	// config values above that would make the effective lower-zone computation
	// overshoot and leave zero eligible upper-zone junctions (fallback to a
	// single middle junction, which forces every L1 branch to the same origin
	// and triggers the overlap-rejection cascade).
	const maxL1 = config.branchesLevel1Range[1];
	const actualSegments = Math.max(1, trunkJunctions.length - 1);
	const { lowerZoneSegments } = computeZoneSplit(actualSegments, maxL1);
	// Upper-zone junctions: start at index `lowerZoneSegments`, exclude tip (last junction).
	// Clamp to actual junction count in case trunkSegments < minimum enforced by zone split.
	const effectiveLowerSegments = Math.min(lowerZoneSegments, trunkJunctions.length - 2);
	const upperZoneJunctionIndices: number[] = [];
	for (let j = Math.max(1, effectiveLowerSegments); j < trunkJunctions.length - 1; j++) {
		upperZoneJunctionIndices.push(j);
	}
	// Fallback: if no upper-zone junctions available, use middle junction
	if (upperZoneJunctionIndices.length === 0 && trunkJunctions.length >= 2) {
		upperZoneJunctionIndices.push(Math.floor(trunkJunctions.length / 2));
	}

	const angleRange = mapBranchAngleRange(config.branchAngle);

	// Rule I: L1 alternates left/right with random start
	const startSide = rng() < 0.5 ? 0 : 1;

	for (let i = 0; i < count; i++) {
		if (branches.length >= MAX_TOTAL_BRANCHES) {
			return;
		}

		const side: 1 | -1 = (i + startSide) % 2 === 0 ? 1 : -1;
		let accepted: BranchSegment | null = null;

		for (let attempt = 0; attempt < BRANCH_RETRY_ATTEMPTS; attempt++) {
			// REQ-EV2-G-03: pick a random upper-zone junction
			const junctionIdx =
				upperZoneJunctionIndices[Math.floor(rng() * upperZoneJunctionIndices.length)]!;
			const junction = trunkJunctions[junctionIdx]!;
			const startY = junction.y;
			const startX = junction.x;

			const { min: lenMin, max: lenMax } = resolveBranchLengthRange(
				TRUNK_BRANCH_BASE_MIN,
				TRUNK_BRANCH_BASE_MAX,
				config.branchLength,
				config.branchLengthVariance,
				true,
			);
			const length = randomInRange(rng, lenMin, lenMax);

			// Generate branch angle within the mapped range + ±15° variation (REQ-EV2-V-01)
			const baseUpAngle = randomInRange(rng, angleRange.minRad, angleRange.maxRad);
			const angleVariationRad =
				((rng() * 2 - 1) * BRANCH_ANGLE_VARIATION_DEG * Math.PI) / 180;
			const upAngle = baseUpAngle + angleVariationRad;

			// Check angle divergence from trunk axis (Rule E)
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

			// Fork width economics (REQ-EV2-F-04): branch width = fraction of trunk width at fork
			const trunkWidthAtFork = trunkWidthAtY(
				startY,
				trunkTop,
				ctx.trunkBottom,
				ctx.trunkTopWidth,
				ctx.trunkBaseWidth,
			);
			const widthStart = computeForkBranchWidth(
				rng,
				trunkWidthAtFork,
				config.branchWidthVariance,
				ctx.branchThicknessScale,
			);
			const widthEnd = Math.max(0.5, widthStart * 0.4);

			const candidate: BranchSegment = {
				x1: startX,
				y1: startY,
				x2: endX,
				y2: rawEndY,
				widthStart,
				widthEnd,
			};

			// Rule F: overlap check same-depth only
			if (overlapsAnySameDepth(candidate, branches, 1)) {
				continue;
			}

			// Rule C: min visible length
			const visible = computeVisibleBranchLength(candidate, blobs, []);
			if (visible < MIN_VISIBLE_LENGTH) {
				continue;
			}

			accepted = candidate;
			break;
		}

		if (accepted !== null) {
			branches.push({ segment: accepted, depth: 1, parentIndex: null });
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
	const { rng, config, blobs } = ctx;
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

		const parent = branches[parentIndex]!.segment;
		const childCount = sampleBranchCountForLevel(rng, config, targetDepth);
		if (childCount <= 0) {
			continue;
		}

		// BR-5: Children originate from upper 50-100% of parent length
		const parentDirX = parent.x2 - parent.x1;
		const parentDirY = parent.y2 - parent.y1;
		const parentLength = Math.sqrt(parentDirX * parentDirX + parentDirY * parentDirY);
		const parentAngle = Math.atan2(parentDirY, parentDirX);

		for (let c = 0; c < childCount; c++) {
			if (branches.length >= MAX_TOTAL_BRANCHES) {
				return;
			}

			let accepted: BranchSegment | null = null;

			for (let attempt = 0; attempt < BRANCH_RETRY_ATTEMPTS; attempt++) {
				// Origin along upper 50-100% of parent
				const originT = randomInRange(rng, 0.5, 1.0);
				const originX = parent.x1 + parentDirX * originT;
				const originY = parent.y1 + parentDirY * originT;

				// Rule K: child length 20-80% of parent
				const lengthRatio = randomInRange(
					rng,
					CHILD_LENGTH_RATIO_MIN,
					CHILD_LENGTH_RATIO_MAX,
				);
				const childLength = Math.max(8, parentLength * lengthRatio);

				// Rule E: angle divergence 30-60 degrees from parent direction
				const divergenceDeg = randomInRange(
					rng,
					ANGLE_DIVERGENCE_MIN_DEG,
					ANGLE_DIVERGENCE_MAX_DEG,
				);
				const divergenceRad = (divergenceDeg * Math.PI) / 180;
				const forkSign: 1 | -1 = rng() < 0.5 ? 1 : -1;
				const childAngle = parentAngle + divergenceRad * forkSign;

				const endX = originX + Math.cos(childAngle) * childLength;
				const endY = originY + Math.sin(childAngle) * childLength;

				// REQ-EV2-F-04: L2+ fork width = 10-15% of parent L1 width at fork
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
				// Parent widthStart already includes thickness scaling from L1 fork economics
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

				// Rule F: same-depth overlap only
				if (overlapsAnySameDepth(candidate, branches, targetDepth, parent)) {
					continue;
				}

				// Rule C: min visible length
				const visible = computeVisibleBranchLength(candidate, blobs, []);
				if (visible < MIN_VISIBLE_LENGTH) {
					continue;
				}

				accepted = candidate;
				break;
			}

			if (accepted !== null) {
				branches.push({ segment: accepted, depth: targetDepth, parentIndex });
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

		branches.push({
			segment: {
				x1: originX,
				y1: originY,
				x2: blob.cx,
				y2: blob.cy,
				widthStart: randomInRange(rng, 5.25, 8.75) * branchThicknessScale,
				widthEnd: randomInRange(rng, 1.75, 3.5) * branchThicknessScale,
			},
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
