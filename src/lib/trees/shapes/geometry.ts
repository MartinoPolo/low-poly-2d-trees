import type { Tier } from '../types.js';
import type { Blob, BranchSegment } from './shape_types.js';

// ---------------------------------------------------------------------------
// Segment/shape intersection helpers (issue #7 — branch visibility)
// ---------------------------------------------------------------------------

/**
 * Intersect a line segment (x1,y1)-(x2,y2) with an axis-aligned ellipse
 * centered at (cx,cy) with radii (rx,ry). Returns the parametric entry/exit
 * values clipped to [0,1], or null if the segment misses the ellipse.
 *
 * Parameterization: point on segment = (x1,y1) + t * (x2-x1, y2-y1) for t∈[0,1].
 */
export function raySegmentEllipseIntersection(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	cx: number,
	cy: number,
	rx: number,
	ry: number,
): [number, number] | null {
	if (rx <= 0 || ry <= 0) {
		return null;
	}
	// Transform segment into unit-circle space (divide by rx, ry, translate to origin).
	const ax = (x1 - cx) / rx;
	const ay = (y1 - cy) / ry;
	const dx = (x2 - x1) / rx;
	const dy = (y2 - y1) / ry;
	// |a + t*d|^2 = 1 → A t^2 + 2 B t + C = 0 where
	//   A = d·d, B = a·d, C = a·a - 1
	const A = dx * dx + dy * dy;
	const B = ax * dx + ay * dy;
	const C = ax * ax + ay * ay - 1;
	if (A === 0) {
		return C <= 0 ? [0, 1] : null;
	}
	const disc = B * B - A * C;
	if (disc < 0) {
		return null;
	}
	const sqrtDisc = Math.sqrt(Math.max(0, disc));
	let tEnter = (-B - sqrtDisc) / A;
	let tExit = (-B + sqrtDisc) / A;
	if (tEnter > tExit) {
		const tmp = tEnter;
		tEnter = tExit;
		tExit = tmp;
	}
	if (tExit < 0 || tEnter > 1) {
		return null;
	}
	tEnter = Math.max(0, tEnter);
	tExit = Math.min(1, tExit);
	return [tEnter, tExit];
}

/**
 * Intersect a segment with a triangle (Tier) using Liang–Barsky clipping
 * against the three half-planes defined by its edges. Returns the parametric
 * entry/exit values clipped to [0,1], or null if the segment misses.
 */
export function raySegmentTriangleIntersection(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	triangle: Tier,
): [number, number] | null {
	const vertices: readonly [number, number][] = [
		[triangle.tipX, triangle.tipY],
		[triangle.baseRightX, triangle.baseRightY],
		[triangle.baseLeftX, triangle.baseLeftY],
	];

	// Signed-area (cross product) for the triangle — used to pick the inward
	// orientation of each edge normal so we can clip consistently.
	const cross = (
		x0: number,
		y0: number,
		xa: number,
		ya: number,
		xb: number,
		yb: number,
	): number => (xa - x0) * (yb - y0) - (ya - y0) * (xb - x0);

	const [v0x, v0y] = vertices[0]!;
	const [v1x, v1y] = vertices[1]!;
	const [v2x, v2y] = vertices[2]!;
	const orient = cross(v0x, v0y, v1x, v1y, v2x, v2y);
	if (orient === 0) {
		return null;
	}
	const sign = orient > 0 ? 1 : -1;

	const dx = x2 - x1;
	const dy = y2 - y1;
	let tEnter = 0;
	let tExit = 1;

	for (let i = 0; i < 3; i++) {
		const [ax, ay] = vertices[i]!;
		const [bx, by] = vertices[(i + 1) % 3]!;
		// Inward normal for this edge (rotate edge vector 90° depending on orientation).
		const ex = bx - ax;
		const ey = by - ay;
		const nx = -ey * sign;
		const ny = ex * sign;
		// Half-plane: n · (p - a) >= 0 inside.
		// n · (start - a) + t * (n · dir) >= 0
		const startDot = nx * (x1 - ax) + ny * (y1 - ay);
		const dirDot = nx * dx + ny * dy;
		if (dirDot === 0) {
			if (startDot < 0) {
				return null;
			}
			continue;
		}
		const t = -startDot / dirDot;
		if (dirDot > 0) {
			// Entering the half-plane at t.
			if (t > tEnter) {
				tEnter = t;
			}
		} else {
			// Leaving the half-plane at t.
			if (t < tExit) {
				tExit = t;
			}
		}
		if (tEnter > tExit) {
			return null;
		}
	}

	return [tEnter, tExit];
}

/**
 * Compute the portion of a branch segment that is NOT covered by any canopy
 * blob or tier. Intervals from all shapes are merged before measuring so
 * overlapping coverage is not double-counted.
 */
export function computeVisibleBranchLength(
	branch: BranchSegment,
	blobs: readonly Blob[],
	tiers: readonly Tier[],
): number {
	const dx = branch.x2 - branch.x1;
	const dy = branch.y2 - branch.y1;
	const segmentLength = Math.sqrt(dx * dx + dy * dy);
	if (segmentLength === 0) {
		return 0;
	}

	const intervals: [number, number][] = [];
	for (const b of blobs) {
		const hit = raySegmentEllipseIntersection(
			branch.x1,
			branch.y1,
			branch.x2,
			branch.y2,
			b.cx,
			b.cy,
			b.rx,
			b.ry,
		);
		if (hit) {
			intervals.push(hit);
		}
	}
	for (const t of tiers) {
		const hit = raySegmentTriangleIntersection(branch.x1, branch.y1, branch.x2, branch.y2, t);
		if (hit) {
			intervals.push(hit);
		}
	}

	if (intervals.length === 0) {
		return segmentLength;
	}

	// Merge overlapping intervals.
	intervals.sort((a, b) => a[0] - b[0]);
	let covered = 0;
	let curStart = intervals[0]![0];
	let curEnd = intervals[0]![1];
	for (let i = 1; i < intervals.length; i++) {
		const [s, e] = intervals[i]!;
		if (s <= curEnd) {
			if (e > curEnd) {
				curEnd = e;
			}
		} else {
			covered += curEnd - curStart;
			curStart = s;
			curEnd = e;
		}
	}
	covered += curEnd - curStart;

	const coveredFraction = Math.min(1, Math.max(0, covered));
	return segmentLength * (1 - coveredFraction);
}

/**
 * Returns true if two segments (p1->p2 and p3->p4) intersect as thin lines.
 */
function segmentsIntersect(
	p1x: number,
	p1y: number,
	p2x: number,
	p2y: number,
	p3x: number,
	p3y: number,
	p4x: number,
	p4y: number,
): boolean {
	const d1x = p2x - p1x;
	const d1y = p2y - p1y;
	const d2x = p4x - p3x;
	const d2y = p4y - p3y;
	const denom = d1x * d2y - d1y * d2x;
	if (denom === 0) {
		// Parallel — treat collinear overlap as intersection.
		const cross1 = (p3x - p1x) * d1y - (p3y - p1y) * d1x;
		if (cross1 !== 0) {
			return false;
		}
		// Collinear: project onto the longer axis and check overlap.
		const useX = Math.abs(d1x) >= Math.abs(d1y);
		const a0 = useX ? p1x : p1y;
		const a1 = useX ? p2x : p2y;
		const b0 = useX ? p3x : p3y;
		const b1 = useX ? p4x : p4y;
		const aMin = Math.min(a0, a1);
		const aMax = Math.max(a0, a1);
		const bMin = Math.min(b0, b1);
		const bMax = Math.max(b0, b1);
		return aMax >= bMin && bMax >= aMin;
	}
	const tNum = (p3x - p1x) * d2y - (p3y - p1y) * d2x;
	const uNum = (p3x - p1x) * d1y - (p3y - p1y) * d1x;
	const t = tNum / denom;
	const u = uNum / denom;
	return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/**
 * Thick-segment overlap test. First does an AABB reject, then checks a
 * centerline intersection, then falls back to sampling points of each branch
 * against the other's thick body to catch near-coincident but non-crossing
 * cases.
 */
export function branchesOverlap(a: BranchSegment, b: BranchSegment): boolean {
	const halfA = Math.max(a.widthStart, a.widthEnd) / 2;
	const halfB = Math.max(b.widthStart, b.widthEnd) / 2;

	const aMinX = Math.min(a.x1, a.x2) - halfA;
	const aMaxX = Math.max(a.x1, a.x2) + halfA;
	const aMinY = Math.min(a.y1, a.y2) - halfA;
	const aMaxY = Math.max(a.y1, a.y2) + halfA;
	const bMinX = Math.min(b.x1, b.x2) - halfB;
	const bMaxX = Math.max(b.x1, b.x2) + halfB;
	const bMinY = Math.min(b.y1, b.y2) - halfB;
	const bMaxY = Math.max(b.y1, b.y2) + halfB;

	if (aMaxX < bMinX || bMaxX < aMinX || aMaxY < bMinY || bMaxY < aMinY) {
		return false;
	}

	// Analytic centerline intersection catches crossing branches regardless of
	// sample density.
	if (segmentsIntersect(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1, b.x2, b.y2)) {
		return true;
	}

	// Fallback: sample each branch at dense points and check thick inclusion
	// against the other. Catches near-coincident cases the analytic test missed.
	const SAMPLES = 21;
	for (let i = 0; i <= SAMPLES; i++) {
		const t = i / SAMPLES;
		const px = a.x1 + t * (a.x2 - a.x1);
		const py = a.y1 + t * (a.y2 - a.y1);
		if (isPointInBranchLocal(px, py, b)) {
			return true;
		}
	}
	for (let i = 0; i <= SAMPLES; i++) {
		const t = i / SAMPLES;
		const px = b.x1 + t * (b.x2 - b.x1);
		const py = b.y1 + t * (b.y2 - b.y1);
		if (isPointInBranchLocal(px, py, a)) {
			return true;
		}
	}
	return false;
}

/** Inline single-branch point test to avoid circular import with shape-bounds. */
function isPointInBranchLocal(x: number, y: number, b: BranchSegment): boolean {
	const dx = b.x2 - b.x1;
	const dy = b.y2 - b.y1;
	const lenSq = dx * dx + dy * dy;
	if (lenSq === 0) {
		return false;
	}
	const t = Math.max(0, Math.min(1, ((x - b.x1) * dx + (y - b.y1) * dy) / lenSq));
	const projX = b.x1 + t * dx;
	const projY = b.y1 + t * dy;
	const distSq = (x - projX) ** 2 + (y - projY) ** 2;
	const localWidth = b.widthStart + t * (b.widthEnd - b.widthStart);
	const halfW = localWidth / 2;
	return distSq <= halfW * halfW;
}

/**
 * Resolve the effective branch length range for a given base range, taking
 * branchLength scaling and branchLengthVariance spread into account.
 *
 * Trunk-origin branches draw from the upper half of the variance window,
 * sub-branches from the lower half (REQ-T-15).
 */
export function resolveBranchLengthRange(
	baseMin: number,
	baseMax: number,
	branchLength: number,
	branchLengthVariance: number,
	isTrunkOrigin: boolean,
): { min: number; max: number } {
	const scale = branchLength / 100;
	const mid = ((baseMin + baseMax) / 2) * scale;
	const half = (((baseMax - baseMin) / 2) * scale * branchLengthVariance) / 100;
	if (isTrunkOrigin) {
		return { min: mid, max: mid + half };
	}
	return { min: mid - half, max: mid };
}
