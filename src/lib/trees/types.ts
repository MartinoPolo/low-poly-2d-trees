// Barrel re-export — the actual definitions live in types/*.ts modules.
export {
	GEOMETRY_GROUPS,
	type Point2D,
	type Triangle,
	type Quad,
	type TreeAnchors,
	type Tier,
	type BlobGeometry,
	type SnowCapGeometry,
	type BranchGeometry,
	type JunctionData,
	type BirchStripe,
	type TreeGeometry,
} from './types/core.js';

export {
	TREE_STAGES,
	type TreeStage,
	TREE_STAGE_OPTIONS,
	TREE_SHAPES,
	type TreeShape,
	TREE_SHAPE_OPTIONS,
	CROOKEDNESS_MODES,
	type CrookednessMode,
	CROOKEDNESS_MODE_OPTIONS,
	BRANCH_MIRRORING,
	type BranchMirroring,
	BRANCH_MIRRORING_OPTIONS,
	type TreeConfig,
	DEFAULT_TREE_CONFIG,
	SHAPE_DEFAULTS,
	VIEWBOX_WIDTH,
	VIEWBOX_HEIGHT,
	isTreeStage,
	isTreeShape,
	isEvergreen,
} from './types/config.js';

export {
	FRUIT_TYPES,
	type FruitType,
	FRUIT_TYPE_OPTIONS,
	SHAPE_FRUIT_MAP,
	isFruitType,
} from './types/fruit.js';

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

export {
	POTTED_PLANT_STAGES,
	type PottedPlantStage,
	type PottedPlantConfig,
	DEFAULT_POTTED_PLANT_CONFIG,
} from './types/potted_plant_types.js';

export { type OakPrdConfig, DEFAULT_OAK_PRD_CONFIG } from './types/oak_prd_types.js';
