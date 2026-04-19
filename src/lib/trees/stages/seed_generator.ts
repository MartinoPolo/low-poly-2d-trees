import type { TreeGeometry } from '../types.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';
import { GROUND_LINE_Y } from './constants.js';

/** Seed geometry — visual rendering handled by SeedSvg component. */
export function generateSeedGeometry(): TreeGeometry {
	const cx = VIEWBOX_WIDTH / 2;
	const groundY = GROUND_LINE_Y;

	const anchors = {
		trunkTop: { x: cx, y: groundY - 23 },
		trunkMiddle: { x: cx, y: groundY - 10 },
		trunkBase: { x: cx, y: groundY + 3 },
		crownCenter: { x: cx, y: groundY - 13 },
		crownTop: { x: cx, y: groundY - 23 },
		roots: { x: cx, y: groundY + 25 },
		branchTips: [],
		fruitSlots: [],
	};

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
		birchStripes: [],
		anchors,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
	};
}
