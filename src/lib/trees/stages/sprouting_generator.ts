import type { TreeGeometry, Triangle } from '../types.js';
import { GEOMETRY_GROUPS, VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';
import { GROUND_LINE_Y } from './constants.js';

const STEM_COLOR = '#5C4400';
const LEAF_COLOR_LIGHT = '#7BC043';
const LEAF_COLOR_DARK = '#4A7C28';

export function generateSproutingGeometry(): TreeGeometry {
	const cx = VIEWBOX_WIDTH / 2;
	const groundY = GROUND_LINE_Y;
	const stemTop = groundY - 30;

	const trunkTriangles: Triangle[] = [
		{
			points: [
				{ x: cx - 2, y: groundY },
				{ x: cx + 2, y: groundY },
				{ x: cx, y: stemTop },
			],
			color: STEM_COLOR,
			group: GEOMETRY_GROUPS.trunk,
		},
	];

	const canopyTriangles: Triangle[] = [
		{
			points: [
				{ x: cx, y: stemTop + 4 },
				{ x: cx - 12, y: stemTop - 4 },
				{ x: cx - 2, y: stemTop - 10 },
			],
			color: LEAF_COLOR_LIGHT,
			group: GEOMETRY_GROUPS.canopy,
		},
		{
			points: [
				{ x: cx, y: stemTop + 4 },
				{ x: cx + 12, y: stemTop - 4 },
				{ x: cx + 2, y: stemTop - 10 },
			],
			color: LEAF_COLOR_DARK,
			group: GEOMETRY_GROUPS.canopy,
		},
	];

	const anchors = {
		trunkTop: { x: cx, y: stemTop },
		trunkMiddle: { x: cx, y: (groundY + stemTop) / 2 },
		trunkBase: { x: cx, y: groundY },
		crownCenter: { x: cx, y: stemTop - 3 },
		crownTop: { x: cx, y: stemTop - 10 },
		roots: { x: cx, y: groundY + 15 },
		branchTips: [],
		fruitSlots: [],
	};

	return {
		trunkTriangles,
		branchTriangles: [],
		canopyBlobs: [{ triangles: canopyTriangles, depth: 0 }],
		stakeTriangles: [],
		fruitSlots: [],
		anchors,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
	};
}
