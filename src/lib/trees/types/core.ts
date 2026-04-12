export const GEOMETRY_GROUPS = {
	canopy: 'canopy',
	trunk: 'trunk',
	branch: 'branch',
	stake: 'stake',
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
	readonly trunkBottom: Point2D;
	readonly canopyCenter: Point2D;
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
	readonly depth: number;
}

export interface TreeGeometry {
	readonly trunkTriangles: readonly Triangle[];
	readonly branchTriangles: readonly Triangle[];
	readonly canopyBlobs: readonly BlobGeometry[];
	readonly stakeTriangles: readonly Triangle[];
	readonly fruitSlots: readonly Point2D[];
	readonly anchors: TreeAnchors;
	readonly viewBox: { readonly width: number; readonly height: number };
}
