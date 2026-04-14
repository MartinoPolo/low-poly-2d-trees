import type { TreeShape, CustomBlob } from '../types.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT, CUSTOM_BLOB_DEFAULT } from '../types.js';
import { createPrng, randomInRange } from '../prng.js';
import { BOUNDARY_KINDS } from '../boundaries.js';
import type { Blob, ShapeDefinition } from './shape_types.js';

const W = VIEWBOX_WIDTH;
const H = VIEWBOX_HEIGHT;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function ensureLargestBlobInBottomHalf(blobs: Blob[]): void {
	if (blobs.length < 2) {
		return;
	}

	let largestIdx = 0;
	let largestArea = 0;
	for (let i = 0; i < blobs.length; i++) {
		const area = blobs[i]!.rx * blobs[i]!.ry;
		if (area > largestArea) {
			largestArea = area;
			largestIdx = i;
		}
	}

	let bottomIdx = 0;
	let maxCy = -Infinity;
	for (let i = 0; i < blobs.length; i++) {
		if (blobs[i]!.cy > maxCy) {
			maxCy = blobs[i]!.cy;
			bottomIdx = i;
		}
	}

	const blobsCenterY = blobs.reduce((sum, b) => sum + b.cy, 0) / blobs.length;

	if (blobs[largestIdx]!.cy < blobsCenterY && largestIdx !== bottomIdx) {
		const tmp = blobs[largestIdx]!;
		blobs[largestIdx] = blobs[bottomIdx]!;
		blobs[bottomIdx] = tmp;
	}
}

// ---------------------------------------------------------------------------
// Oak blob generator
// ---------------------------------------------------------------------------

const OAK_NON_PRIMARY_MIN_AXIS_DISTANCE_FACTOR = 0.15;
const OAK_NON_PRIMARY_ANGLE_MAX_ATTEMPTS = 5;

function generateOakBlobs(rng: () => number, blobCount: number): Blob[] {
	const blobs: Blob[] = [];
	const centerX = W / 2;
	const canopyCenterY = H * 0.3;
	const spreadRadius = W * 0.22;
	const minAxisDistance = W * OAK_NON_PRIMARY_MIN_AXIS_DISTANCE_FACTOR;

	// D9: primary blob anchored on the trunk axis.
	if (blobCount >= 1) {
		const rx = randomInRange(rng, W * 0.2275, W * 0.385);
		const ry = randomInRange(rng, H * 0.14, H * 0.2625);
		blobs.push({
			cx: centerX,
			cy: canopyCenterY,
			rx,
			ry,
			boundary: BOUNDARY_KINDS.circle,
		});
	}

	// REQ-C-18: non-primary blobs distributed radially around the primary
	// blob in the full 360° range, with a minimum distance from the trunk
	// axis enforced so they never stack directly above the trunk.
	const primary = blobs[0];
	if (primary !== undefined) {
		for (let i = 1; i < blobCount; i++) {
			let acceptedCx = primary.cx;
			let acceptedCy = primary.cy;
			let attempts = 0;
			while (attempts < OAK_NON_PRIMARY_ANGLE_MAX_ATTEMPTS) {
				const angle = rng() * Math.PI * 2;
				const dist = randomInRange(rng, spreadRadius * 0.3, spreadRadius * 0.9);
				const cx = primary.cx + Math.cos(angle) * dist;
				const cy = primary.cy + Math.sin(angle) * dist;
				if (Math.abs(cx - centerX) >= minAxisDistance) {
					acceptedCx = cx;
					acceptedCy = cy;
					break;
				}
				attempts++;
				acceptedCx = cx;
				acceptedCy = cy;
			}
			if (Math.abs(acceptedCx - centerX) < minAxisDistance) {
				const sign = acceptedCx >= centerX ? 1 : -1;
				acceptedCx = centerX + sign * minAxisDistance;
			}
			const rx = randomInRange(rng, W * 0.2275, W * 0.385);
			const ry = randomInRange(rng, H * 0.14, H * 0.2625);
			blobs.push({
				cx: acceptedCx,
				cy: acceptedCy,
				rx,
				ry,
				boundary: BOUNDARY_KINDS.circle,
			});
		}
	}
	ensureLargestBlobInBottomHalf(blobs);
	return blobs;
}

// ---------------------------------------------------------------------------
// Birch blob generator
// ---------------------------------------------------------------------------

/**
 * Birch canopy: thin white trunk with wide-spread blobs. Primary blob is
 * centered, non-primary blobs alternate sides with larger horizontal offsets
 * for a wide, airy canopy.
 */
function generateBirchBlobs(rng: () => number, blobCount: number): Blob[] {
	const blobs: Blob[] = [];
	const centerX = W / 2;
	const canopyCenterY = H * 0.25;

	// Primary blob centered on trunk axis
	if (blobCount >= 1) {
		const rx = randomInRange(rng, W * 0.12, W * 0.22);
		const ry = randomInRange(rng, H * 0.18, H * 0.32);
		blobs.push({
			cx: centerX,
			cy: canopyCenterY,
			rx,
			ry,
			boundary: BOUNDARY_KINDS.circle,
		});
	}

	// Non-primary blobs: wider horizontal spread with varied sizes
	for (let i = 1; i < blobCount; i++) {
		const side = i % 2 === 0 ? 1 : -1;
		const verticalOffset = randomInRange(rng, -H * 0.1, H * 0.1);
		const horizontalOffset = randomInRange(rng, W * 0.06, W * 0.18) * side;
		const cx = centerX + horizontalOffset;
		const cy = canopyCenterY + verticalOffset;
		const rx = randomInRange(rng, W * 0.1, W * 0.2);
		const ry = randomInRange(rng, H * 0.15, H * 0.28);
		blobs.push({
			cx,
			cy,
			rx,
			ry,
			boundary: BOUNDARY_KINDS.circle,
		});
	}
	ensureLargestBlobInBottomHalf(blobs);
	return blobs;
}

// ---------------------------------------------------------------------------
// Maple blob generator
// ---------------------------------------------------------------------------

/**
 * Maple canopy: blobs placed at Y-fork branch tip positions. The maple's
 * identity comes from its visible branching pattern, with similarly-sized
 * blobs sitting at each branch endpoint.
 */
function generateMapleBlobs(rng: () => number, blobCount: number): Blob[] {
	const blobs: Blob[] = [];
	const centerX = W / 2;
	const canopyCenterY = H * 0.3;

	// Place blobs at Y-fork positions: center-top, upper-left, upper-right,
	// then extra blobs fill gaps between main positions
	const positions: Array<{ x: number; y: number }> = [
		{ x: centerX, y: canopyCenterY - H * 0.05 },
		{ x: centerX - W * 0.15, y: canopyCenterY + randomInRange(rng, -5, 5) },
		{ x: centerX + W * 0.15, y: canopyCenterY + randomInRange(rng, -5, 5) },
		{ x: centerX - W * 0.08, y: canopyCenterY - H * 0.08 + randomInRange(rng, -3, 3) },
		{ x: centerX + W * 0.08, y: canopyCenterY - H * 0.08 + randomInRange(rng, -3, 3) },
	];

	for (let i = 0; i < blobCount && i < positions.length; i++) {
		const pos = positions[i]!;
		const rx = randomInRange(rng, W * 0.12, W * 0.18);
		const ry = randomInRange(rng, H * 0.09, H * 0.14);
		blobs.push({
			cx: pos.x + randomInRange(rng, -2, 2),
			cy: pos.y,
			rx,
			ry,
			boundary: BOUNDARY_KINDS.circle,
		});
	}

	// Extra blobs beyond the 5 main positions: scatter radially
	for (let i = positions.length; i < blobCount; i++) {
		const angle = rng() * Math.PI * 2;
		const dist = randomInRange(rng, W * 0.08, W * 0.2);
		const rx = randomInRange(rng, W * 0.1, W * 0.15);
		const ry = randomInRange(rng, H * 0.07, H * 0.12);
		blobs.push({
			cx: centerX + Math.cos(angle) * dist,
			cy: canopyCenterY + Math.sin(angle) * dist * 0.6,
			rx,
			ry,
			boundary: BOUNDARY_KINDS.circle,
		});
	}

	ensureLargestBlobInBottomHalf(blobs);
	return blobs;
}

// ---------------------------------------------------------------------------
// Willow blob generator
// ---------------------------------------------------------------------------

/**
 * Willow canopy: weeping silhouette with small blob clusters positioned lower
 * and wider than oak. The drooping appearance comes from blobs placed below
 * the canopy center, combined with the branch generation reaching downward
 * to blob positions.
 */
function generateWillowBlobs(rng: () => number, blobCount: number): Blob[] {
	const blobs: Blob[] = [];
	const centerX = W / 2;
	const canopyCenterY = H * 0.38;
	const spreadRadius = W * 0.26;

	// Primary blob at canopy center (slightly smaller than oak)
	if (blobCount >= 1) {
		const rx = randomInRange(rng, W * 0.18, W * 0.28);
		const ry = randomInRange(rng, H * 0.1, H * 0.18);
		blobs.push({
			cx: centerX,
			cy: canopyCenterY,
			rx,
			ry,
			boundary: BOUNDARY_KINDS.circle,
		});
	}

	// Non-primary blobs: small clusters spread wide and positioned lower
	for (let i = 1; i < blobCount; i++) {
		const angle = rng() * Math.PI * 2;
		const dist = randomInRange(rng, spreadRadius * 0.4, spreadRadius);
		const cx = centerX + Math.cos(angle) * dist;
		// Push blobs lower (higher cy) for drooping effect
		const cy =
			canopyCenterY + Math.abs(Math.sin(angle)) * H * 0.08 + randomInRange(rng, 0, H * 0.05);
		const rx = randomInRange(rng, W * 0.12, W * 0.22);
		const ry = randomInRange(rng, H * 0.08, H * 0.14);
		blobs.push({
			cx,
			cy,
			rx,
			ry,
			boundary: BOUNDARY_KINDS.circle,
		});
	}
	ensureLargestBlobInBottomHalf(blobs);
	return blobs;
}

// ---------------------------------------------------------------------------
// Custom shape blob generator (issue #10)
// ---------------------------------------------------------------------------

const CUSTOM_BLOB_BASE_RX = W * 0.2275;
const CUSTOM_BLOB_BASE_RY = H * 0.1925;
export const CUSTOM_BLOB_SPREAD_RADIUS = W * 0.22;
export const CUSTOM_BLOB_CANOPY_CENTER_X = W / 2;
export const CUSTOM_BLOB_CANOPY_CENTER_Y = H * 0.3;
const CUSTOM_BLOB_SEED_OFFSET = 3333;

/**
 * Convert stored `customBlobs` entries into render-ready `Blob` objects.
 */
export function generateCustomBlobs(
	customBlobs: readonly CustomBlob[],
	blobCount: number,
	canopyCenterX: number,
	canopyCenterY: number,
	spreadRadius: number,
): Blob[] {
	const effectiveCount = Math.min(Math.max(0, blobCount), customBlobs.length);
	const blobs: Blob[] = [];
	for (let i = 0; i < effectiveCount; i++) {
		const entry = customBlobs[i]!;
		blobs.push({
			cx: canopyCenterX + entry.position.x * spreadRadius,
			cy: canopyCenterY + entry.position.y * spreadRadius,
			rx: CUSTOM_BLOB_BASE_RX * entry.sizeScale,
			ry: CUSTOM_BLOB_BASE_RY * entry.sizeScale,
			boundary: entry.boundaryKind,
			rotationDeg: entry.rotationDeg,
		});
	}
	return blobs;
}

/**
 * Number of PRNG draws consumed by a single `seedCustomBlob` call.
 */
export const DRAWS_PER_BLOB = 2;

function seedCustomBlob(rng: () => number, blobCloseness: number): CustomBlob {
	const spreadFactor = Math.max(0.1, Math.min(1, 1 - blobCloseness / 100)) * 0.9 + 0.1;
	return {
		...CUSTOM_BLOB_DEFAULT,
		position: {
			x: randomInRange(rng, -spreadFactor, spreadFactor),
			y: randomInRange(rng, -spreadFactor, spreadFactor),
		},
	};
}

/**
 * Lazily extend `existing` so that its length ≥ `targetCount`, appending
 * seeded defaults for new entries. Never truncates.
 */
export function growCustomBlobs(
	existing: readonly CustomBlob[],
	targetCount: number,
	seed: number,
	blobCloseness: number,
): readonly CustomBlob[] {
	const safeTarget = Math.max(0, Math.floor(targetCount));
	if (existing.length >= safeTarget) {
		return existing;
	}
	const rng = createPrng(seed + CUSTOM_BLOB_SEED_OFFSET);
	for (let i = 0; i < existing.length * DRAWS_PER_BLOB; i++) {
		rng();
	}
	const result: CustomBlob[] = [...existing];
	for (let i = existing.length; i < safeTarget; i++) {
		result.push(seedCustomBlob(rng, blobCloseness));
	}
	return result;
}

// ---------------------------------------------------------------------------
// Shape definition registry
// ---------------------------------------------------------------------------

export const TRUNK_ENTRY_MIN_PX = 15;

const shapeDefinitions: Record<TreeShape, ShapeDefinition> = {
	oak: {
		trunkBaseWidth: 32,
		trunkTopWidth: 20,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateOakBlobs,
	},
	pine: {
		trunkBaseWidth: 21,
		trunkTopWidth: 12.25,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.8,
		generateBlobs() {
			return [];
		},
	},
	birch: {
		trunkBaseWidth: 16,
		trunkTopWidth: 9,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateBirchBlobs,
	},
	fir: {
		trunkBaseWidth: 19,
		trunkTopWidth: 11,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.82,
		generateBlobs() {
			return [];
		},
	},
	maple: {
		trunkBaseWidth: 28,
		trunkTopWidth: 17.5,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateMapleBlobs,
	},
	willow: {
		trunkBaseWidth: 28,
		trunkTopWidth: 17.5,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateWillowBlobs,
	},
	custom: {
		trunkBaseWidth: 28,
		trunkTopWidth: 17.5,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs() {
			return [];
		},
	},
};

// ---------------------------------------------------------------------------
// Shape definition accessor
// ---------------------------------------------------------------------------

export function getShapeDefinition(shape: TreeShape): ShapeDefinition {
	return shapeDefinitions[shape];
}
