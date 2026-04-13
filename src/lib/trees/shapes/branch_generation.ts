import type { TreeConfig, Point2D } from '../types.js';
import { randomInRange } from '../prng.js';
import { sampleTrunkCenterX } from './trunk.js';
import { isPointInBlobs, isPointInSingleBlob, getBlobsBounds } from './shape_bounds.js';
import {
	computeVisibleBranchLength,
	branchesOverlap,
	resolveBranchLengthRange,
} from './geometry.js';
import type { Blob, BranchSegment } from './shape_types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Trunk-origin branch widths pre-scaled by 1.75 (issue #4 base rescale).
// Shared by rollTrunkBranchCandidate (generic algorithm) and
// generateMapleBranches (maple per-blob branches) so both paths produce
// visually consistent branch proportions.
export const TRUNK_BRANCH_WIDTH_START_MIN = 7;
export const TRUNK_BRANCH_WIDTH_START_MAX = 12.25;
export const TRUNK_BRANCH_WIDTH_END_MIN = 1.75;
export const TRUNK_BRANCH_WIDTH_END_MAX = 5.25;

const BRANCH_ANGLE_MIN_RAD = (30 * Math.PI) / 180;
const BRANCH_ANGLE_MAX_ATTEMPTS = 20;

// Base length ranges for branches at branchLength=100.
const TRUNK_BRANCH_BASE_MIN = 40;
const TRUNK_BRANCH_BASE_MAX = 80;

const BRANCH_RETRY_ATTEMPTS = 3;
const TRUNK_BRANCH_MIN_VISIBLE = 15;

// Fork parameters: angle spread and length scaling per depth level.
const FORK_ANGLE_MIN = 0.25; // ~14° minimum divergence from parent
const FORK_ANGLE_MAX = 0.75; // ~43° maximum divergence from parent
const FORK_LENGTH_SCALE_MIN = 0.5;
const FORK_LENGTH_SCALE_MAX = 0.8;
const FORK_WIDTH_TAPER = 0.55; // child widthEnd = widthStart * taper

// ---------------------------------------------------------------------------
// Hierarchical branching (D1, D2, D3)
// ---------------------------------------------------------------------------

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

interface BranchCandidateContext {
	readonly rng: () => number;
	readonly config: TreeConfig;
	readonly trunkJunctions: readonly Point2D[];
	readonly blobs: readonly Blob[];
	readonly trunkTop: number;
	readonly trunkHeight: number;
	readonly canopyBottom: number;
	readonly trunkAxisAngle: number;
}

/**
 * Snap an endpoint to the same side of the trunk center as the start point so
 * the branch cannot cross the trunk axis. If the endpoint is already on the
 * correct side, returns it unchanged.
 */
function reflectEndpointIfCrossing(startX: number, endX: number, centerX: number): number {
	const startSide = Math.sign(startX - centerX);
	const endSide = Math.sign(endX - centerX);
	if (startSide === 0 || endSide === 0 || startSide === endSide) {
		return endX;
	}
	// Reflect endX about centerX.
	return centerX + (centerX - endX);
}

/**
 * Progressive branchT window per retry attempt. Later attempts push the
 * origin lower on the trunk (away from the dense canopy core) so the branch
 * has more unobstructed length below the canopy.
 */
const TRUNK_BRANCH_T_WINDOWS: readonly [number, number][] = [
	[0.05, 0.35],
	[0.2, 0.5],
	[0.35, 0.6],
];

/**
 * If a branch's endpoint is above the canopy bottom and NOT inside any blob,
 * walk forward along the branch direction (both x and y) until the point
 * lands inside a blob. Returns the adjusted endpoint, or the original if no
 * blob is reached within the extension cap.
 */
function extendTipIntoCanopy(
	startX: number,
	startY: number,
	endX: number,
	endY: number,
	blobs: readonly Blob[],
	canopyBottom: number,
	maxExtension: number,
): { endX: number; endY: number } {
	if (endY >= canopyBottom || isPointInBlobs(endX, endY, blobs)) {
		return { endX, endY };
	}
	const dirX = endX - startX;
	const dirY = endY - startY;
	const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
	if (dirLen === 0) {
		return { endX, endY };
	}
	const ux = dirX / dirLen;
	const uy = dirY / dirLen;
	for (let ext = 1; ext <= maxExtension; ext++) {
		const px = endX + ux * ext;
		const py = endY + uy * ext;
		if (isPointInBlobs(px, py, blobs)) {
			return { endX: px, endY: py };
		}
	}
	return { endX, endY };
}

function rollTrunkBranchCandidate(
	ctx: BranchCandidateContext,
	side: 1 | -1,
	branchThicknessScale: number,
	attempt: number,
): BranchSegment {
	const {
		rng,
		config,
		trunkJunctions,
		blobs,
		trunkTop,
		trunkHeight,
		canopyBottom,
		trunkAxisAngle,
	} = ctx;
	const tWindow = TRUNK_BRANCH_T_WINDOWS[Math.min(attempt, TRUNK_BRANCH_T_WINDOWS.length - 1)]!;
	const branchT = randomInRange(rng, tWindow[0], tWindow[1]);
	const startY = trunkTop + trunkHeight * branchT;
	const startX = sampleTrunkCenterX(trunkJunctions, startY);
	const { min: lenMin, max: lenMax } = resolveBranchLengthRange(
		TRUNK_BRANCH_BASE_MIN,
		TRUNK_BRANCH_BASE_MAX,
		config.branchLength,
		config.branchLengthVariance,
		true,
	);
	const length = randomInRange(rng, lenMin, lenMax);

	let upAngle = 0;
	for (let angleAttempt = 0; angleAttempt < BRANCH_ANGLE_MAX_ATTEMPTS; angleAttempt++) {
		upAngle = randomInRange(rng, 0.3, 1.2);
		const candidateAngle = Math.atan2(
			-Math.sin(upAngle) * length,
			Math.cos(upAngle) * length * side,
		);
		if (angleDivergence(candidateAngle, trunkAxisAngle) >= BRANCH_ANGLE_MIN_RAD) {
			break;
		}
	}

	const rawEndX = startX + Math.cos(upAngle) * length * side;
	const rawEndY = startY - Math.sin(upAngle) * length;
	const reflectedEndX = reflectEndpointIfCrossing(startX, rawEndX, startX);
	const extended = extendTipIntoCanopy(
		startX,
		startY,
		reflectedEndX,
		rawEndY,
		blobs,
		canopyBottom,
		40,
	);
	const widthStart =
		randomInRange(rng, TRUNK_BRANCH_WIDTH_START_MIN, TRUNK_BRANCH_WIDTH_START_MAX) *
		branchThicknessScale;
	const widthEnd =
		randomInRange(rng, TRUNK_BRANCH_WIDTH_END_MIN, TRUNK_BRANCH_WIDTH_END_MAX) *
		branchThicknessScale;

	return {
		x1: startX,
		y1: startY,
		x2: extended.endX,
		y2: extended.endY,
		widthStart,
		widthEnd,
	};
}

/**
 * Generate a child branch that forks from the TIP of a parent branch.
 * The direction is relative to the parent's direction ± a fork angle,
 * creating natural Y-shaped branching.
 */
function rollForkCandidate(
	rng: () => number,
	parent: BranchSegment,
	forkAngleSign: 1 | -1,
	blobs: readonly Blob[],
	canopyBottom: number,
): BranchSegment {
	const parentDirX = parent.x2 - parent.x1;
	const parentDirY = parent.y2 - parent.y1;
	const parentLength = Math.sqrt(parentDirX * parentDirX + parentDirY * parentDirY);
	const parentAngle = Math.atan2(parentDirY, parentDirX);

	const forkAngle = randomInRange(rng, FORK_ANGLE_MIN, FORK_ANGLE_MAX) * forkAngleSign;
	const childAngle = parentAngle + forkAngle;
	const lengthScale = randomInRange(rng, FORK_LENGTH_SCALE_MIN, FORK_LENGTH_SCALE_MAX);
	const childLength = Math.max(8, parentLength * lengthScale);

	const rawEndX = parent.x2 + Math.cos(childAngle) * childLength;
	const rawEndY = parent.y2 + Math.sin(childAngle) * childLength;

	const extended = extendTipIntoCanopy(
		parent.x2,
		parent.y2,
		rawEndX,
		rawEndY,
		blobs,
		canopyBottom,
		25,
	);

	const widthStart = parent.widthEnd;
	const widthEnd = Math.max(0.5, widthStart * FORK_WIDTH_TAPER);

	return {
		x1: parent.x2,
		y1: parent.y2,
		x2: extended.endX,
		y2: extended.endY,
		widthStart,
		widthEnd,
	};
}

function overlapsAny(
	candidate: BranchSegment,
	existing: readonly BranchSegment[],
	excludeParent?: BranchSegment,
): boolean {
	for (const other of existing) {
		if (excludeParent !== undefined && other === excludeParent) {
			continue;
		}
		if (branchesOverlap(candidate, other)) {
			return true;
		}
	}
	return false;
}

export function generateBranches(
	rng: () => number,
	trunkTop: number,
	trunkBottom: number,
	_trunkTopWidth: number,
	config: TreeConfig,
	trunkJunctions: readonly Point2D[],
	blobs: readonly Blob[],
): BranchSegment[] {
	const branchDepth = config.branchDepth;
	if (branchDepth <= 0) {
		return [];
	}

	const branchCount = config.branchCount;
	if (branchCount <= 0) {
		return [];
	}

	const branchThicknessScale = config.branchThickness / 100;
	const trunkBranchRatio = config.trunkBranchRatio / 100;

	const branches: BranchSegment[] = [];
	const trunkHeight = trunkBottom - trunkTop;
	const canopyBottom = blobs.length > 0 ? getBlobsBounds(blobs).maxY : trunkTop;

	const baseJunction = trunkJunctions[0]!;
	const topJunction = trunkJunctions[trunkJunctions.length - 1]!;
	const trunkAxisAngle = computeAxisAngle(
		baseJunction.x,
		baseJunction.y,
		topJunction.x,
		topJunction.y,
	);

	const ctx: BranchCandidateContext = {
		rng,
		config,
		trunkJunctions,
		blobs,
		trunkTop,
		trunkHeight,
		canopyBottom,
		trunkAxisAngle,
	};

	const trunkBranchCount = Math.max(1, Math.round(branchCount * trunkBranchRatio));

	// --- Trunk-origin branches (depth 1) ---
	const startSide = rng() < 0.5 ? 0 : 1;
	for (let i = 0; i < trunkBranchCount; i++) {
		const side: 1 | -1 = (i + startSide) % 2 === 0 ? 1 : -1;
		let accepted: BranchSegment | null = null;
		for (let attempt = 0; attempt < BRANCH_RETRY_ATTEMPTS; attempt++) {
			const candidate = rollTrunkBranchCandidate(ctx, side, branchThicknessScale, attempt);
			if (overlapsAny(candidate, branches)) {
				continue;
			}
			const visible = computeVisibleBranchLength(candidate, blobs, []);
			if (visible < TRUNK_BRANCH_MIN_VISIBLE) {
				continue;
			}
			accepted = candidate;
			break;
		}
		if (accepted !== null) {
			branches.push(accepted);
		}
	}

	const trunkBranchEndIndex = branches.length;

	// --- Forking sub-branches (depth >= 2) ---
	// Each trunk-origin branch tip forks into 1-2 child branches.
	// Children continue the parent's direction ± a fork angle.
	if (branchDepth >= 2) {
		for (let i = 0; i < trunkBranchEndIndex; i++) {
			const parent = branches[i]!;
			const forkCount = 1 + Math.floor(rng() * 2); // 1-2 forks
			for (let f = 0; f < forkCount; f++) {
				const forkSign: 1 | -1 = f === 0 ? 1 : -1;
				const candidate = rollForkCandidate(rng, parent, forkSign, blobs, canopyBottom);
				if (!overlapsAny(candidate, branches, parent)) {
					branches.push(candidate);
				}
			}
		}
	}

	const depth2EndIndex = branches.length;

	// --- Forking sub-sub-branches (depth >= 3) ---
	// Each depth-2 fork tip gets 1 child branch.
	if (branchDepth >= 3) {
		for (let i = trunkBranchEndIndex; i < depth2EndIndex; i++) {
			const parent = branches[i]!;
			const forkSign: 1 | -1 = rng() < 0.5 ? 1 : -1;
			const candidate = rollForkCandidate(rng, parent, forkSign, blobs, canopyBottom);
			if (!overlapsAny(candidate, branches, parent)) {
				branches.push(candidate);
			}
		}
	}

	// --- Floating-blob fallback (exempt from visibility/crossing checks) ---
	const isolatedBlobIndices = findIsolatedBlobs(blobs);
	for (const idx of isolatedBlobIndices) {
		const blob = blobs[idx]!;
		// Check if any existing branch tip is inside this blob
		const reached = branches.some((b) => isPointInSingleBlob(b.x2, b.y2, blob));
		if (reached) {
			continue;
		}
		const branchT = randomInRange(rng, 0.1, 0.3);
		const originY = trunkTop + trunkHeight * branchT;
		const originX = sampleTrunkCenterX(trunkJunctions, originY);

		branches.push({
			x1: originX,
			y1: originY,
			x2: blob.cx,
			y2: blob.cy,
			widthStart: randomInRange(rng, 5.25, 8.75) * branchThicknessScale,
			widthEnd: randomInRange(rng, 1.75, 3.5) * branchThicknessScale,
		});
	}

	return branches;
}
