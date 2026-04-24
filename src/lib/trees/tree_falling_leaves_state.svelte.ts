import {
	createFallingLeaf,
	advanceFallingLeaves,
	FALLING_LEAF_CONFIG,
	type FallingLeaf,
} from '$lib/trees/animation.js';
import { GROUND_LINE_Y } from '$lib/trees/stages/constants.js';
import type { Point2D, BlobGeometry } from '$lib/trees/types/core.js';
import { computeCanopyBottomY } from '$lib/trees/animation.js';

/** @knipignore */
export interface FallingLeavesStateInput {
	readonly showFallingLeaves: boolean;
	readonly crownCenter: Point2D;
	readonly canopyBlobs: readonly BlobGeometry[];
	readonly seed: number;
}

/**
 * Manages the reactive falling-leaf particle state for a tree.
 * Call `createFallingLeavesState` to get the reactive `leaves` array and
 * register the spawning effect. The returned object is used by
 * `TreeFallingLeavesLayer`.
 */
export function createFallingLeavesState(getInput: () => FallingLeavesStateInput) {
	let fallingLeaves = $state<FallingLeaf[]>([]);
	let leafIdCounter = 0;

	$effect(() => {
		const { showFallingLeaves, crownCenter, canopyBlobs, seed } = getInput();

		if (!showFallingLeaves) {
			fallingLeaves = [];
			leafIdCounter = 0;
			return;
		}

		const canopyBottom = computeCanopyBottomY(canopyBlobs);

		const interval = setInterval(() => {
			const now = Date.now();
			let updated = advanceFallingLeaves(fallingLeaves, now);

			if (updated.length < FALLING_LEAF_CONFIG.maxLeaves) {
				const newLeaf = createFallingLeaf(
					leafIdCounter,
					crownCenter,
					canopyBottom,
					GROUND_LINE_Y,
					seed,
					now,
				);
				updated = [...updated, newLeaf];
				leafIdCounter++;
			}

			fallingLeaves = updated;
		}, FALLING_LEAF_CONFIG.spawnIntervalMs);

		return () => clearInterval(interval);
	});

	return {
		get leaves(): FallingLeaf[] {
			return fallingLeaves;
		},
	};
}
