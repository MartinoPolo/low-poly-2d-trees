// Barrel re-export — the actual definitions live in shapes/*.ts modules.
export type { Blob, BranchSegment } from './shapes/shape_types.js';

export {
	computeEffectiveTrunkTop,
	buildTrunkPath,
	sampleTrunkCenterX,
	isPointInTrunkPath,
} from './shapes/trunk.js';

export { generateTiers, isPointInTier, getTiersBounds } from './shapes/tiers.js';

export {
	assignBlobDepths,
	applyBlobSizeVariance,
	applyBlobCloseness,
	applyCanopySize,
} from './shapes/blob_modifiers.js';

export {
	getBlobsBounds,
	isPointInBlobs,
	isPointInBranch,
	sampleTierBoundary,
	validateNoFloatingBlobs,
} from './shapes/shape_bounds.js';

export {
	raySegmentEllipseIntersection,
	raySegmentTriangleIntersection,
	computeVisibleBranchLength,
	branchesOverlap,
	resolveBranchLengthRange,
} from './shapes/geometry.js';

export {
	generateBranches,
	TRUNK_BRANCH_WIDTH_START_MIN,
	TRUNK_BRANCH_WIDTH_START_MAX,
	TRUNK_BRANCH_WIDTH_END_MIN,
	TRUNK_BRANCH_WIDTH_END_MAX,
} from './shapes/branch_generation.js';

export {
	getShapeDefinition,
	generateCustomBlobs,
	growCustomBlobs,
	DRAWS_PER_BLOB,
	CUSTOM_BLOB_SPREAD_RADIUS,
	CUSTOM_BLOB_CANOPY_CENTER_X,
	CUSTOM_BLOB_CANOPY_CENTER_Y,
	TRUNK_ENTRY_MIN_PX,
} from './shapes/blob_generators.js';
