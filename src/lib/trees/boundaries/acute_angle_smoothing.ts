import type { BoundaryPoint } from './types.js';

// ---------------------------------------------------------------------------
// Acute-angle smoothing post-pass (REQ-C-12)
// ---------------------------------------------------------------------------
//
// Some canopy silhouettes (oak/birch/maple/willow) look best when sharp
// concavities along the sampled boundary are pulled back toward the shape
// edge. The pass walks the boundary looking for triples (prev, curr, next)
// whose interior angle at `curr` is below the acute threshold, then relocates
// `curr` onto the ellipse ring midway between prev and next.
//
// Teardrop boundaries must NOT be smoothed — rounding the pointy tip would
// destroy the silhouette. Callers gate this helper on `blob.boundary ===
// BOUNDARY_KINDS.circle` in generate.ts.
// ---------------------------------------------------------------------------

const ACUTE_ANGLE_THRESHOLD_RAD = Math.PI / 2;
const ACUTE_ANGLE_MAX_PASSES = 3;

function angleBetweenBoundaryPoints(
	ax: number,
	ay: number,
	bx: number,
	by: number,
	cx: number,
	cy: number,
): number {
	const bax = ax - bx;
	const bay = ay - by;
	const bcx = cx - bx;
	const bcy = cy - by;
	const dot = bax * bcx + bay * bcy;
	const magBA = Math.sqrt(bax * bax + bay * bay);
	const magBC = Math.sqrt(bcx * bcx + bcy * bcy);
	if (magBA === 0 || magBC === 0) {
		return Math.PI;
	}
	return Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC))));
}

/**
 * Pull acute-angle vertices on a circle-boundary sample back to the ellipse
 * ring so the canopy silhouette reads as rounded rather than spiky. Returns a
 * new array of points; the input is not mutated.
 *
 * The returned points are a mix of relocated and original entries. Must only
 * be called for circle boundaries — teardrop shapes would lose their tip.
 */
export function smoothAcuteBoundaryAngles(
	points: readonly BoundaryPoint[],
	cx: number,
	cy: number,
	rx: number,
	ry: number,
): BoundaryPoint[] {
	const result: { x: number; y: number }[] = points.map((p) => ({ x: p.x, y: p.y }));
	if (result.length < 3) {
		return result;
	}
	const avgR = (rx + ry) / 2;
	let changed = true;
	let passes = 0;

	while (changed && passes < ACUTE_ANGLE_MAX_PASSES) {
		changed = false;
		passes++;

		for (let i = result.length - 1; i >= 0; i--) {
			if (result.length < 3) {
				break;
			}
			const prev = result[(i - 1 + result.length) % result.length]!;
			const curr = result[i]!;
			const next = result[(i + 1) % result.length]!;

			const ang = angleBetweenBoundaryPoints(prev.x, prev.y, curr.x, curr.y, next.x, next.y);
			if (ang < ACUTE_ANGLE_THRESHOLD_RAD) {
				const mx = (prev.x + next.x) / 2;
				const my = (prev.y + next.y) / 2;
				const ddx = mx - cx;
				const ddy = my - cy;
				const dist = Math.sqrt(ddx * ddx + ddy * ddy);
				if (dist > 0) {
					curr.x = cx + (ddx / dist) * avgR;
					curr.y = cy + (ddy / dist) * avgR;
					changed = true;
				}
			}
		}
	}

	return result;
}
