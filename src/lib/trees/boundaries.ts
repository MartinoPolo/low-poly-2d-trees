// ---------------------------------------------------------------------------
// Backwards-compatible re-export barrel.
// All implementation has moved to ./boundaries/ — import from there directly
// or continue using this path; both resolve identically.
// ---------------------------------------------------------------------------
export {
	BOUNDARY_KINDS,
	BOUNDARIES,
	circleBoundary,
	teardropBoundary,
	eggBoundary,
	equilateralTriangleBoundary,
	isoscelesTriangleBoundary,
	sampleBilateralEdges,
	smoothAcuteBoundaryAngles,
} from './boundaries/index.js';
export type { BoundaryKind } from './boundaries/index.js';
