export const GEOMETRY_GROUPS = {
	canopy: 'canopy',
	trunk: 'trunk',
	branch: 'branch',
	fruit: 'fruit',
	stake: 'stake',
	pot: 'pot',
} as const;

export type GeometryGroup = (typeof GEOMETRY_GROUPS)[keyof typeof GEOMETRY_GROUPS];

export interface Point2D {
	readonly x: number;
	readonly y: number;
}

export interface Triangle {
	readonly points: readonly [Point2D, Point2D, Point2D];
	readonly color: string;
	readonly group: GeometryGroup;
}

export interface TreeAnchors {
	readonly trunkTop: Point2D;
	readonly trunkMiddle: Point2D;
	readonly trunkBase: Point2D;
	readonly crownCenter: Point2D;
	readonly crownTop: Point2D;
	readonly roots: Point2D;
	readonly branchTips: readonly Point2D[];
	readonly fruitSlots: readonly Point2D[];
}

export interface Tier {
	readonly tipX: number;
	readonly tipY: number;
	readonly baseLeftX: number;
	readonly baseLeftY: number;
	readonly baseRightX: number;
	readonly baseRightY: number;
}

export interface BlobGeometry {
	readonly triangles: readonly Triangle[];
	readonly center: Point2D;
	readonly depth: number;
}

export interface Quad {
	/** Four corner points defining the quadrilateral (trapezoid). */
	readonly points: readonly [Point2D, Point2D, Point2D, Point2D];
	readonly color: string;
	readonly group: GeometryGroup;
}

export interface BranchGeometry {
	readonly quads: readonly Quad[];
	readonly junctionFills: readonly Quad[];
	readonly origin: Point2D;
	readonly depth: number;
}

export interface TreeGeometry {
	/** Stacked trapezoid quads for trunk (BR-1). Empty for simple stages. */
	readonly trunkQuads: readonly Quad[];
	/** Legacy triangles for simple stage geometries (seed, sprouting, stump). */
	readonly trunkTriangles: readonly Triangle[];
	readonly branchGroups: readonly BranchGeometry[];
	readonly canopyBlobs: readonly BlobGeometry[];
	readonly fruitTriangles: readonly Triangle[];
	readonly stakeTriangles: readonly Triangle[];
	readonly fruitSlots: readonly Point2D[];
	readonly anchors: TreeAnchors;
	readonly viewBox: { readonly width: number; readonly height: number };
}
