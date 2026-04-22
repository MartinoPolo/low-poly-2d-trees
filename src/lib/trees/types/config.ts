/**
 * Re-export barrel — preserved for backward compatibility with existing importers.
 * The actual definitions live in the focused modules below.
 */
export { TREE_STAGES, type TreeStage, TREE_STAGE_OPTIONS, isTreeStage } from './tree_stages.js';
export { TREE_SHAPES, type TreeShape, TREE_SHAPE_OPTIONS, isTreeShape } from './tree_shapes.js';
export {
	CROOKEDNESS_MODES,
	type CrookednessMode,
	CROOKEDNESS_MODE_OPTIONS,
	BRANCH_MIRRORING,
	type BranchMirroring,
	BRANCH_MIRRORING_OPTIONS,
} from './tree_config_enums.js';
export {
	type TreeConfig,
	DEFAULT_TREE_CONFIG,
	VIEWBOX_WIDTH,
	VIEWBOX_HEIGHT,
} from './tree_config.js';
export { SHAPE_DEFAULTS } from './shape_defaults.js';
