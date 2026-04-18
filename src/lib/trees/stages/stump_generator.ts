import type { TreeGeometry } from '../types.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';
import { GROUND_LINE_Y } from './constants.js';

/** Stump geometry — visual rendering handled by StumpSvg component. */
export function generateStumpGeometry(): TreeGeometry {
	const cx = VIEWBOX_WIDTH / 2;
	const groundY = GROUND_LINE_Y;
	const stumpTop = groundY - 20;

	const anchors = {
		trunkTop: { x: cx, y: stumpTop - 3 },
		trunkMiddle: { x: cx, y: (groundY + stumpTop) / 2 },
		trunkBase: { x: cx, y: groundY },
		crownCenter: { x: cx, y: stumpTop - 3 },
		crownTop: { x: cx, y: stumpTop - 3 },
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
		birchStripes: [],
		anchors,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
	};
}
