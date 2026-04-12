import type { Point2D, Triangle } from '../types/core.js';
import { GEOMETRY_GROUPS } from '../types/core.js';
import { FRUIT_TYPES, FRUIT_SPECS, type FruitType } from '../types/fruit.js';

/**
 * Re-export individual shape generators for direct testing.
 * The canonical implementations live in FRUIT_SPECS (types/fruit.ts).
 */
export const generateApple = FRUIT_SPECS[FRUIT_TYPES.apple].generateShape;
export const generateCherry = FRUIT_SPECS[FRUIT_TYPES.cherry].generateShape;
export const generateFlower = FRUIT_SPECS[FRUIT_TYPES.flower].generateShape;

const DEFAULT_FRUIT_SIZE = 4;

/**
 * Dispatches to the correct shape generator per slot, applies FRUIT_SPECS color,
 * sets group to GEOMETRY_GROUPS.fruit.
 */
export function generateFruitAtSlots(
	fruitType: FruitType,
	slots: readonly Point2D[],
	rng: () => number,
): Triangle[] {
	if (fruitType === FRUIT_TYPES.none || slots.length === 0) {
		return [];
	}

	const spec = FRUIT_SPECS[fruitType];
	const triangles: Triangle[] = [];

	for (const slot of slots) {
		const shapeTriangles = spec.generateShape(slot.x, slot.y, DEFAULT_FRUIT_SIZE, rng);
		for (const points of shapeTriangles) {
			triangles.push({
				points,
				color: spec.color,
				group: GEOMETRY_GROUPS.fruit,
			});
		}
	}

	return triangles;
}
