import type { TreeShape } from '../types.js';
import { TREE_SHAPES } from '../types.js';

// REQ-C-12: shapes whose circle-boundary blobs should have acute concavities
// pulled back to the ellipse ring for a rounder silhouette.
export const SHAPES_WITH_ACUTE_SMOOTHING = new Set<TreeShape>([
	TREE_SHAPES.oak,
	TREE_SHAPES.birch,
	TREE_SHAPES.maple,
	TREE_SHAPES.willow,
	TREE_SHAPES.apple,
	TREE_SHAPES.cherry,
	TREE_SHAPES.bush,
	TREE_SHAPES.baobab,
	TREE_SHAPES.acacia,
]);

/** Shapes that use tier-based canopy rendering instead of blob-based. */
export const TIERED_SHAPES = new Set<TreeShape>([TREE_SHAPES.pine, TREE_SHAPES.fir]);

const DEPTH_DARKENING_FLOOR = 0.75;
const DEPTH_DARKENING_RANGE = 0.25;

export function computeDepthDarkeningFactor(normalizedDepth: number): number {
	return DEPTH_DARKENING_FLOOR + DEPTH_DARKENING_RANGE * normalizedDepth;
}
