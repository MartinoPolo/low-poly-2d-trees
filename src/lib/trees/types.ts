export const TREE_SHAPES = {
	oak: 'oak',
	pine: 'pine',
	birch: 'birch',
} as const;

export type TreeShape = (typeof TREE_SHAPES)[keyof typeof TREE_SHAPES];

export const TREE_SHAPE_OPTIONS: readonly { value: TreeShape; label: string }[] = [
	{ value: TREE_SHAPES.oak, label: 'Oak' },
	{ value: TREE_SHAPES.pine, label: 'Pine' },
	{ value: TREE_SHAPES.birch, label: 'Birch' },
] as const;

export const GEOMETRY_GROUPS = {
	canopy: 'canopy',
	trunk: 'trunk',
	branch: 'branch',
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
	readonly anchors: TreeAnchors;
	readonly viewBox: { readonly width: number; readonly height: number };
}

export interface TreeConfig {
	readonly shape: TreeShape;
	readonly seed: number;
	readonly canopyPolygons: number;
	readonly trunkPolygons: number;
	readonly canopyHue: number;
	readonly canopyHueSpread: number;
	readonly canopySaturation: number;
	readonly canopyLightness: number;
	readonly trunkHue: number;
	readonly trunkSaturation: number;
	readonly trunkLightness: number;
	readonly lightAngle: number;
	readonly blobCount: number;
	readonly branchCount: number;
	readonly depthVariance: number;
	readonly blobSizeVariance: number;
	readonly blobCloseness: number;
	readonly trunkThickness: number;
	readonly branchThickness: number;
	readonly canopySize: number;
	readonly trunkHeight: number;
	readonly trunkBranchRatio: number;
}

export const DEFAULT_TREE_CONFIG: TreeConfig = {
	shape: TREE_SHAPES.oak,
	seed: 42,
	canopyPolygons: 50,
	trunkPolygons: 30,
	canopyHue: 120,
	canopyHueSpread: 40,
	canopySaturation: 60,
	canopyLightness: 40,
	trunkHue: 25,
	trunkSaturation: 50,
	trunkLightness: 25,
	lightAngle: 315,
	blobCount: 5,
	branchCount: 2,
	depthVariance: 1.0,
	blobSizeVariance: 3.0,
	blobCloseness: 50,
	trunkThickness: 100,
	branchThickness: 100,
	canopySize: 100,
	trunkHeight: 100,
	trunkBranchRatio: 70,
} as const;

export const SHAPE_DEFAULTS: Record<
	TreeShape,
	Pick<TreeConfig, 'blobCount' | 'branchCount' | 'blobSizeVariance' | 'blobCloseness'>
> = {
	[TREE_SHAPES.oak]: { blobCount: 5, branchCount: 2, blobSizeVariance: 3.0, blobCloseness: 50 },
	[TREE_SHAPES.pine]: { blobCount: 3, branchCount: 0, blobSizeVariance: 3.0, blobCloseness: 50 },
	[TREE_SHAPES.birch]: { blobCount: 3, branchCount: 1, blobSizeVariance: 3.0, blobCloseness: 50 },
};

export const VIEWBOX_WIDTH = 200;
export const VIEWBOX_HEIGHT = 300;
