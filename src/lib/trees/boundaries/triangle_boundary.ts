import type { BoundaryShape, BoundaryKind } from './types.js';
import { BOUNDARY_KINDS } from './types.js';
import { inverseRotateToLocal, rotatePointAroundCenter } from './rotation_math.js';

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
