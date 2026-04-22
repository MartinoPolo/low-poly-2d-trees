import { Z_ORDER_LAYERS } from '$lib/trees/types/core.js';
import type { BlobGeometry, BranchGeometry } from '$lib/trees/types/core.js';

export interface IndexedBranchGroup {
	readonly group: BranchGeometry;
	readonly index: number;
}

export interface IndexedCanopyBlob {
	readonly blob: BlobGeometry;
	readonly index: number;
}

/** @knipignore */
export interface ZOrderedBranches {
	readonly backRootBranches: readonly IndexedBranchGroup[];
	readonly frontRootBranches: readonly IndexedBranchGroup[];
}

/** @knipignore */
export interface ZOrderedCanopyBlobs {
	readonly backCanopyBlobs: readonly IndexedCanopyBlob[];
	readonly frontCanopyBlobs: readonly IndexedCanopyBlob[];
}

/**
 * Splits root branch groups into back (behind trunk) and front layers.
 * When z-ordering is not active, all branches go to the front layer.
 */
export function splitRootBranchesByZOrder(
	rootBranches: readonly IndexedBranchGroup[],
	hasZOrdering: boolean,
): ZOrderedBranches {
	if (!hasZOrdering) {
		return { backRootBranches: [], frontRootBranches: rootBranches };
	}
	const backRootBranches: IndexedBranchGroup[] = [];
	const frontRootBranches: IndexedBranchGroup[] = [];
	for (let i = 0; i < rootBranches.length; i++) {
		const entry = rootBranches[i]!;
		if (entry.group.zOrder === Z_ORDER_LAYERS.backBranches) {
			backRootBranches.push(entry);
		} else {
			frontRootBranches.push(entry);
		}
	}
	return { backRootBranches, frontRootBranches };
}

/**
 * Splits canopy blobs into back and front layers for 5-layer rendering.
 * Blobs without z-ordering go to the front layer.
 */
export function splitCanopyBlobsByZOrder(
	canopyBlobs: readonly BlobGeometry[],
	hasZOrdering: boolean,
): ZOrderedCanopyBlobs {
	const backCanopyBlobs: IndexedCanopyBlob[] = [];
	const frontCanopyBlobs: IndexedCanopyBlob[] = [];
	for (let i = 0; i < canopyBlobs.length; i++) {
		const blob = canopyBlobs[i]!;
		const entry: IndexedCanopyBlob = { blob, index: i };
		if (hasZOrdering && blob.zOrder === Z_ORDER_LAYERS.backCanopy) {
			backCanopyBlobs.push(entry);
		} else {
			frontCanopyBlobs.push(entry);
		}
	}
	return { backCanopyBlobs, frontCanopyBlobs };
}
