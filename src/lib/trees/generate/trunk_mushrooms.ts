import type { TrunkMushroom, Point2D } from '../types.js';
import { computeTrunkHeightRange, interpolateTrunkAtY } from './trunk_interpolation.js';

const MUSHROOM_COUNT_MIN = 2;
const MUSHROOM_COUNT_MAX = 4;
const VARIANT_COUNT = 3;
const SCALE_MIN = 0.6;
const SCALE_RANGE = 0.6;

export function generateTrunkMushrooms(
	junctions: readonly Point2D[],
	junctionWidths: readonly number[],
	rng: () => number,
): TrunkMushroom[] {
	const range = computeTrunkHeightRange(junctions);
	if (range === null) {
		return [];
	}
	const { topY, height: trunkHeight } = range;

	const mushroomCount =
		MUSHROOM_COUNT_MIN + Math.floor(rng() * (MUSHROOM_COUNT_MAX - MUSHROOM_COUNT_MIN + 1));
	const mushrooms: TrunkMushroom[] = [];

	for (let i = 0; i < mushroomCount; i++) {
		const y = topY + rng() * trunkHeight;
		const { centerX: trunkCenterX, width: trunkWidth } = interpolateTrunkAtY(
			y,
			junctions,
			junctionWidths,
		);
		const side: 'left' | 'right' = rng() < 0.5 ? 'left' : 'right';
		const centerX =
			side === 'left' ? trunkCenterX - trunkWidth / 2 : trunkCenterX + trunkWidth / 2;
		const variant = Math.floor(rng() * VARIANT_COUNT);
		const scale = SCALE_MIN + rng() * SCALE_RANGE;

		mushrooms.push({ y, centerX, side, variant, scale });
	}

	return mushrooms;
}
