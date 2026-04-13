import type { TreeGeometry, Triangle } from '../types.js';
import { GEOMETRY_GROUPS, VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';
import { GROUND_LINE_Y } from './constants.js';

const STUMP_COLOR_LIGHT = '#8B7355';
const STUMP_COLOR_DARK = '#5C4A32';
const STUMP_TOP_COLOR = '#A08060';

export function generateStumpGeometry(): TreeGeometry {
	const cx = VIEWBOX_WIDTH / 2;
	const groundY = GROUND_LINE_Y;
	const stumpTop = groundY - 20;
	const halfWidth = 12;

	const trunkTriangles: Triangle[] = [
		{
			points: [
				{ x: cx - halfWidth, y: groundY },
				{ x: cx, y: groundY },
				{ x: cx - halfWidth + 2, y: stumpTop },
			],
			color: STUMP_COLOR_DARK,
			group: GEOMETRY_GROUPS.trunk,
		},
		{
			points: [
				{ x: cx, y: groundY },
				{ x: cx + halfWidth, y: groundY },
				{ x: cx + halfWidth - 2, y: stumpTop },
			],
			color: STUMP_COLOR_LIGHT,
			group: GEOMETRY_GROUPS.trunk,
		},
		{
			points: [
				{ x: cx - halfWidth + 2, y: stumpTop },
				{ x: cx + halfWidth - 2, y: stumpTop },
				{ x: cx, y: groundY },
			],
			color: STUMP_COLOR_DARK,
			group: GEOMETRY_GROUPS.trunk,
		},
		{
			points: [
				{ x: cx - halfWidth + 2, y: stumpTop },
				{ x: cx + halfWidth - 2, y: stumpTop },
				{ x: cx, y: stumpTop - 3 },
			],
			color: STUMP_TOP_COLOR,
			group: GEOMETRY_GROUPS.trunk,
		},
	];

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
		trunkTriangles,
		branchTriangles: [],
		branchGroups: [],
		canopyBlobs: [],
		fruitTriangles: [],
		stakeTriangles: [],
		fruitSlots: [],
		anchors,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
	};
}
