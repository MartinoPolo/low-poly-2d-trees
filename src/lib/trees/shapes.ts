// Barrel re-export — the actual definitions live in shapes/*.ts modules.
export type { Blob, BranchSegment } from './shapes/shape_types.js';

export {
	computeEffectiveTrunkTop,
	buildTrunkPath,
	sampleTrunkCenterX,
	isPointInTrunkPath,
	computeJunctionBisectors,
	computeZoneSplit,
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
	sampleTierBoundary,
	repositionIsolatedBlobs,
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
	buildBranchPath,
	computeEffectiveBranchSegments,
	samplePointAlongPath,
	trimBranchTipsToBlobs,
	type GeneratedBranch,
	type ForkReduction,
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

export { computeMaxBranches, clampBranchMaximums } from './shapes/branch_maximums.js';
