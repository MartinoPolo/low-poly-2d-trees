import Delaunator from 'delaunator';
import type { Point2D } from '../types.js';

/**
 * Triangulate a set of 2D points using Delaunay triangulation.
 * Returns an array of triangles, each as a tuple of three Point2D vertices.
 */
export function triangulatePoints(
	points: readonly { x: number; y: number }[],
): [Point2D, Point2D, Point2D][] {
	if (points.length < 3) {
		return [];
	}

	const coords = new Float64Array(points.length * 2);
	for (let i = 0; i < points.length; i++) {
		coords[i * 2] = points[i]!.x;
		coords[i * 2 + 1] = points[i]!.y;
	}

	const delaunay = new Delaunator(coords);
	const triangles: [Point2D, Point2D, Point2D][] = [];

	for (let i = 0; i < delaunay.triangles.length; i += 3) {
		const i0 = delaunay.triangles[i]!;
		const i1 = delaunay.triangles[i + 1]!;
		const i2 = delaunay.triangles[i + 2]!;
		triangles.push([
			{ x: coords[i0 * 2]!, y: coords[i0 * 2 + 1]! },
			{ x: coords[i1 * 2]!, y: coords[i1 * 2 + 1]! },
			{ x: coords[i2 * 2]!, y: coords[i2 * 2 + 1]! },
		]);
	}

	return triangles;
}

/**
 * Returns true when the centroid of the triangle passes the provided
 * region membership test.
 */
export function isTriangleInsideRegion(
	tri: readonly [Point2D, Point2D, Point2D],
	test: (x: number, y: number) => boolean,
): boolean {
	const cx = (tri[0].x + tri[1].x + tri[2].x) / 3;
	const cy = (tri[0].y + tri[1].y + tri[2].y) / 3;
	return test(cx, cy);
}
