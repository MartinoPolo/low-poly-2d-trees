import { randomInRange } from './prng.js';

// ---------------------------------------------------------------------------
// Boundary kinds and shape abstraction
// ---------------------------------------------------------------------------

export const BOUNDARY_KINDS = {
	circle: 'circle',
	teardrop: 'teardrop',
	egg: 'egg',
	isoscelesTriangle: 'isoscelesTriangle',
	equilateralTriangle: 'equilateralTriangle',
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
// Egg shape: asymmetric ellipse with different top/bottom exponents.
// ALPHA narrows the top half (t < 0); BETA widens the bottom half (t >= 0).
// No sharp point — both halves remain smoothly curved.
const EGG_TOP_ALPHA = -0.15;
const EGG_BOTTOM_BETA = 0.15;
const EGG_RADIAL_JITTER_FACTOR = 0.08;
// Triangle boundaries: sample edges with small inward offset so points are
// guaranteed strictly inside the shape after Delaunay triangulation runs.
const TRIANGLE_EDGE_INWARD_OFFSET = 0.02;
const TRIANGLE_EDGE_JITTER_FACTOR = 0.04;
// Isosceles apex angle (40°) → half-angle = 20° → base-corner x = rx·tan(20°).
const ISOSCELES_HALF_APEX_TAN = Math.tan((20 * Math.PI) / 180);
// Pre-shift constant: center the isosceles triangle so its centroid sits at
// local (0, 0). Raw vertices are (0, -ry) and (±rx·tan20°, +0.6ry), centroid
// y = (-1 + 0.6 + 0.6)/3 = 0.0666…·ry, so we shift every vertex up by that.
const ISOSCELES_CENTROID_SHIFT_Y_FACTOR = 0.06666666666666667;
// Equilateral centroid is already at local (0, 0) by construction — vertices
// at angles -90°, 30°, 150° on an (rx, ry)-scaled ellipse ring sum to zero.

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
				// Rejection-free radial jitter: scale the half-width by a factor in
				// [1 - j, 1] so samples stay strictly inside the egg outline.
				const jitterScale = 1 - rng() * EGG_RADIAL_JITTER_FACTOR;
				const halfWidth = eggXHalfWidth(tParam) * jitterScale;
				const xLocal = sideSign * rx * halfWidth;
				const yLocal = ry * tParam;
				points.push(rotatePointAroundCenter(cx + xLocal, cy + yLocal, cx, cy, rotationDeg));
			}
		};
		pushEdgeSamples(halfCount, 1);
		pushEdgeSamples(otherCount, -1);
		return points;
	},
};

// ---------------------------------------------------------------------------
// Triangle boundaries (issue #10)
// ---------------------------------------------------------------------------
//
// Generic triangle support shared by `isoscelesTriangleBoundary` and
// `equilateralTriangleBoundary`. Both define their three vertices in local
// space (origin at the blob center, which coincides with the triangle
// centroid by construction). `contains` and `sample` use the existing
// inverseRotateToLocal / rotatePointAroundCenter helpers so rotation still
// happens around (cx, cy) — which, because the vertices are centroid-centred,
// is exactly "rotate the triangle around its centroid".
// ---------------------------------------------------------------------------

interface TriangleVerticesLocal {
	readonly v0x: number;
	readonly v0y: number;
	readonly v1x: number;
	readonly v1y: number;
	readonly v2x: number;
	readonly v2y: number;
}

function getEquilateralVerticesLocal(rx: number, ry: number): TriangleVerticesLocal {
	// Vertices at angles -90° (up), 30° (bottom-right), 150° (bottom-left) on
	// an (rx, ry)-scaled ellipse ring. Centroid at (0, 0) by symmetry.
	const sqrt3Over2 = Math.sqrt(3) / 2;
	return {
		v0x: 0,
		v0y: -ry,
		v1x: rx * sqrt3Over2,
		v1y: ry * 0.5,
		v2x: -rx * sqrt3Over2,
		v2y: ry * 0.5,
	};
}

function getIsoscelesVerticesLocal(rx: number, ry: number): TriangleVerticesLocal {
	// Raw spec: tip at (0, -ry), base corners at (±rx·tan(20°), +0.6·ry).
	// Shift every vertex up by 0.0667·ry so the centroid lands at (0, 0).
	const shiftY = ry * ISOSCELES_CENTROID_SHIFT_Y_FACTOR;
	const baseHalfX = rx * ISOSCELES_HALF_APEX_TAN;
	return {
		v0x: 0,
		v0y: -ry - shiftY,
		v1x: baseHalfX,
		v1y: ry * 0.6 - shiftY,
		v2x: -baseHalfX,
		v2y: ry * 0.6 - shiftY,
	};
}

function triangleContainsLocal(xLocal: number, yLocal: number, v: TriangleVerticesLocal): boolean {
	// Barycentric coordinate test. Computes the sign of each of the three
	// sub-triangles (p, vi, v(i+1)) and requires all three to have the same
	// sign as the original triangle (v0, v1, v2).
	const d1 = (xLocal - v.v1x) * (v.v0y - v.v1y) - (v.v0x - v.v1x) * (yLocal - v.v1y);
	const d2 = (xLocal - v.v2x) * (v.v1y - v.v2y) - (v.v1x - v.v2x) * (yLocal - v.v2y);
	const d3 = (xLocal - v.v0x) * (v.v2y - v.v0y) - (v.v2x - v.v0x) * (yLocal - v.v0y);
	const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
	const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
	return !(hasNeg && hasPos);
}

function sampleTriangleEdgesLocal(
	v: TriangleVerticesLocal,
	count: number,
	rng: () => number,
): { xLocal: number; yLocal: number }[] {
	const points: { xLocal: number; yLocal: number }[] = [];
	if (count <= 0) {
		return points;
	}
	const edges: readonly [[number, number], [number, number]][] = [
		[
			[v.v0x, v.v0y],
			[v.v1x, v.v1y],
		],
		[
			[v.v1x, v.v1y],
			[v.v2x, v.v2y],
		],
		[
			[v.v2x, v.v2y],
			[v.v0x, v.v0y],
		],
	];
	const edgeLengths: number[] = edges.map(([a, b]) => {
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		return Math.sqrt(dx * dx + dy * dy);
	});
	const perimeter = edgeLengths.reduce((sum, l) => sum + l, 0);
	if (perimeter <= 0) {
		return points;
	}
	const centroidX = (v.v0x + v.v1x + v.v2x) / 3;
	const centroidY = (v.v0y + v.v1y + v.v2y) / 3;

	let pointsEmitted = 0;
	for (let e = 0; e < edges.length; e++) {
		const isLast = e === edges.length - 1;
		const share = edgeLengths[e]! / perimeter;
		const rawCount = isLast ? count - pointsEmitted : Math.max(1, Math.round(share * count));
		const edgeCount = Math.max(0, rawCount);
		const [a, b] = edges[e]!;
		for (let i = 0; i < edgeCount; i++) {
			const denom = edgeCount + 1;
			const tParam =
				((i + 1) / denom) * (1 - TRIANGLE_EDGE_JITTER_FACTOR) +
				rng() * TRIANGLE_EDGE_JITTER_FACTOR;
			const edgeX = a[0] + tParam * (b[0] - a[0]);
			const edgeY = a[1] + tParam * (b[1] - a[1]);
			// Pull the point slightly toward the centroid so it stays strictly
			// inside after Delaunay triangulation. The offset is small — enough
			// to avoid boundary FP issues without visibly shrinking the triangle.
			const xLocal = edgeX + (centroidX - edgeX) * TRIANGLE_EDGE_INWARD_OFFSET;
			const yLocal = edgeY + (centroidY - edgeY) * TRIANGLE_EDGE_INWARD_OFFSET;
			points.push({ xLocal, yLocal });
		}
		pointsEmitted += edgeCount;
	}
	return points;
}

function createTriangleBoundary(
	kind: BoundaryKind,
	verticesFor: (rx: number, ry: number) => TriangleVerticesLocal,
): BoundaryShape {
	return {
		kind,
		contains(px, py, cx, cy, rx, ry, rotationDeg) {
			const { xLocal, yLocal } = inverseRotateToLocal(px, py, cx, cy, rotationDeg);
			return triangleContainsLocal(xLocal, yLocal, verticesFor(rx, ry));
		},
		sample(cx, cy, rx, ry, count, rng, rotationDeg) {
			const localPoints = sampleTriangleEdgesLocal(verticesFor(rx, ry), count, rng);
			return localPoints.map((p) =>
				rotatePointAroundCenter(cx + p.xLocal, cy + p.yLocal, cx, cy, rotationDeg),
			);
		},
	};
}

export const equilateralTriangleBoundary: BoundaryShape = createTriangleBoundary(
	BOUNDARY_KINDS.equilateralTriangle,
	getEquilateralVerticesLocal,
);

export const isoscelesTriangleBoundary: BoundaryShape = createTriangleBoundary(
	BOUNDARY_KINDS.isoscelesTriangle,
	getIsoscelesVerticesLocal,
);

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const BOUNDARIES = {
	[BOUNDARY_KINDS.circle]: circleBoundary,
	[BOUNDARY_KINDS.teardrop]: teardropBoundary,
	[BOUNDARY_KINDS.egg]: eggBoundary,
	[BOUNDARY_KINDS.isoscelesTriangle]: isoscelesTriangleBoundary,
	[BOUNDARY_KINDS.equilateralTriangle]: equilateralTriangleBoundary,
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
