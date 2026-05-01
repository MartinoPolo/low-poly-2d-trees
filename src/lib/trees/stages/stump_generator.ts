import type { TreeGeometry } from '../types.js';
import { VIEWBOX_WIDTH } from '../types.js';
import { GROUND_LINE_Y, createEmptyStageGeometry } from './constants.js';

/** Stump geometry — visual rendering handled by StumpSvg component. */
export function generateStumpGeometry(): TreeGeometry {
	const cx = VIEWBOX_WIDTH / 2;
	const groundY = GROUND_LINE_Y;
	const stumpTop = groundY - 20;

	return createEmptyStageGeometry({
		trunkTop: { x: cx, y: stumpTop - 3 },
		trunkMiddle: { x: cx, y: (groundY + stumpTop) / 2 },
		trunkBase: { x: cx, y: groundY },
		crownCenter: { x: cx, y: stumpTop - 3 },
		crownTop: { x: cx, y: stumpTop - 3 },
		roots: { x: cx, y: groundY + 15 },
		branchTips: [],
		fruitSlots: [],
	});
}
