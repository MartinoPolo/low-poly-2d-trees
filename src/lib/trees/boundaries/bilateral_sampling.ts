import type { BoundaryPoint } from './types.js';
import { rotatePointAroundCenter } from './rotation_math.js';

// ---------------------------------------------------------------------------
// Shared bilateral edge sampling (teardrop + egg)
// ---------------------------------------------------------------------------
//
// Both teardrop and egg boundaries use the same two-sided sweep strategy:
// split `count` into halves, walk t ∈ [-1, +1] with radial jitter on each
// side, varying only the xHalfWidth function and jitter factor.
// ---------------------------------------------------------------------------

/**
 * Sample boundary points along both sides of a bilateral parametric shape.
 * `xHalfWidthFn(t)` returns the normalized x-extent at parameter `t ∈ [-1, 1]`.
 */
export function sampleBilateralEdges(
	cx: number,
	cy: number,
	rx: number,
	ry: number,
	count: number,
	rng: () => number,
	rotationDeg: number,
	xHalfWidthFn: (tParam: number) => number,
	jitterFactor: number,
): BoundaryPoint[] {
	const points: BoundaryPoint[] = [];
	if (count <= 0) {
		return points;
	}
	const halfCount = Math.max(1, Math.floor(count / 2));
	const otherCount = count - halfCount;
	const pushEdgeSamples = (edgeCount: number, sideSign: 1 | -1): void => {
		for (let i = 0; i < edgeCount; i++) {
			const denom = edgeCount + 1;
			const tParam = -1 + ((i + 1) / denom) * 2;
			const jitterScale = 1 - rng() * jitterFactor;
			const halfWidth = xHalfWidthFn(tParam) * jitterScale;
			const xLocal = sideSign * rx * halfWidth;
			const yLocal = ry * tParam;
			points.push(rotatePointAroundCenter(cx + xLocal, cy + yLocal, cx, cy, rotationDeg));
		}
	};
	pushEdgeSamples(halfCount, 1);
	pushEdgeSamples(otherCount, -1);
	return points;
}
