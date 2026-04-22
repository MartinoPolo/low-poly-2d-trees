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

export interface BoundaryPoint {
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
export interface BoundaryShape {
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
