import { Z_ORDER_LAYERS, type ZOrderLayer } from './types/core.js';
import { createPrng } from './prng.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Probability that a lit-side branch is classified as front (REQ-EV2-Z-01). */
const LIT_SIDE_FRONT_PROBABILITY = 0.7;

/** Probability that a shadow-side branch is classified as front (REQ-EV2-Z-01). */
const SHADOW_SIDE_FRONT_PROBABILITY = 0.3;

/** Probability that an L2 branch flips its parent's z-order (REQ-EV2-Z-03). */
const CHILD_FLIP_PROBABILITY = 0.2;

/** Seed offset for z-order classification PRNG. */
const Z_ORDER_SEED_OFFSET = 8888;

// ---------------------------------------------------------------------------
// Branch Z-Order Classification (REQ-EV2-Z-01)
// ---------------------------------------------------------------------------

/**
 * Classify an L1 branch as front or back based on light-angle-biased randomness.
 *
 * Branches on the lit side (facing lightAngle) have 70% chance of being front.
 * Branches on the shadow side have 30% chance of being front.
 */
export function classifyBranchZOrder(
	branchOriginX: number,
	trunkCenterX: number,
	lightAngle: number,
	seed: number,
	branchIndex: number,
): 'front' | 'back' {
	const rng = createPrng(seed + Z_ORDER_SEED_OFFSET + branchIndex * 31);

	// Light direction: positive x = light from right
	const lightDirectionX = Math.cos((lightAngle * Math.PI) / 180);

	// Branch is on lit side if it's on the same side as where light comes from
	const branchSideX = branchOriginX - trunkCenterX;
	const isLitSide = branchSideX * lightDirectionX > 0;

	const frontProbability = isLitSide ? LIT_SIDE_FRONT_PROBABILITY : SHADOW_SIDE_FRONT_PROBABILITY;

	return rng() < frontProbability ? 'front' : 'back';
}

// ---------------------------------------------------------------------------
// Child Branch Z-Order Inheritance (REQ-EV2-Z-03)
// ---------------------------------------------------------------------------

/**
 * Classify an L2+ branch by inheriting parent's z-order with ~20% flip chance.
 */
export function classifyChildBranchZOrder(
	parentZOrder: 'front' | 'back',
	seed: number,
	childIndex: number,
): 'front' | 'back' {
	const rng = createPrng(seed + Z_ORDER_SEED_OFFSET + 500 + childIndex * 37);

	if (rng() < CHILD_FLIP_PROBABILITY) {
		return parentZOrder === 'front' ? 'back' : 'front';
	}
	return parentZOrder;
}

// ---------------------------------------------------------------------------
// Canopy Blob Z-Order (REQ-EV2-CZ-01)
// ---------------------------------------------------------------------------

/**
 * Classify a canopy blob based on its cluster's branch z-orders (REQ-EV2-CZ-01).
 *
 * - Trunk-tip cluster: always front (regardless of branch contents).
 * - Single branch: inherit that branch's status.
 * - All-back multi-branch: back.
 * - Mixed / empty non-trunk: front.
 */
export function classifyCanopyBlobZOrder(
	branchZOrders: readonly ('front' | 'back')[],
	isTrunkTipCluster: boolean,
): 'front' | 'back' {
	if (isTrunkTipCluster) {
		return 'front';
	}

	if (branchZOrders.length === 0) {
		return 'front';
	}

	if (branchZOrders.length === 1) {
		return branchZOrders[0]!;
	}

	// Mixed: check if all same, otherwise default front
	const allBack = branchZOrders.every((z) => z === 'back');
	return allBack ? 'back' : 'front';
}

// ---------------------------------------------------------------------------
// Z-Order to Layer Mapping
// ---------------------------------------------------------------------------

/** Map front/back branch classification to z-order layer constant. */
export function branchZOrderToLayer(zOrder: 'front' | 'back'): ZOrderLayer {
	return zOrder === 'front' ? Z_ORDER_LAYERS.frontBranches : Z_ORDER_LAYERS.backBranches;
}

/** Map front/back canopy classification to z-order layer constant. */
export function canopyZOrderToLayer(zOrder: 'front' | 'back'): ZOrderLayer {
	return zOrder === 'front' ? Z_ORDER_LAYERS.frontCanopy : Z_ORDER_LAYERS.backCanopy;
}
