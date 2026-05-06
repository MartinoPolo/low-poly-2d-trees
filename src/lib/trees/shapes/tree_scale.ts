import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';

const W = VIEWBOX_WIDTH;
const H = VIEWBOX_HEIGHT;

// ---------------------------------------------------------------------------
// Tree scale helpers — compress 500-viewbox geometry to 300-equivalent size
// ---------------------------------------------------------------------------

export const TREE_SCALE = 0.6;
export const TRUNK_DEAD_SPACE_PERCENT = 0.05;
const TRUNK_BASE_Y = H * (1 - TRUNK_DEAD_SPACE_PERCENT);

/** Map a fractional Y position into scaled tree space, anchored at the ground. */
export function treeY(fraction: number): number {
	return TRUNK_BASE_Y - (TRUNK_BASE_Y - H * fraction) * TREE_SCALE;
}

/** Scale a vertical size (H * fraction) by TREE_SCALE. */
export function treeSizeH(fraction: number): number {
	return H * fraction * TREE_SCALE;
}

/** Scale a horizontal size (W * fraction) by TREE_SCALE. */
export function treeSizeW(fraction: number): number {
	return W * fraction * TREE_SCALE;
}
