import type { TreeGeometry } from '../types.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';
import { GROUND_LINE_Y } from './constants.js';

/** Seed geometry — visual rendering handled by SeedSvg component. */
export function generateSeedGeometry(): TreeGeometry {
	const cx = VIEWBOX_WIDTH / 2;
	const groundY = GROUND_LINE_Y;

	const anchors = {
		trunkTop: { x: cx, y: groundY - 14 },
		trunkMiddle: { x: cx, y: groundY - 6 },
		trunkBase: { x: cx, y: groundY + 2 },
		crownCenter: { x: cx, y: groundY - 8 },
		crownTop: { x: cx, y: groundY - 14 },
		roots: { x: cx, y: groundY + 15 },
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
		showSnowBlobs: false,
		snowAboveCanopy: false,
		birchStripes: [],
		anchors,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
	};
}
