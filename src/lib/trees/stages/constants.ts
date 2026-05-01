import type { TreeAnchors, TreeGeometry } from '../types.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';

/** Ground line Y position, aligned with shape system trunkBottom (H * 0.95). */
export const GROUND_LINE_Y = VIEWBOX_HEIGHT * 0.95;

export function createEmptyStageGeometry(anchors: TreeAnchors): TreeGeometry {
	return {
		trunkQuads: [],
		trunkTriangles: [],
		branchGroups: [],
		canopyBlobs: [],
		fruitTriangles: [],
		stakeTriangles: [],
		fruitSlots: [],
		flowerSlots: [],
		showFallingLeaves: false,
		showSnowBlobs: false,
		snowAboveCanopy: false,
		birchStripes: [],
		trunkMushrooms: [],
		anchors,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
	};
}
