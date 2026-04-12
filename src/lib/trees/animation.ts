import { createPrng, randomInRange } from './prng.js';

/** Deterministic animation delay for per-tree canopy sway phase offset. */
export function computeAnimationDelay(seed: number): number {
	const rng = createPrng(seed);
	return randomInRange(rng, 0, 3);
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
