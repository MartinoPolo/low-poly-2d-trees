import type { TreeGeometry } from '../types.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';
import { GROUND_LINE_Y } from './constants.js';

/** Sprouting geometry — visual rendering handled by SproutingSvg component. */
export function generateSproutingGeometry(): TreeGeometry {
	const cx = VIEWBOX_WIDTH / 2;
	const groundY = GROUND_LINE_Y;
	const stemTop = groundY - 50;

	const anchors = {
		trunkTop: { x: cx, y: stemTop },
		trunkMiddle: { x: cx, y: (groundY + stemTop) / 2 },
		trunkBase: { x: cx, y: groundY },
		crownCenter: { x: cx, y: stemTop - 5 },
		crownTop: { x: cx, y: stemTop - 17 },
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
