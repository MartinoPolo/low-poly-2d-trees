export const TREE_SHAPES = {
	oak: 'oak',
	pine: 'pine',
	birch: 'birch',
	fir: 'fir',
	maple: 'maple',
	willow: 'willow',
	custom: 'custom',
} as const;

export type TreeShape = (typeof TREE_SHAPES)[keyof typeof TREE_SHAPES];

export const TREE_SHAPE_OPTIONS: readonly { value: TreeShape; label: string }[] = [
	{ value: TREE_SHAPES.oak, label: 'Oak' },
	{ value: TREE_SHAPES.pine, label: 'Pine' },
	{ value: TREE_SHAPES.birch, label: 'Birch' },
	{ value: TREE_SHAPES.fir, label: 'Fir' },
	{ value: TREE_SHAPES.maple, label: 'Maple' },
	{ value: TREE_SHAPES.willow, label: 'Willow' },
	{ value: TREE_SHAPES.custom, label: 'Custom' },
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
	/** Hex color used for fully-lit canopy faces (REQ-P-30, REQ-L-01). */
	readonly canopyLightColor: string;
	/** Hex color used for fully-shadowed canopy faces (REQ-P-31, REQ-L-01). */
	readonly canopyDarkColor: string;
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
	readonly trunkLean: number;
	readonly trunkSegments: number;
	readonly trunkCrookedness: number;
	readonly branchLength: number;
	readonly branchLengthVariance: number;
	/**
	 * Per-blob overrides for the `custom` tree shape. Only consulted when
	 * `shape === 'custom'`. Grown lazily in UI state as the user raises the
	 * blobCount slider; entries past the current blobCount are preserved but
	 * unused so re-growing never loses prior user tuning.
	 */
	readonly customBlobs?: readonly CustomBlob[];
}

export const DEFAULT_TREE_CONFIG: TreeConfig = {
	shape: TREE_SHAPES.oak,
	seed: 42,
	canopyPolygons: 50,
	trunkPolygons: 30,
	canopyLightColor: '#a8d84e',
	canopyDarkColor: '#1a472a',
	trunkHue: 25,
	trunkSaturation: 50,
	trunkLightness: 25,
	lightAngle: 130,
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
	trunkLean: 0,
	trunkSegments: 1,
	trunkCrookedness: 0,
	branchLength: 100,
	branchLengthVariance: 50,
} as const;

/**
 * Per-shape defaults from REQUIREMENTS.md §2.5. `custom` is intentionally
 * excluded — the custom editor retains whatever the user has configured.
 */
export const SHAPE_DEFAULTS = {
	[TREE_SHAPES.oak]: {
		blobCount: 5,
		branchCount: 2,
		blobSizeVariance: 3.0,
		blobCloseness: 50,
		branchThickness: 100,
		trunkSegments: 1,
		trunkCrookedness: 0,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#a8d84e',
		canopyDarkColor: '#1a472a',
		trunkHue: 25,
		trunkSaturation: 50,
		trunkLightness: 25,
	},
	[TREE_SHAPES.pine]: {
		blobCount: 3,
		branchCount: 0,
		blobSizeVariance: 3.0,
		blobCloseness: 50,
		branchThickness: 100,
		trunkSegments: 1,
		trunkCrookedness: 0,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#4a9e5c',
		canopyDarkColor: '#0d2b1a',
		trunkHue: 20,
		trunkSaturation: 45,
		trunkLightness: 20,
	},
	[TREE_SHAPES.birch]: {
		blobCount: 3,
		branchCount: 1,
		blobSizeVariance: 3.0,
		blobCloseness: 50,
		branchThickness: 100,
		trunkSegments: 1,
		trunkCrookedness: 0,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#b8e065',
		canopyDarkColor: '#2d5e3a',
		trunkHue: 40,
		trunkSaturation: 15,
		trunkLightness: 80,
	},
	[TREE_SHAPES.fir]: {
		blobCount: 4,
		branchCount: 0,
		blobSizeVariance: 3.0,
		blobCloseness: 50,
		branchThickness: 100,
		trunkSegments: 1,
		trunkCrookedness: 0,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#3d8b50',
		canopyDarkColor: '#0a2418',
		trunkHue: 22,
		trunkSaturation: 50,
		trunkLightness: 28,
	},
	[TREE_SHAPES.maple]: {
		blobCount: 5,
		branchCount: 5,
		blobSizeVariance: 2.0,
		blobCloseness: 30,
		branchThickness: 100,
		trunkSegments: 1,
		trunkCrookedness: 0,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#e8a028',
		canopyDarkColor: '#8b2010',
		trunkHue: 30,
		trunkSaturation: 20,
		trunkLightness: 35,
	},
	[TREE_SHAPES.willow]: {
		blobCount: 4,
		branchCount: 4,
		blobSizeVariance: 3.0,
		blobCloseness: 50,
		branchThickness: 150,
		trunkSegments: 3,
		trunkCrookedness: 40,
		branchLength: 100,
		branchLengthVariance: 50,
		canopyLightColor: '#7cc45a',
		canopyDarkColor: '#1a4020',
		trunkHue: 25,
		trunkSaturation: 40,
		trunkLightness: 22,
	},
} as const satisfies Record<
	Exclude<TreeShape, 'custom'>,
	Pick<
		TreeConfig,
		| 'blobCount'
		| 'branchCount'
		| 'blobSizeVariance'
		| 'blobCloseness'
		| 'branchThickness'
		| 'trunkSegments'
		| 'trunkCrookedness'
		| 'branchLength'
		| 'branchLengthVariance'
		| 'canopyLightColor'
		| 'canopyDarkColor'
		| 'trunkHue'
		| 'trunkSaturation'
		| 'trunkLightness'
	>
>;

export const VIEWBOX_WIDTH = 200;
export const VIEWBOX_HEIGHT = 300;

// ---------------------------------------------------------------------------
// Issue #10: custom tree mode — per-blob editor types
// ---------------------------------------------------------------------------

/**
 * Boundary shapes available to a `custom`-tree blob. This is a subset of the
 * internal `BOUNDARY_KINDS` registry: `teardrop`, `circle`, `egg`, plus two
 * triangle variants. The custom editor exposes these as a dropdown per blob.
 */
export const CUSTOM_BLOB_BOUNDARY_KINDS = {
	circle: 'circle',
	egg: 'egg',
	teardrop: 'teardrop',
	isoscelesTriangle: 'isoscelesTriangle',
	equilateralTriangle: 'equilateralTriangle',
} as const;

export type CustomBlobBoundaryKind =
	(typeof CUSTOM_BLOB_BOUNDARY_KINDS)[keyof typeof CUSTOM_BLOB_BOUNDARY_KINDS];

export const CUSTOM_BLOB_BOUNDARY_OPTIONS: readonly {
	value: CustomBlobBoundaryKind;
	label: string;
}[] = [
	{ value: CUSTOM_BLOB_BOUNDARY_KINDS.circle, label: 'Circle' },
	{ value: CUSTOM_BLOB_BOUNDARY_KINDS.egg, label: 'Egg' },
	{ value: CUSTOM_BLOB_BOUNDARY_KINDS.teardrop, label: 'Teardrop' },
	{ value: CUSTOM_BLOB_BOUNDARY_KINDS.isoscelesTriangle, label: 'Isosceles Triangle' },
	{ value: CUSTOM_BLOB_BOUNDARY_KINDS.equilateralTriangle, label: 'Equilateral Triangle' },
] as const;

/**
 * Per-blob override for a `custom`-shape tree. `position.x` and `position.y`
 * are normalized to [-1, +1] relative to the canopy spread radius so the
 * placement is resolution-independent.
 */
export interface CustomBlob {
	readonly boundaryKind: CustomBlobBoundaryKind;
	/** Rotation applied around the blob centroid, in degrees. */
	readonly rotationDeg: number;
	/** Uniform scale on rx and ry. 1.0 is the baseline size. */
	readonly sizeScale: number;
	/** Position offset normalized to the canopy spread radius. */
	readonly position: { readonly x: number; readonly y: number };
}

export const CUSTOM_BLOB_ROTATION_STEP = 5;
export const CUSTOM_BLOB_SIZE_MIN = 0.5;
export const CUSTOM_BLOB_SIZE_MAX = 2.0;
export const CUSTOM_BLOB_SIZE_STEP = 0.05;
export const CUSTOM_BLOB_POSITION_MIN = -1;
export const CUSTOM_BLOB_POSITION_MAX = 1;
export const CUSTOM_BLOB_POSITION_STEP = 0.05;

/** Default values used when seeding a brand-new custom blob entry. */
export const CUSTOM_BLOB_DEFAULT = {
	boundaryKind: CUSTOM_BLOB_BOUNDARY_KINDS.circle,
	rotationDeg: 0,
	sizeScale: 1.0,
	position: { x: 0, y: 0 },
} as const satisfies CustomBlob;
