import { createPrng, randomInRange } from './prng.js';
import type { BlobGeometry, Point2D } from './types/core.js';

export const GROWTH_DURATION_SECONDS = 3;

export const FALLING_LEAF_STATES = {
	falling: 'falling',
	landed: 'landed',
	fading: 'fading',
} as const;

// fallow-ignore-next-line unused-type
export type FallingLeafState = (typeof FALLING_LEAF_STATES)[keyof typeof FALLING_LEAF_STATES];

export interface FallingLeaf {
	readonly id: number;
	readonly x: number;
	readonly y: number;
	readonly landedY: number;
	readonly scatterX: number;
	readonly fallDuration: number;
	readonly rotation: number;
	readonly color: string;
	readonly state: FallingLeafState;
	readonly stateStartTime: number;
}

export const FALLING_LEAF_CONFIG = {
	maxLeaves: 18,
	spawnIntervalMs: 800,
	landedDurationMs: 10_000,
	fadeDurationMs: 1_500,
	fallDurationMinSeconds: 2,
	fallDurationMaxSeconds: 4,
	scatterMinPx: 10,
	scatterMaxPx: 20,
	colors: ['#E8A028', '#C47020', '#8B2010', '#A05020', '#D08030'] as readonly string[],
} as const;

export function createFallingLeaf(
	id: number,
	crownCenter: Point2D,
	canopyBottomY: number,
	groundLineY: number,
	seed: number,
	now: number,
): FallingLeaf {
	const rng = createPrng(seed + id * 3333);
	const startX = crownCenter.x + randomInRange(rng, -30, 30);
	const startY = (crownCenter.y + canopyBottomY) / 2 + randomInRange(rng, -5, 15);
	const scatterDirection = rng() > 0.5 ? 1 : -1;
	const scatterAmount =
		randomInRange(rng, FALLING_LEAF_CONFIG.scatterMinPx, FALLING_LEAF_CONFIG.scatterMaxPx) *
		scatterDirection;

	return {
		id,
		x: startX,
		y: startY,
		landedY: groundLineY,
		scatterX: scatterAmount,
		fallDuration: randomInRange(
			rng,
			FALLING_LEAF_CONFIG.fallDurationMinSeconds,
			FALLING_LEAF_CONFIG.fallDurationMaxSeconds,
		),
		rotation: randomInRange(rng, -180, 180),
		color: FALLING_LEAF_CONFIG.colors[
			Math.floor(rng() * FALLING_LEAF_CONFIG.colors.length)
		] as string,
		state: FALLING_LEAF_STATES.falling,
		stateStartTime: now,
	};
}

export function advanceFallingLeaves(leaves: FallingLeaf[], now: number): FallingLeaf[] {
	const result: FallingLeaf[] = [];

	for (const leaf of leaves) {
		const elapsed = now - leaf.stateStartTime;

		if (leaf.state === FALLING_LEAF_STATES.falling) {
			if (elapsed >= leaf.fallDuration * 1000) {
				result.push({
					...leaf,
					state: FALLING_LEAF_STATES.landed,
					stateStartTime: now,
				});
			} else {
				result.push(leaf);
			}
		} else if (leaf.state === FALLING_LEAF_STATES.landed) {
			if (elapsed >= FALLING_LEAF_CONFIG.landedDurationMs) {
				result.push({
					...leaf,
					state: FALLING_LEAF_STATES.fading,
					stateStartTime: now,
				});
			} else {
				result.push(leaf);
			}
		} else if (leaf.state === FALLING_LEAF_STATES.fading) {
			if (elapsed < FALLING_LEAF_CONFIG.fadeDurationMs) {
				result.push(leaf);
			}
			// else: leaf removed (fading complete)
		}
	}

	return result;
}

/** Deterministic animation delay for per-tree canopy sway phase offset. */
export function computeAnimationDelay(seed: number): number {
	const rng = createPrng(seed);
	return randomInRange(rng, 0, 0.5);
}

/** Deterministic branch sway duration that varies per branch. */
export function computeBranchDuration(seed: number, branchIndex: number): number {
	const rng = createPrng(seed + branchIndex * 1000);
	return randomInRange(rng, 1.5, 4.0);
}

/** Deterministic per-branch phase offset so branches don't start in sync. */
export function computeBranchDelay(seed: number, branchIndex: number): number {
	const rng = createPrng(seed + branchIndex * 2000);
	return randomInRange(rng, 0, 2);
}

/**
 * Compute growth oscillation scale factors from variance (0-100).
 * At 0%: no oscillation (scale = 1). At 100%: branches scale 0.5–1.5.
 */
export function computeGrowthScales(variance: number): {
	minScale: number;
	maxScale: number;
	canopyMinScale: number;
	canopyMaxScale: number;
} {
	const amplitude = (variance / 100) * 0.5;
	const canopyAmplitude = (variance / 100) * 0.08;
	return {
		minScale: 1 - amplitude,
		maxScale: 1 + amplitude,
		canopyMinScale: 1 - canopyAmplitude,
		canopyMaxScale: 1 + canopyAmplitude,
	};
}

/** Returns the maximum Y value across all triangle points in canopy blobs (bottom edge). */
export function computeCanopyBottomY(canopyBlobs: readonly BlobGeometry[]): number {
	let maxY = -Infinity;
	for (const blob of canopyBlobs) {
		for (const tri of blob.triangles) {
			for (const p of tri.points) {
				if (p.y > maxY) {
					maxY = p.y;
				}
			}
		}
	}
	return maxY === -Infinity ? 0 : maxY;
}
