import { createPrng, randomInRange } from './prng.js';
import type { BlobGeometry } from './types/core.js';

/** Deterministic animation delay for per-tree canopy sway phase offset. */
export function computeAnimationDelay(seed: number): number {
	const rng = createPrng(seed);
	return randomInRange(rng, 0, 0.5);
}

/** Deterministic branch sway duration that varies per branch. */
export function computeBranchDuration(seed: number, branchIndex: number): number {
	const rng = createPrng(seed + branchIndex * 1000);
	return randomInRange(rng, 1.5, 4.0);
}

/** Deterministic per-branch phase offset so branches don't start in sync. */
export function computeBranchDelay(seed: number, branchIndex: number): number {
	const rng = createPrng(seed + branchIndex * 2000);
	return randomInRange(rng, 0, 2);
}

/**
 * Compute growth oscillation scale factors from variance (0-100).
 * At 0%: no oscillation (scale = 1). At 100%: branches scale 0.5–1.5.
 */
export function computeGrowthScales(variance: number): {
	minScale: number;
	maxScale: number;
	canopyMinScale: number;
	canopyMaxScale: number;
} {
	const amplitude = (variance / 100) * 0.5;
	const canopyAmplitude = (variance / 100) * 0.08;
	return {
		minScale: 1 - amplitude,
		maxScale: 1 + amplitude,
		canopyMinScale: 1 - canopyAmplitude,
		canopyMaxScale: 1 + canopyAmplitude,
	};
}

/** Returns the maximum Y value across all triangle points in canopy blobs (bottom edge). */
export function computeCanopyBottomY(canopyBlobs: readonly BlobGeometry[]): number {
	let maxY = -Infinity;
	for (const blob of canopyBlobs) {
		for (const tri of blob.triangles) {
			for (const p of tri.points) {
				if (p.y > maxY) {
					maxY = p.y;
				}
			}
		}
	}
	return maxY === -Infinity ? 0 : maxY;
}
