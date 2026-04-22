// ---------------------------------------------------------------------------
// Boundary module — public re-exports and registry
// ---------------------------------------------------------------------------

export { BOUNDARY_KINDS } from './types.js';
export type { BoundaryKind } from './types.js';

export { circleBoundary } from './circle_boundary.js';
export { teardropBoundary } from './teardrop_boundary.js';
export { eggBoundary } from './egg_boundary.js';
export { equilateralTriangleBoundary, isoscelesTriangleBoundary } from './triangle_boundary.js';
export { sampleBilateralEdges } from './bilateral_sampling.js';
export { smoothAcuteBoundaryAngles } from './acute_angle_smoothing.js';

import { BOUNDARY_KINDS } from './types.js';
import type { BoundaryKind, BoundaryShape } from './types.js';
import { circleBoundary } from './circle_boundary.js';
import { teardropBoundary } from './teardrop_boundary.js';
import { eggBoundary } from './egg_boundary.js';
import { equilateralTriangleBoundary, isoscelesTriangleBoundary } from './triangle_boundary.js';

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const BOUNDARIES = {
	[BOUNDARY_KINDS.circle]: circleBoundary,
	[BOUNDARY_KINDS.teardrop]: teardropBoundary,
	[BOUNDARY_KINDS.egg]: eggBoundary,
	[BOUNDARY_KINDS.isoscelesTriangle]: isoscelesTriangleBoundary,
	[BOUNDARY_KINDS.equilateralTriangle]: equilateralTriangleBoundary,
} as const satisfies Record<BoundaryKind, BoundaryShape>;
