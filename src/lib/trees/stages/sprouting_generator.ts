import type { TreeGeometry } from '../types.js';
import { VIEWBOX_WIDTH } from '../types.js';
import { GROUND_LINE_Y, createEmptyStageGeometry } from './constants.js';

/** Sprouting geometry — visual rendering handled by SproutingSvg component. */
export function generateSproutingGeometry(): TreeGeometry {
	const cx = VIEWBOX_WIDTH / 2;
	const groundY = GROUND_LINE_Y;
	const stemTop = groundY - 30;

	return createEmptyStageGeometry({
		trunkTop: { x: cx, y: stemTop },
		trunkMiddle: { x: cx, y: (groundY + stemTop) / 2 },
		trunkBase: { x: cx, y: groundY },
		crownCenter: { x: cx, y: stemTop - 3 },
		crownTop: { x: cx, y: stemTop - 10 },
		roots: { x: cx, y: groundY + 15 },
		branchTips: [],
		fruitSlots: [],
	});
}
