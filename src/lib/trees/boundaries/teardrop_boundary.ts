import { randomInRange } from '../prng.js';
import type { BoundaryShape } from './types.js';
import { BOUNDARY_KINDS } from './types.js';
import { rotatePointAroundCenter } from './rotation_math.js';
import { sampleBilateralEdges } from './bilateral_sampling.js';
import { bilateralContains } from './bilateral_contains.js';

// ---------------------------------------------------------------------------
// Teardrop boundary
// ---------------------------------------------------------------------------
//
// Parametric definition (local space, center at origin, pointy end up):
//   t ∈ [-1, 1], t = -1 at pointy top, t = +1 at round bottom
//   yLocal(t) = ry * t
//   xLocal(t) =  rx * √(1 - t²) * (1 + t)^0.6   for t < 0
//   xLocal(t) =  rx * √(1 - t²)                  for t ≥ 0
//
// The (1 + t)^0.6 factor pinches the top-half x-extent toward zero as t → -1,
// creating the teardrop tip. Rotation is applied after generating the
// local-space point.
// ---------------------------------------------------------------------------

const TEARDROP_RADIAL_JITTER_FACTOR = 0.08;
const TEARDROP_POINT_EXPONENT = 0.6;
const TEARDROP_MAX_SAMPLE_REJECTIONS = 8;

function teardropXHalfWidth(tParam: number): number {
	const ellipseFactor = Math.sqrt(Math.max(0, 1 - tParam * tParam));
	if (tParam < 0) {
		return ellipseFactor * Math.pow(1 + tParam, TEARDROP_POINT_EXPONENT);
	}
	return ellipseFactor;
}

export const teardropBoundary: BoundaryShape = {
	kind: BOUNDARY_KINDS.teardrop,
	contains(px, py, cx, cy, rx, ry, rotationDeg) {
		return bilateralContains(px, py, cx, cy, rx, ry, rotationDeg, teardropXHalfWidth);
	},
	sample(cx, cy, rx, ry, count, rng, rotationDeg) {
		const points = sampleBilateralEdges(
			cx,
			cy,
			rx,
			ry,
			count,
			rng,
			rotationDeg,
			teardropXHalfWidth,
			TEARDROP_RADIAL_JITTER_FACTOR,
		);
		// Final safety pass: rejection-regenerate any point that happens to fall
		// outside (should not happen with the rejection-free formula, but guards
		// against floating-point edge cases near the pointy tip).
		for (let i = 0; i < points.length; i++) {
			let attempts = 0;
			while (
				attempts < TEARDROP_MAX_SAMPLE_REJECTIONS &&
				!teardropBoundary.contains(points[i]!.x, points[i]!.y, cx, cy, rx, ry, rotationDeg)
			) {
				attempts++;
				const tParam = randomInRange(rng, -0.9, 0.9);
				const halfWidth = teardropXHalfWidth(tParam) * 0.8;
				const sideSign = rng() < 0.5 ? -1 : 1;
				const xLocal = sideSign * rx * halfWidth;
				const yLocal = ry * tParam;
				points[i] = rotatePointAroundCenter(cx + xLocal, cy + yLocal, cx, cy, rotationDeg);
			}
		}
		return points;
	},
};
