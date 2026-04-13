// Barrel re-export — the actual definitions live in types/*.ts modules.
export {
	GEOMETRY_GROUPS,
	type Point2D,
	type Triangle,
	type TreeAnchors,
	type Tier,
	type BlobGeometry,
	type BranchGeometry,
	type TreeGeometry,
} from './types/core.js';

export {
	TREE_STAGES,
	type TreeStage,
	TREE_STAGE_OPTIONS,
	TREE_SHAPES,
	type TreeShape,
	TREE_SHAPE_OPTIONS,
	type TreeConfig,
	DEFAULT_TREE_CONFIG,
	SHAPE_DEFAULTS,
	VIEWBOX_WIDTH,
	VIEWBOX_HEIGHT,
	isTreeStage,
} from './types/config.js';

export { FRUIT_TYPES, type FruitType, FRUIT_TYPE_OPTIONS, FRUIT_SPECS } from './types/fruit.js';

export {
	CUSTOM_BLOB_BOUNDARY_KINDS,
	type CustomBlobBoundaryKind,
	CUSTOM_BLOB_BOUNDARY_OPTIONS,
	type CustomBlob,
	CUSTOM_BLOB_ROTATION_STEP,
	CUSTOM_BLOB_SIZE_MIN,
	CUSTOM_BLOB_SIZE_MAX,
	CUSTOM_BLOB_SIZE_STEP,
	CUSTOM_BLOB_POSITION_MIN,
	CUSTOM_BLOB_POSITION_MAX,
	CUSTOM_BLOB_POSITION_STEP,
	CUSTOM_BLOB_DEFAULT,
} from './types/custom.js';
