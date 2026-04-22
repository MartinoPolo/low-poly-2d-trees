import type { TreeConfig, Point2D } from '../types.js';
import type { Blob, BranchSegment } from './shape_types.js';

// ---------------------------------------------------------------------------
// Branch generation types
// ---------------------------------------------------------------------------

export interface GeneratedBranch {
	readonly segment: BranchSegment;
	/** Ordered junction list: path[0] = branch origin, path[last] = tip. */
	readonly path: readonly Point2D[];
	readonly depth: number;
	readonly parentIndex: number | null;
}

export interface BranchContext {
	readonly rng: () => number;
	readonly config: TreeConfig;
	readonly trunkJunctions: readonly Point2D[];
	readonly blobs: readonly Blob[];
	readonly trunkTop: number;
	readonly trunkBottom: number;
	readonly canopyBottom: number;
	readonly trunkAxisAngle: number;
	readonly branchThicknessScale: number;
	readonly trunkBaseWidth: number;
	readonly trunkTopWidth: number;
}

/** Fork reduction data for hybrid taper (REQ-EV2-T-01). */
export interface ForkReduction {
	readonly junctionIndex: number;
	readonly reduction: number;
}

export interface BranchGenerationResult {
	readonly branches: GeneratedBranch[];
	readonly forkReductions: ForkReduction[];
}
