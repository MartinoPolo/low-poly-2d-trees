import { randomInRange } from './prng.js';

// ---------------------------------------------------------------------------
// Boundary kinds and shape abstraction
// ---------------------------------------------------------------------------

export const BOUNDARY_KINDS = {
	circle: 'circle',
	teardrop: 'teardrop',
} as const;

export type BoundaryKind = (typeof BOUNDARY_KINDS)[keyof typeof BOUNDARY_KINDS];

interface BoundaryPoint {
	readonly x: number;
	readonly y: number;
}

/**
 * A parametric canopy-blob boundary shape. The same interface is used for
 * both axis-aligned ellipses ("circle") and rotated teardrops, so the canopy
 * triangulation pipeline can dispatch on `blob.boundary` without caring about
 * per-shape geometry.
 *
 * The point-in-shape and sampling routines work in local (cx, cy, rx, ry)
 * coordinates plus a rotation angle in degrees. Rotation is applied around
 * (cx, cy).
 */
interface BoundaryShape {
	readonly kind: BoundaryKind;
	contains(
		px: number,
		py: number,
		cx: number,
		cy: number,
		rx: number,
		ry: number,
		rotationDeg: number,
	): boolean;
	sample(
		cx: number,
		cy: number,
		rx: number,
		ry: number,
		count: number,
		rng: () => number,
		rotationDeg: number,
	): BoundaryPoint[];
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const CIRCLE_RADIAL_JITTER_FACTOR = 0.15;
const CIRCLE_ANGLE_JITTER_RAD = (40 * Math.PI) / 180;
const TEARDROP_RADIAL_JITTER_FACTOR = 0.08;
const TEARDROP_POINT_EXPONENT = 0.6;
const TEARDROP_MAX_SAMPLE_REJECTIONS = 8;

// ---------------------------------------------------------------------------
// Rotation helpers
// ---------------------------------------------------------------------------

function rotatePointAroundCenter(
	px: number,
	py: number,
	cx: number,
	cy: number,
	rotationDeg: number,
): BoundaryPoint {
	if (rotationDeg === 0) {
		return { x: px, y: py };
	}
	const theta = (rotationDeg * Math.PI) / 180;
	const cosT = Math.cos(theta);
	const sinT = Math.sin(theta);
	const dx = px - cx;
	const dy = py - cy;
	return {
		x: cx + dx * cosT - dy * sinT,
		y: cy + dx * sinT + dy * cosT,
	};
}

function inverseRotateToLocal(
	px: number,
	py: number,
	cx: number,
	cy: number,
	rotationDeg: number,
): { xLocal: number; yLocal: number } {
	if (rotationDeg === 0) {
		return { xLocal: px - cx, yLocal: py - cy };
	}
	const theta = (-rotationDeg * Math.PI) / 180;
	const cosT = Math.cos(theta);
	const sinT = Math.sin(theta);
	const dx = px - cx;
	const dy = py - cy;
	return {
		xLocal: dx * cosT - dy * sinT,
		yLocal: dx * sinT + dy * cosT,
	};
}

// ---------------------------------------------------------------------------
// Circle (axis-aligned ellipse) boundary
// ---------------------------------------------------------------------------

export const circleBoundary: BoundaryShape = {
	kind: BOUNDARY_KINDS.circle,
	contains(px, py, cx, cy, rx, ry, rotationDeg) {
		const { xLocal, yLocal } = inverseRotateToLocal(px, py, cx, cy, rotationDeg);
		const nx = xLocal / rx;
		const ny = yLocal / ry;
		return nx * nx + ny * ny <= 1;
	},
	sample(cx, cy, rx, ry, count, rng, rotationDeg) {
		const points: BoundaryPoint[] = [];
		for (let i = 0; i < count; i++) {
			const baseAngle = (i / count) * Math.PI * 2;
			const angleJitter = (rng() - 0.5) * CIRCLE_ANGLE_JITTER_RAD;
			const angle = baseAngle + angleJitter;
			const radialJitter = 1.0 + (rng() - 0.5) * 2 * CIRCLE_RADIAL_JITTER_FACTOR;
			const xLocal = Math.cos(angle) * rx * radialJitter;
			const yLocal = Math.sin(angle) * ry * radialJitter;
			const rotated = rotatePointAroundCenter(cx + xLocal, cy + yLocal, cx, cy, rotationDeg);
			points.push(rotated);
		}
		return points;
	},
};

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
		const { xLocal, yLocal } = inverseRotateToLocal(px, py, cx, cy, rotationDeg);
		const tParam = yLocal / ry;
		if (tParam < -1 || tParam > 1) {
			return false;
		}
		const halfWidth = teardropXHalfWidth(tParam);
		if (halfWidth <= 0) {
			return Math.abs(xLocal) < 1e-9;
		}
		const nx = xLocal / (rx * halfWidth);
		return nx * nx <= 1;
	},
	sample(cx, cy, rx, ry, count, rng, rotationDeg) {
		const points: BoundaryPoint[] = [];
		if (count <= 0) {
			return points;
		}
		// Half the samples ride the left edge, half the right edge, sweeping
		// t from -1 (pointy top) to +1 (round bottom). Jitter is applied radially
		// on the half-width so samples cannot escape the shape.
		const halfCount = Math.max(1, Math.floor(count / 2));
		const otherCount = count - halfCount;
		const pushEdgeSamples = (edgeCount: number, sideSign: 1 | -1): void => {
			for (let i = 0; i < edgeCount; i++) {
				// Distribute t values across [-1, 1]. Avoid the exact endpoints so
				// the pointy top is not duplicated from both edges.
				const denom = edgeCount + 1;
				const tParam = -1 + ((i + 1) / denom) * 2;
				// Rejection-free radial jitter: scale the offset from the axis by
				// a factor in [1 - j, 1], where j is the jitter fraction. This keeps
				// every sample strictly inside the teardrop.
				const jitterScale = 1 - rng() * TEARDROP_RADIAL_JITTER_FACTOR;
				const halfWidth = teardropXHalfWidth(tParam) * jitterScale;
				const xLocal = sideSign * rx * halfWidth;
				const yLocal = ry * tParam;
				const rotated = rotatePointAroundCenter(
					cx + xLocal,
					cy + yLocal,
					cx,
					cy,
					rotationDeg,
				);
				points.push(rotated);
			}
		};
		pushEdgeSamples(halfCount, 1);
		pushEdgeSamples(otherCount, -1);
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
				// Pull the point slightly toward the center until it lands inside.
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

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const BOUNDARIES = {
	[BOUNDARY_KINDS.circle]: circleBoundary,
	[BOUNDARY_KINDS.teardrop]: teardropBoundary,
} as const satisfies Record<BoundaryKind, BoundaryShape>;

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
