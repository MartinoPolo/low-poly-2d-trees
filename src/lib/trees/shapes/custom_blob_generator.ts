import type { CustomBlob } from '../types.js';
import { VIEWBOX_WIDTH, CUSTOM_BLOB_DEFAULT } from '../types.js';
import { createPrng, randomInRange } from '../prng.js';
import type { Blob } from './shape_types.js';
import { treeY, treeSizeW, treeSizeH } from './tree_scale.js';

const W = VIEWBOX_WIDTH;

// ---------------------------------------------------------------------------
// Custom blob generator constants (issue #10)
// ---------------------------------------------------------------------------

const CUSTOM_BLOB_BASE_RX = treeSizeW(0.2275);
const CUSTOM_BLOB_BASE_RY = treeSizeH(0.1925);
export const CUSTOM_BLOB_SPREAD_RADIUS = treeSizeW(0.22);
export const CUSTOM_BLOB_CANOPY_CENTER_X = W / 2;
export const CUSTOM_BLOB_CANOPY_CENTER_Y = treeY(0.3);
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
