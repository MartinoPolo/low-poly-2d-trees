// ---------------------------------------------------------------------------
// Z-Order Layers (REQ-EV2-Z-04)
// ---------------------------------------------------------------------------

/** Five render layers for branching shapes (painter's order). */
export const Z_ORDER_LAYERS = {
	backBranches: 1,
	trunk: 2,
	frontBranches: 3,
	backCanopy: 4,
	frontCanopy: 5,
} as const;

export type ZOrderLayer = (typeof Z_ORDER_LAYERS)[keyof typeof Z_ORDER_LAYERS];

export const GEOMETRY_GROUPS = {
	canopy: 'canopy',
	trunk: 'trunk',
	branch: 'branch',
	fruit: 'fruit',
	flower: 'flower',
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
	/** Branch tip positions with depth info for Phase 2 clustering (REQ-EV2-C-02). */
	readonly branchTipDepths?: readonly { readonly position: Point2D; readonly depth: number }[];
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
	/** Z-order layer for 5-layer rendering (REQ-EV2-Z-05). Undefined for branchless shapes. */
	readonly zOrder?: ZOrderLayer;
}

export interface Quad {
	/** Four corner points defining the quadrilateral (trapezoid). */
	readonly points: readonly [Point2D, Point2D, Point2D, Point2D];
	readonly color: string;
	readonly group: GeometryGroup;
	/** Z-ordering hint for Phase 2 (REQ-EV2-C-03). Undefined = painter's order. */
	readonly zOrder?: number;
}

export interface BranchGeometry {
	readonly quads: readonly Quad[];
	readonly junctionFills: readonly Quad[];
	readonly origin: Point2D;
	readonly depth: number;
	readonly parentIndex: number | null;
	/** Front/back classification for 5-layer rendering (REQ-EV2-Z-05). */
	readonly zOrder?: ZOrderLayer;
}

/** Junction strip data exposed for Phase 2 (REQ-EV2-C-01). */
export interface JunctionData {
	readonly position: Point2D;
	readonly width: number;
	readonly stripRatios: readonly number[];
	readonly bisectorAngle: number;
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
	/** Slots where flower SVGs should be rendered (flowering stage). */
	readonly flowerSlots: readonly Point2D[];
	/** Whether to show falling leaf particles (autumn stage). */
	readonly showFallingLeaves: boolean;
	readonly anchors: TreeAnchors;
	readonly viewBox: { readonly width: number; readonly height: number };
	/** Junction positions/widths/ratios for Phase 2 (REQ-EV2-C-01). */
	readonly junctionData?: readonly JunctionData[];
	/** Canopy envelope bounds for Phase 2 (REQ-EV2-C-04). */
	readonly envelopeBounds?: {
		readonly minX: number;
		readonly minY: number;
		readonly maxX: number;
		readonly maxY: number;
	};
}
