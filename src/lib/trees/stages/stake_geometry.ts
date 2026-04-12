import type { Triangle, TreeAnchors } from '../types.js';
import { GEOMETRY_GROUPS } from '../types.js';

const STAKE_COLOR_LIGHT = '#A0825A';
const STAKE_COLOR_DARK = '#7A6040';
const STAKE_HALF_WIDTH = 2;
const STAKE_OFFSET_X = 18;

export function generateStakeTriangles(anchors: TreeAnchors): Triangle[] {
	const baseY = anchors.trunkBase.y;
	const topY = anchors.trunkMiddle.y;
	const cx = anchors.trunkBase.x;

	const leftX = cx - STAKE_OFFSET_X;
	const rightX = cx + STAKE_OFFSET_X;

	return [
		// Left stake - front face
		{
			points: [
				{ x: leftX - STAKE_HALF_WIDTH, y: baseY },
				{ x: leftX + STAKE_HALF_WIDTH, y: baseY },
				{ x: leftX, y: topY },
			],
			color: STAKE_COLOR_LIGHT,
			group: GEOMETRY_GROUPS.stake,
		},
		// Left stake - top
		{
			points: [
				{ x: leftX - STAKE_HALF_WIDTH, y: topY + 2 },
				{ x: leftX + STAKE_HALF_WIDTH, y: topY + 2 },
				{ x: leftX, y: topY - 3 },
			],
			color: STAKE_COLOR_DARK,
			group: GEOMETRY_GROUPS.stake,
		},
		// Right stake - front face
		{
			points: [
				{ x: rightX - STAKE_HALF_WIDTH, y: baseY },
				{ x: rightX + STAKE_HALF_WIDTH, y: baseY },
				{ x: rightX, y: topY },
			],
			color: STAKE_COLOR_DARK,
			group: GEOMETRY_GROUPS.stake,
		},
		// Right stake - top
		{
			points: [
				{ x: rightX - STAKE_HALF_WIDTH, y: topY + 2 },
				{ x: rightX + STAKE_HALF_WIDTH, y: topY + 2 },
				{ x: rightX, y: topY - 3 },
			],
			color: STAKE_COLOR_LIGHT,
			group: GEOMETRY_GROUPS.stake,
		},
	];
}
