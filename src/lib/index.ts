// ---------------------------------------------------------------------------
// Public API barrel — library boundary for @low-poly-2d-trees
// ---------------------------------------------------------------------------

/** Svelte components */
export { default as LowPolyTree } from './trees/LowPolyTree.svelte';
export { default as PottedPlant } from './trees/PottedPlant.svelte';

/** Tree geometry generators */
export { generateTree } from './trees/generate.js';
export { generatePottedPlant } from './trees/potted_plant_generator.js';

/** Core geometry primitives, groups, and z-ordering */
export {
	GEOMETRY_GROUPS,
	Z_ORDER_LAYERS,
	type ZOrderLayer,
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
	type TrunkMushroom,
	type TreeGeometry,
} from './trees/types/core.js';

/** Tree configuration and viewbox constants */
export {
	type TreeConfig,
	DEFAULT_TREE_CONFIG,
	VIEWBOX_WIDTH,
	VIEWBOX_HEIGHT,
} from './trees/types/tree_config.js';

/** Tree scale and ground alignment */
export { TRUNK_DEAD_SPACE_PERCENT } from './trees/shapes/tree_scale.js';

/** Convex hull computation for hover targets */
export {
	computeConvexHull,
	padConvexHull,
	extractTreeVertices,
	computeTreeHull,
} from './trees/convex_hull.js';

/** Tree shape definitions and guards */
export {
	TREE_SHAPES,
	type TreeShape,
	TREE_SHAPE_OPTIONS,
	isTreeShape,
	isEvergreen,
} from './trees/types/tree_shapes.js';

/** Tree stage definitions and guards */
export {
	TREE_STAGES,
	type TreeStage,
	TREE_STAGE_OPTIONS,
	isTreeStage,
} from './trees/types/tree_stages.js';

/** Trunk/branch configuration enums */
export {
	CROOKEDNESS_MODES,
	type CrookednessMode,
	CROOKEDNESS_MODE_OPTIONS,
	BRANCH_MIRRORING,
	type BranchMirroring,
	BRANCH_MIRRORING_OPTIONS,
} from './trees/types/tree_config_enums.js';

/** Per-shape default configurations */
export { SHAPE_DEFAULTS } from './trees/types/shape_defaults.js';

/** Fruit type definitions, mappings, and guards */
export {
	FRUIT_TYPES,
	type FruitType,
	FRUIT_TYPE_OPTIONS,
	SHAPE_FRUIT_MAP,
	isFruitType,
} from './trees/types/fruit.js';

/** Custom blob editor types and constants */
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
} from './trees/types/custom.js';

/** Potted plant configuration and stages */
export {
	POTTED_PLANT_STAGES,
	type PottedPlantStage,
	type PottedPlantConfig,
	DEFAULT_POTTED_PLANT_CONFIG,
} from './trees/types/potted_plant_types.js';

/** Tool type definitions, visibility, and options */
export {
	TOOL_TYPES,
	type ToolType,
	type ToolVisibilityEntry,
	type ToolVisibility,
	createDefaultToolVisibility,
	TOOL_OPTIONS,
} from './trees/tools/tool_types.js';

/** Tool definitions — anchor targets, snap offsets, pivot points, SVG components */
export {
	type ToolAnchorKey,
	type ToolDefinition,
	TOOL_DEFINITIONS,
} from './trees/tools/tool_definitions.js';

/** Tool animation configuration */
export {
	type ToolAnimationConfig,
	TOOL_ANIMATIONS,
	getToolAnimation,
} from './trees/tools/tool_animations.js';

/** Overlay and glow configuration */
export {
	type GlowConfig,
	GLOW_LIMITS,
	type OverlayConfig,
	OVERLAY_DEFAULTS,
	hasActiveOverlay,
} from './trees/overlays/overlay_types.js';

/** Ground element limits */
export { GROUND_LIMITS } from './trees/ground/ground_types.js';

/** Animation timing utilities */
export {
	GROWTH_DURATION_SECONDS,
	computeAnimationDelay,
	computeBranchDuration,
	computeBranchDelay,
	computeGrowthScales,
} from './trees/animation.js';

/** Per-shape disabled parameter rules */
export { DISABLED_PARAMS_BY_SHAPE, isParamDisabled } from './trees/disabled_params.js';

/** Z-order splitting utilities for custom rendering */
export {
	type IndexedBranchGroup,
	type IndexedCanopyBlob,
	type ZOrderedBranches,
	type ZOrderedCanopyBlobs,
	splitRootBranchesByZOrder,
	splitCanopyBlobsByZOrder,
} from './trees/tree_z_ordering.js';

/** Color conversion and interpolation */
export {
	type HslColor,
	hexToHsl,
	hslToHex,
	interpolateHslInHexSpace,
	clamp,
	relativeLuminance,
	contrastTextColor,
} from './trees/color.js';

/** Bird system — sub-agent visualization */
export { BIRD_SPECIES, type BirdSpecies, type BirdConfig } from './trees/birds/bird_types.js';

export { type BirdDefinition, BIRD_DEFINITIONS } from './trees/birds/bird_definitions.js';
