import type { Point2D, BlobGeometry } from '../types.js';

/**
 * Compute fruit slot positions from canopy blob geometry.
 * Samples triangle centroids from canopy blobs as candidate fruit locations.
 * Returns 3-6 fruit positions distributed across the canopy.
 */
export function computeFruitSlots(canopyBlobs: readonly BlobGeometry[]): Point2D[] {
	const candidates: Point2D[] = [];

	for (const blob of canopyBlobs) {
		for (const tri of blob.triangles) {
			const cx = (tri.points[0].x + tri.points[1].x + tri.points[2].x) / 3;
			const cy = (tri.points[0].y + tri.points[1].y + tri.points[2].y) / 3;
			candidates.push({ x: cx, y: cy });
		}
	}

	if (candidates.length === 0) {
		return [];
	}

	// Select evenly spaced candidates for 3-6 fruit positions
	const fruitCount = Math.min(6, Math.max(3, Math.floor(candidates.length / 8)));
	const step = Math.max(1, Math.floor(candidates.length / fruitCount));
	const slots: Point2D[] = [];

	for (let i = 0; i < fruitCount && i * step < candidates.length; i++) {
		const candidate = candidates[i * step]!;
		slots.push({ x: candidate.x, y: candidate.y });
	}

	return slots;
}
