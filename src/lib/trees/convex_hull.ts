import type { Point2D, TreeGeometry } from './types.js';

function cross(o: Point2D, a: Point2D, b: Point2D): number {
	return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function computeConvexHull(points: readonly Point2D[]): Point2D[] {
	if (points.length < 3) {
		return [...points];
	}

	const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
	const n = sorted.length;
	const hull: Point2D[] = [];

	for (let i = 0; i < n; i++) {
		while (
			hull.length >= 2 &&
			cross(hull[hull.length - 2], hull[hull.length - 1], sorted[i]) <= 0
		) {
			hull.pop();
		}
		hull.push(sorted[i]);
	}

	const lowerSize = hull.length + 1;
	for (let i = n - 2; i >= 0; i--) {
		while (
			hull.length >= lowerSize &&
			cross(hull[hull.length - 2], hull[hull.length - 1], sorted[i]) <= 0
		) {
			hull.pop();
		}
		hull.push(sorted[i]);
	}

	hull.pop();
	return hull;
}

export function extractTreeVertices(geometry: TreeGeometry): Point2D[] {
	const vertices: Point2D[] = [];
	for (const blob of geometry.canopyBlobs) {
		for (const tri of blob.triangles) {
			vertices.push(...tri.points);
		}
	}
	for (const quad of geometry.trunkQuads) {
		vertices.push(...quad.points);
	}
	for (const tri of geometry.trunkTriangles) {
		vertices.push(...tri.points);
	}
	for (const group of geometry.branchGroups) {
		for (const quad of group.quads) {
			vertices.push(...quad.points);
		}
	}
	return vertices;
}

export function computeTreeHull(geometry: TreeGeometry, padding: number = 12): Point2D[] {
	const vertices = extractTreeVertices(geometry);
	const hull = computeConvexHull(vertices);
	return padding > 0 ? padConvexHull(hull, padding) : hull;
}

export function padConvexHull(hull: readonly Point2D[], padding: number): Point2D[] {
	if (hull.length < 3) {
		return [...hull];
	}

	let cx = 0;
	let cy = 0;
	for (const point of hull) {
		cx += point.x;
		cy += point.y;
	}
	cx /= hull.length;
	cy /= hull.length;

	return hull.map((point) => {
		const dx = point.x - cx;
		const dy = point.y - cy;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist === 0) {
			return point;
		}
		return {
			x: point.x + (dx / dist) * padding,
			y: point.y + (dy / dist) * padding,
		};
	});
}
