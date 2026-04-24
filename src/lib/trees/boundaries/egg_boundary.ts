import type { BoundaryShape } from './types.js';
import { BOUNDARY_KINDS } from './types.js';
import { inverseRotateToLocal } from './rotation_math.js';
import { sampleBilateralEdges } from './bilateral_sampling.js';

// ---------------------------------------------------------------------------
// Egg boundary (issue #10)
// ---------------------------------------------------------------------------
//
// Parametric definition (local space, center at origin):
//   t ∈ [-1, 1], y(t) = ry * t
//   top half    (t < 0):  xHalfWidth(t) = √(1-t²) · (1 + ALPHA · |t|)
//   bottom half (t ≥ 0):  xHalfWidth(t) = √(1-t²) · (1 + BETA  · t)
//
// With ALPHA = -0.15 the top half is slightly narrower than an ellipse and
// BETA = +0.15 makes the bottom half slightly wider. Neither half has a
// sharp point — the silhouette is a smooth asymmetric oval.
// ---------------------------------------------------------------------------

// Egg shape: asymmetric ellipse with different top/bottom exponents.
// ALPHA narrows the top half (t < 0); BETA widens the bottom half (t >= 0).
// No sharp point — both halves remain smoothly curved.
const EGG_TOP_ALPHA = -0.15;
const EGG_BOTTOM_BETA = 0.15;
const EGG_RADIAL_JITTER_FACTOR = 0.08;

function eggXHalfWidth(tParam: number): number {
	const ellipseFactor = Math.sqrt(Math.max(0, 1 - tParam * tParam));
	if (tParam < 0) {
		return ellipseFactor * (1 + EGG_TOP_ALPHA * Math.abs(tParam));
	}
	return ellipseFactor * (1 + EGG_BOTTOM_BETA * tParam);
}

export const eggBoundary: BoundaryShape = {
	kind: BOUNDARY_KINDS.egg,
	contains(px, py, cx, cy, rx, ry, rotationDeg) {
		const { xLocal, yLocal } = inverseRotateToLocal(px, py, cx, cy, rotationDeg);
		const tParam = yLocal / ry;
		if (tParam < -1 || tParam > 1) {
			return false;
		}
		const halfWidth = eggXHalfWidth(tParam);
		if (halfWidth <= 0) {
			return Math.abs(xLocal) < 1e-9;
		}
		const nx = xLocal / (rx * halfWidth);
		return nx * nx <= 1;
	},
	sample(cx, cy, rx, ry, count, rng, rotationDeg) {
		return sampleBilateralEdges(
			cx,
			cy,
			rx,
			ry,
			count,
			rng,
			rotationDeg,
			eggXHalfWidth,
			EGG_RADIAL_JITTER_FACTOR,
		);
	},
};
