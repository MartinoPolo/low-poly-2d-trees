export type { Blob, BranchSegment, ShapeDefinition } from './shape-types.js';

export {
	computeEffectiveTrunkTop,
	buildTrunkPath,
	sampleTrunkCenterX,
	isPointInTrunkPath,
} from './trunk.js';

export { generateTiers, isPointInTier, getTiersBounds } from './tiers.js';

export {
	assignBlobDepths,
	applyBlobSizeVariance,
	applyBlobCloseness,
	applyCanopySize,
} from './blob-modifiers.js';

export {
	isPointInBlobs,
	isPointInSingleBlob,
	getBlobsBounds,
	isPointInBranch,
	sampleTierBoundary,
	validateNoFloatingBlobs,
} from './shape-bounds.js';

export {
	raySegmentEllipseIntersection,
	raySegmentTriangleIntersection,
	computeVisibleBranchLength,
	branchesOverlap,
	resolveBranchLengthRange,
} from './geometry.js';

export {
	generateBranches,
	TRUNK_BRANCH_WIDTH_START_MIN,
	TRUNK_BRANCH_WIDTH_START_MAX,
	TRUNK_BRANCH_WIDTH_END_MIN,
	TRUNK_BRANCH_WIDTH_END_MAX,
} from './branch-generation.js';

export {
	getShapeDefinition,
	generateCustomBlobs,
	growCustomBlobs,
	DRAWS_PER_BLOB,
	CUSTOM_BLOB_SPREAD_RADIUS,
	CUSTOM_BLOB_CANOPY_CENTER_X,
	CUSTOM_BLOB_CANOPY_CENTER_Y,
	TRUNK_ENTRY_MIN_PX,
} from './blob-generators.js';
