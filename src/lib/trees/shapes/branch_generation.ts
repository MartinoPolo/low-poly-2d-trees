import { getBlobsBounds, isPointInSingleBlob } from './shape_bounds.js';
import { sampleTrunkCenterX } from './trunk.js';
import { raySegmentEllipseIntersection } from './geometry.js';
import { randomInRange } from '../prng.js';
import type { TreeConfig, Point2D } from '../types.js';
import type { Blob, BranchSegment } from './shape_types.js';
import { computeAxisAngle, findIsolatedBlobs } from './branch_geometry_helpers.js';
import { generateTrunkBranches } from './branch_l1_generation.js';
import { generateSubBranches } from './branch_sub_generation.js';
import type {
	BranchContext,
	BranchGenerationResult,
	GeneratedBranch,
	ForkReduction,
} from './branch_types.js';

// Re-export public types and utilities for consumers
export type { GeneratedBranch, ForkReduction } from './branch_types.js';
export {
	buildBranchPath,
	samplePointAlongPath,
	computeEffectiveBranchSegments,
} from './branch_path.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateBranches(
	rng: () => number,
	trunkTop: number,
	trunkBottom: number,
	trunkTopWidth: number,
	config: TreeConfig,
	trunkJunctions: readonly Point2D[],
	blobs: readonly Blob[],
	trunkBaseWidth: number = trunkTopWidth * 2,
): BranchGenerationResult {
	const branchDepth = config.branchDepth;
	if (branchDepth <= 0) {
		return { branches: [], forkReductions: [] };
	}

	const branchThicknessScale = config.branchThickness / 100;
	const canopyBottom = blobs.length > 0 ? getBlobsBounds(blobs).maxY : trunkTop;

	const baseJunction = trunkJunctions[0]!;
	const topJunction = trunkJunctions[trunkJunctions.length - 1]!;
	const trunkAxisAngle = computeAxisAngle(
		baseJunction.x,
		baseJunction.y,
		topJunction.x,
		topJunction.y,
	);

	const ctx: BranchContext = {
		rng,
		config,
		trunkJunctions,
		blobs,
		trunkTop,
		trunkBottom,
		canopyBottom,
		trunkAxisAngle,
		branchThicknessScale,
		trunkBaseWidth,
		trunkTopWidth,
	};

	const branches: GeneratedBranch[] = [];

	// Depth 1: trunk-origin branches
	generateTrunkBranches(ctx, branches);

	// Depth 2+: sub-branches (Rule J: stop deeper levels first when cap hit)
	for (let depth = 1; depth < branchDepth; depth++) {
		generateSubBranches(ctx, branches, depth);
	}

	// Floating-blob fallback (Rule G): last resort emergency branches
	const isolatedBlobIndices = findIsolatedBlobs(blobs);
	for (const idx of isolatedBlobIndices) {
		const blob = blobs[idx]!;
		const reached = branches.some((b) => isPointInSingleBlob(b.segment.x2, b.segment.y2, blob));
		if (reached) {
			continue;
		}

		const branchT = randomInRange(rng, 0.1, 0.3);
		const trunkHeight = trunkBottom - trunkTop;
		const originY = trunkTop + trunkHeight * branchT;
		const originX = sampleTrunkCenterX(trunkJunctions, originY);

		const fallbackSegment: BranchSegment = {
			x1: originX,
			y1: originY,
			x2: blob.cx,
			y2: blob.cy,
			widthStart: randomInRange(rng, 5.25, 8.75) * branchThicknessScale,
			widthEnd: randomInRange(rng, 1.75, 3.5) * branchThicknessScale,
		};
		// Fallback branches are straight (no crookedness) � emergency connectors
		branches.push({
			segment: fallbackSegment,
			path: [
				{ x: originX, y: originY },
				{ x: blob.cx, y: blob.cy },
			],
			depth: 1,
			parentIndex: null,
		});
	}

	// Compute fork reductions for L1 branches (REQ-EV2-T-01)
	// Each L1 branch removes its widthStart from the trunk at its junction
	const forkReductions: ForkReduction[] = [];
	for (const branch of branches) {
		if (branch.depth !== 1) {
			continue;
		}
		// Find closest junction index by Y position
		let closestJunctionIdx = 0;
		let closestDist = Infinity;
		for (let j = 0; j < trunkJunctions.length; j++) {
			const dist = Math.abs(trunkJunctions[j]!.y - branch.segment.y1);
			if (dist < closestDist) {
				closestDist = dist;
				closestJunctionIdx = j;
			}
		}
		forkReductions.push({
			junctionIndex: closestJunctionIdx,
			reduction: branch.segment.widthStart,
		});
	}

	return { branches, forkReductions };
}

// ---------------------------------------------------------------------------
// Branch tip trimming to blob boundaries (issue #110)
// ---------------------------------------------------------------------------

/**
 * Trim branch tips that extend past their closest canopy blob ellipse.
 * Mutates the `segment` of each branch in-place.
 */
export function trimBranchTipsToBlobs(branches: GeneratedBranch[], blobs: readonly Blob[]): void {
	if (blobs.length === 0) {
		return;
	}

	for (const branch of branches) {
		const seg = branch.segment;
		const tipX = seg.x2;
		const tipY = seg.y2;

		// Find blob whose center is closest to the branch tip
		let closestIdx = 0;
		let closestDist = Infinity;
		for (let i = 0; i < blobs.length; i++) {
			const dx = blobs[i]!.cx - tipX;
			const dy = blobs[i]!.cy - tipY;
			const dist = dx * dx + dy * dy;
			if (dist < closestDist) {
				closestDist = dist;
				closestIdx = i;
			}
		}

		const blob = blobs[closestIdx]!;

		// Check if tip is outside the blob ellipse
		const ndx = (tipX - blob.cx) / blob.rx;
		const ndy = (tipY - blob.cy) / blob.ry;
		if (ndx * ndx + ndy * ndy <= 1) {
			continue; // inside � no trimming
		}

		// Try to find where the branch segment intersects the blob boundary
		const intersection = raySegmentEllipseIntersection(
			seg.x1,
			seg.y1,
			seg.x2,
			seg.y2,
			blob.cx,
			blob.cy,
			blob.rx,
			blob.ry,
		);

		const mutableSeg = seg as { x2: number; y2: number };
		if (intersection !== null) {
			// Use the exit point � where the branch exits the blob
			const [, tExit] = intersection;
			mutableSeg.x2 = seg.x1 + tExit * (seg.x2 - seg.x1);
			mutableSeg.y2 = seg.y1 + tExit * (seg.y2 - seg.y1);
		} else {
			// Branch misses the blob � project tip onto the blob ellipse boundary
			// along the direction from blob center to the current tip.
			const dirX = tipX - blob.cx;
			const dirY = tipY - blob.cy;
			const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
			if (dirLen > 0) {
				// Point on ellipse boundary in the direction of the tip
				const nx = dirX / dirLen;
				const ny = dirY / dirLen;
				// Parametric ellipse: scale = 1 / sqrt((nx/rx)^2 + (ny/ry)^2)
				const scale = 1 / Math.sqrt((nx / blob.rx) ** 2 + (ny / blob.ry) ** 2);
				mutableSeg.x2 = blob.cx + nx * scale;
				mutableSeg.y2 = blob.cy + ny * scale;
			}
		}
	}
}
