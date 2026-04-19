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
// Cypress blob generator (#63)
// ---------------------------------------------------------------------------

/**
 * Cypress canopy: 1-2 tall teardrop blobs stacked vertically, forming a tall
 * narrow column silhouette like an Italian pencil cypress.
 */
function generateCypressBlobs(rng: () => number, blobCount: number): Blob[] {
	const blobs: Blob[] = [];
	const centerX = W / 2;
	const effectiveCount = Math.max(1, Math.min(blobCount, 3));

	// Primary teardrop — tall and narrow, centered high
	blobs.push({
		cx: centerX,
		cy: H * 0.22,
		rx: W * 0.1,
		ry: H * 0.22,
		boundary: BOUNDARY_KINDS.teardrop,
		rotationDeg: 0,
	});

	// Secondary teardrop stacked below
	if (effectiveCount >= 2) {
		blobs.push({
			cx: centerX + randomInRange(rng, -2, 2),
			cy: H * 0.4,
			rx: W * 0.12,
			ry: H * 0.18,
			boundary: BOUNDARY_KINDS.teardrop,
			rotationDeg: 0,
		});
	}

	// Optional third blob for denser config
	if (effectiveCount >= 3) {
		blobs.push({
			cx: centerX + randomInRange(rng, -3, 3),
			cy: H * 0.32,
			rx: W * 0.08,
			ry: H * 0.14,
			boundary: BOUNDARY_KINDS.circle,
		});
	}

	return blobs;
}

// ---------------------------------------------------------------------------
// Apple blob generator (#63)
// ---------------------------------------------------------------------------

/**
 * Apple canopy: 1-3 round blobs forming a compact, round silhouette.
 * Shorter and rounder than oak.
 */
function generateAppleBlobs(rng: () => number, blobCount: number): Blob[] {
	const blobs: Blob[] = [];
	const centerX = W / 2;
	const canopyCenterY = H * 0.32;
	const effectiveCount = Math.max(1, Math.min(blobCount, 4));

	// Primary large round blob
	const r = randomInRange(rng, W * 0.22, W * 0.3);
	blobs.push({
		cx: centerX,
		cy: canopyCenterY,
		rx: r,
		ry: r * 0.9,
		boundary: BOUNDARY_KINDS.circle,
	});

	// Secondary blobs tightly clustered around center
	for (let i = 1; i < effectiveCount; i++) {
		const angle = ((i - 1) / Math.max(1, effectiveCount - 1)) * Math.PI * 2;
		const dist = randomInRange(rng, W * 0.05, W * 0.12);
		const cx = centerX + Math.cos(angle) * dist;
		const cy = canopyCenterY + Math.sin(angle) * dist * 0.6;
		const r = randomInRange(rng, W * 0.15, W * 0.22);
		blobs.push({
			cx,
			cy,
			rx: r,
			ry: r * 0.9,
			boundary: BOUNDARY_KINDS.circle,
		});
	}

	ensureLargestBlobInBottomHalf(blobs);
	return blobs;
}

// ---------------------------------------------------------------------------
// Cherry blob generator (#63)
// ---------------------------------------------------------------------------

/**
 * Cherry canopy: 3-5 blobs arranged wider than tall, creating a horizontal
 * spreading shape reminiscent of a sakura tree.
 */
function generateCherryBlobs(rng: () => number, blobCount: number): Blob[] {
	const blobs: Blob[] = [];
	const centerX = W / 2;
	const canopyCenterY = H * 0.32;
	const effectiveCount = Math.max(2, Math.min(blobCount, 6));
	const spreadX = W * 0.35;

	for (let i = 0; i < effectiveCount; i++) {
		// Distribute along a horizontal arc
		const t = effectiveCount === 1 ? 0.5 : i / (effectiveCount - 1);
		const x = centerX + (t - 0.5) * 2 * spreadX + randomInRange(rng, -5, 5);
		const y = canopyCenterY + randomInRange(rng, -H * 0.04, H * 0.04);
		// Wider than tall for horizontal spread
		const rx = randomInRange(rng, W * 0.15, W * 0.25);
		const ry = randomInRange(rng, H * 0.08, H * 0.14);
		blobs.push({
			cx: x,
			cy: y,
			rx,
			ry,
			boundary: BOUNDARY_KINDS.circle,
		});
	}

	ensureLargestBlobInBottomHalf(blobs);
	return blobs;
}

// ---------------------------------------------------------------------------
// Bush blob generator (#63)
// ---------------------------------------------------------------------------

/**
 * Bush canopy: 1-2 blobs sitting directly on the ground line with no trunk
 * gap. Represents a small ground-level shrub.
 */
function generateBushBlobs(rng: () => number, blobCount: number): Blob[] {
	const blobs: Blob[] = [];
	const centerX = W / 2;
	const groundY = H * 0.82;
	const effectiveCount = Math.max(1, Math.min(blobCount, 3));

	blobs.push({
		cx: centerX,
		cy: groundY,
		rx: randomInRange(rng, W * 0.18, W * 0.26),
		ry: randomInRange(rng, H * 0.1, H * 0.16),
		boundary: BOUNDARY_KINDS.circle,
	});

	if (effectiveCount >= 2) {
		const side = rng() < 0.5 ? -1 : 1;
		blobs.push({
			cx: centerX + side * randomInRange(rng, W * 0.06, W * 0.14),
			cy: groundY + randomInRange(rng, -H * 0.02, H * 0.02),
			rx: randomInRange(rng, W * 0.14, W * 0.2),
			ry: randomInRange(rng, H * 0.08, H * 0.12),
			boundary: BOUNDARY_KINDS.circle,
		});
	}

	if (effectiveCount >= 3) {
		const side = rng() < 0.5 ? -1 : 1;
		blobs.push({
			cx: centerX + side * randomInRange(rng, W * 0.04, W * 0.1),
			cy: groundY + randomInRange(rng, -H * 0.01, H * 0.01),
			rx: randomInRange(rng, W * 0.1, W * 0.16),
			ry: randomInRange(rng, H * 0.06, H * 0.1),
			boundary: BOUNDARY_KINDS.circle,
		});
	}

	return blobs;
}

// ---------------------------------------------------------------------------
// Baobab blob generator (#63)
// ---------------------------------------------------------------------------

/**
 * Baobab canopy: 2-3 small blobs clustered at the very top of the tree.
 * The trunk is the dominant visual feature; canopy is minimal.
 */
function generateBaobabBlobs(rng: () => number, blobCount: number): Blob[] {
	const blobs: Blob[] = [];
	const centerX = W / 2;
	const topY = H * 0.15;
	const effectiveCount = Math.max(1, Math.min(blobCount, 4));

	for (let i = 0; i < effectiveCount; i++) {
		const angle = (i / effectiveCount) * Math.PI * 2;
		const dist = i === 0 ? 0 : randomInRange(rng, W * 0.06, W * 0.14);
		const cx = centerX + Math.cos(angle) * dist;
		const cy = topY + Math.sin(angle) * dist * 0.5 + randomInRange(rng, -3, 3);
		blobs.push({
			cx,
			cy,
			rx: randomInRange(rng, W * 0.1, W * 0.16),
			ry: randomInRange(rng, H * 0.06, H * 0.1),
			boundary: BOUNDARY_KINDS.circle,
		});
	}

	return blobs;
}

// ---------------------------------------------------------------------------
// Acacia blob generator (#63)
// ---------------------------------------------------------------------------

/**
 * Acacia canopy: wide flat blobs in a narrow horizontal band, creating the
 * characteristic flat-topped umbrella/parasol silhouette.
 */
function generateAcaciaBlobs(rng: () => number, blobCount: number): Blob[] {
	const blobs: Blob[] = [];
	const centerX = W / 2;
	const canopyY = H * 0.2;
	const effectiveCount = Math.max(2, Math.min(blobCount, 5));
	const spreadX = W * 0.38;

	for (let i = 0; i < effectiveCount; i++) {
		const t = effectiveCount === 1 ? 0.5 : i / (effectiveCount - 1);
		const x = centerX + (t - 0.5) * 2 * spreadX + randomInRange(rng, -3, 3);
		const y = canopyY + randomInRange(rng, -H * 0.02, H * 0.02);
		// Very wide, very flat blobs
		const rx = randomInRange(rng, W * 0.2, W * 0.3);
		const ry = randomInRange(rng, H * 0.04, H * 0.07);
		blobs.push({
			cx: x,
			cy: y,
			rx,
			ry,
			boundary: BOUNDARY_KINDS.circle,
		});
	}

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

export const TRUNK_ENTRY_MIN_PX = 25;

const shapeDefinitions: Record<TreeShape, ShapeDefinition> = {
	oak: {
		trunkBaseWidth: 53,
		trunkTopWidth: 33,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateOakBlobs,
		styleParameters: {
			blobRxRyRatio: 1.2,
			blobVerticalOffset: 0,
			blobBoundary: 'circle',
			blobClusterBehavior: 0.5,
			trunkTipWeight: 1.0,
		},
		envelopeDefaults: {
			canopyCenterY: H * 0.3,
			baseRadiusX: W * 0.576,
			baseRadiusY: H * 0.396,
		},
	},
	pine: {
		trunkBaseWidth: 35,
		trunkTopWidth: 20,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.8,
		generateBlobs() {
			return [];
		},
	},
	birch: {
		trunkBaseWidth: 27,
		trunkTopWidth: 15,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateBirchBlobs,
		styleParameters: {
			blobRxRyRatio: 1.5,
			blobVerticalOffset: 0,
			blobBoundary: 'circle',
			blobClusterBehavior: 0.4,
			trunkTipWeight: 0.7,
		},
		envelopeDefaults: {
			canopyCenterY: H * 0.25,
			baseRadiusX: W * 0.504,
			baseRadiusY: H * 0.504,
		},
	},
	fir: {
		trunkBaseWidth: 32,
		trunkTopWidth: 18,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.82,
		generateBlobs() {
			return [];
		},
	},
	maple: {
		trunkBaseWidth: 47,
		trunkTopWidth: 29,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateMapleBlobs,
		styleParameters: {
			blobRxRyRatio: 1.1,
			blobVerticalOffset: 0,
			blobBoundary: 'circle',
			blobClusterBehavior: 0.4,
			trunkTipWeight: 0.0,
		},
		envelopeDefaults: {
			canopyCenterY: H * 0.3,
			baseRadiusX: W * 0.54,
			baseRadiusY: H * 0.36,
		},
	},
	willow: {
		trunkBaseWidth: 47,
		trunkTopWidth: 29,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateWillowBlobs,
		styleParameters: {
			blobRxRyRatio: 1.3,
			blobVerticalOffset: 25,
			blobBoundary: 'circle',
			blobClusterBehavior: 0.3,
			trunkTipWeight: 0.5,
		},
		envelopeDefaults: {
			canopyCenterY: H * 0.38,
			baseRadiusX: W * 0.576,
			baseRadiusY: H * 0.36,
		},
	},
	cypress: {
		trunkBaseWidth: 23,
		trunkTopWidth: 13,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.2,
		generateBlobs: generateCypressBlobs,
	},
	apple: {
		trunkBaseWidth: 53,
		trunkTopWidth: 37,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.55,
		generateBlobs: generateAppleBlobs,
		styleParameters: {
			blobRxRyRatio: 1.0,
			blobVerticalOffset: 0,
			blobBoundary: 'circle',
			blobClusterBehavior: 0.6,
			trunkTipWeight: 0.8,
		},
		envelopeDefaults: {
			canopyCenterY: H * 0.32,
			baseRadiusX: W * 0.504,
			baseRadiusY: H * 0.396,
		},
	},
	cherry: {
		trunkBaseWidth: 37,
		trunkTopWidth: 23,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateCherryBlobs,
		styleParameters: {
			blobRxRyRatio: 1.8,
			blobVerticalOffset: 0,
			blobBoundary: 'circle',
			blobClusterBehavior: 0.3,
			trunkTipWeight: 0.5,
		},
		envelopeDefaults: {
			canopyCenterY: H * 0.32,
			baseRadiusX: W * 0.72,
			baseRadiusY: H * 0.288,
		},
	},
	bush: {
		trunkBaseWidth: 17,
		trunkTopWidth: 10,
		trunkBottom: H * 0.92,
		defaultTrunkTop: H * 0.88,
		generateBlobs: generateBushBlobs,
	},
	baobab: {
		trunkBaseWidth: 83,
		trunkTopWidth: 33,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.25,
		generateBlobs: generateBaobabBlobs,
		styleParameters: {
			blobRxRyRatio: 1.2,
			blobVerticalOffset: 0,
			blobBoundary: 'circle',
			blobClusterBehavior: 0.6,
			trunkTipWeight: 0.8,
		},
		envelopeDefaults: {
			canopyCenterY: H * 0.15,
			baseRadiusX: W * 0.396,
			baseRadiusY: H * 0.216,
		},
	},
	acacia: {
		trunkBaseWidth: 27,
		trunkTopWidth: 17,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.35,
		generateBlobs: generateAcaciaBlobs,
		styleParameters: {
			blobRxRyRatio: 3.5,
			blobVerticalOffset: 0,
			blobBoundary: 'circle',
			blobClusterBehavior: 0.7,
			trunkTipWeight: 0.5,
		},
		envelopeDefaults: {
			canopyCenterY: H * 0.2,
			baseRadiusX: W * 0.756,
			baseRadiusY: H * 0.18,
		},
	},
	custom: {
		trunkBaseWidth: 47,
		trunkTopWidth: 29,
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
