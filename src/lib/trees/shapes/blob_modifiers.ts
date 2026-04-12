import { VIEWBOX_WIDTH } from '../types.js';
import { BOUNDARIES } from '../boundaries.js';
import type { Blob } from './shape_types.js';

const W = VIEWBOX_WIDTH;

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Blob depth ordering
// ---------------------------------------------------------------------------

function isPointInSingleBlob(x: number, y: number, b: Blob): boolean {
	return BOUNDARIES[b.boundary].contains(x, y, b.cx, b.cy, b.rx, b.ry, b.rotationDeg ?? 0);
}

function blobContains(outer: Blob, inner: Blob): boolean {
	const testPoints: readonly [number, number][] = [
		[inner.cx, inner.cy],
		[inner.cx - inner.rx, inner.cy],
		[inner.cx + inner.rx, inner.cy],
		[inner.cx, inner.cy - inner.ry],
		[inner.cx, inner.cy + inner.ry],
	];

	return testPoints.every(([px, py]) => isPointInSingleBlob(px, py, outer));
}

export function assignBlobDepths(blobs: readonly Blob[], rng: () => number): number[] {
	const count = blobs.length;
	const depths = Array.from({ length: count }, () => rng());

	for (let outer = 0; outer < count; outer++) {
		for (let inner = 0; inner < count; inner++) {
			if (outer === inner) {
				continue;
			}
			if (blobContains(blobs[outer]!, blobs[inner]!)) {
				if (depths[inner]! <= depths[outer]!) {
					depths[inner] = depths[outer]! + 0.001;
				}
			}
		}
	}

	return depths;
}

// ---------------------------------------------------------------------------
// Blob size variance (ratio-based: D8)
// ---------------------------------------------------------------------------

export function applyBlobSizeVariance(blobs: Blob[], blobSizeVariance: number): void {
	if (blobs.length <= 1) {
		return;
	}

	const minScale = 1 / blobSizeVariance;

	for (let i = 1; i < blobs.length; i++) {
		const scale = lerp(1.0, minScale, i / (blobs.length - 1));
		blobs[i]!.rx *= scale;
		blobs[i]!.ry *= scale;
	}
}

// ---------------------------------------------------------------------------
// Blob closeness (D7)
// ---------------------------------------------------------------------------

export function applyBlobCloseness(
	blobs: Blob[],
	blobCloseness: number,
	spreadRadius: number,
): void {
	if (blobs.length <= 1) {
		return;
	}

	const maxSpread = lerp(spreadRadius * 0.9, spreadRadius * 0.3, (blobCloseness - 20) / 60);
	const trunkCenterX = W / 2;

	for (let i = 1; i < blobs.length; i++) {
		const dx = blobs[i]!.cx - trunkCenterX;
		const currentDist = Math.abs(dx);
		if (currentDist > maxSpread) {
			const scale = maxSpread / currentDist;
			blobs[i]!.cx = trunkCenterX + dx * scale;
		}
	}

	// Main blob affected at 1/10th magnitude
	if (blobs.length > 0) {
		const dx = blobs[0]!.cx - trunkCenterX;
		const currentDist = Math.abs(dx);
		if (currentDist > maxSpread * 0.1) {
			const targetDist = maxSpread * 0.1;
			blobs[0]!.cx = trunkCenterX + (dx > 0 ? targetDist : -targetDist);
		}
	}
}

// ---------------------------------------------------------------------------
// Canopy size scaling (D5)
// ---------------------------------------------------------------------------

export function applyCanopySize(blobs: Blob[], canopySize: number): void {
	const scale = canopySize / 100;
	for (const blob of blobs) {
		blob.rx *= scale;
		blob.ry *= scale;
	}
}
