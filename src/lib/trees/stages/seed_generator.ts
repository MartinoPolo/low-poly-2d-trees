import type { TreeGeometry, Triangle } from '../types.js';
import { GEOMETRY_GROUPS, VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';
import { GROUND_LINE_Y } from './constants.js';

const SEED_COLOR_LIGHT = '#8B6914';
const SEED_COLOR_DARK = '#5C4400';
const SOIL_COLOR = '#6B4226';

export function generateSeedGeometry(): TreeGeometry {
	const cx = VIEWBOX_WIDTH / 2;
	const groundY = GROUND_LINE_Y;

	const seedTriangles: Triangle[] = [
		{
			points: [
				{ x: cx - 6, y: groundY - 4 },
				{ x: cx + 6, y: groundY - 4 },
				{ x: cx, y: groundY - 14 },
			],
			color: SEED_COLOR_LIGHT,
			group: GEOMETRY_GROUPS.trunk,
		},
		{
			points: [
				{ x: cx - 6, y: groundY - 4 },
				{ x: cx + 6, y: groundY - 4 },
				{ x: cx, y: groundY + 2 },
			],
			color: SEED_COLOR_DARK,
			group: GEOMETRY_GROUPS.trunk,
		},
		{
			points: [
				{ x: cx - 20, y: groundY + 2 },
				{ x: cx + 20, y: groundY + 2 },
				{ x: cx, y: groundY - 2 },
			],
			color: SOIL_COLOR,
			group: GEOMETRY_GROUPS.trunk,
		},
	];

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
		trunkTriangles: seedTriangles,
		branchTriangles: [],
		branchGroups: [],
		canopyBlobs: [],
		stakeTriangles: [],
		fruitSlots: [],
		anchors,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
	};
}
