import { createPrng, randomInRange } from '$lib/trees/prng.js';
import type { Point2D } from '$lib/trees/types/core.js';
import {
	GROUND_ELEMENT_COUNTS,
	GROUND_MIN_SPACING_RATIO,
	type GroundPlacement,
} from './ground_types.js';

const ELEMENT_WIDTH_ESTIMATE = 10;
const MAX_PLACEMENT_ATTEMPTS = 50;
const TRUNK_MIN_GAP = 8;

function hasSpacingConflict(
	candidateX: number,
	candidateScale: number,
	existingPlacements: readonly GroundPlacement[],
	type: GroundPlacement['type'],
): boolean {
	for (const placed of existingPlacements) {
		if (placed.type !== type) {
			continue;
		}
		const largerScale = Math.max(placed.scale, candidateScale);
		const minSpacing = largerScale * ELEMENT_WIDTH_ESTIMATE * GROUND_MIN_SPACING_RATIO;
		if (Math.abs(candidateX - placed.x) < minSpacing) {
			return true;
		}
	}
	return false;
}

export function generateGroundPlacements(
	seed: number,
	trunkBase: Point2D,
	spreadWidth: number,
): GroundPlacement[] {
	const rng = createPrng(seed + 77777);
	const placements: GroundPlacement[] = [];

	const halfSpread = spreadWidth / 2;

	for (let i = 0; i < GROUND_ELEMENT_COUNTS.stones; i++) {
		const scale = randomInRange(rng, 1.5, 3.0);
		let x: number;
		let attempts = 0;
		do {
			x = trunkBase.x + randomInRange(rng, -halfSpread, halfSpread);
			attempts++;
		} while (
			(Math.abs(x - trunkBase.x) < TRUNK_MIN_GAP ||
				hasSpacingConflict(x, scale, placements, 'stone')) &&
			attempts < MAX_PLACEMENT_ATTEMPTS
		);

		placements.push({
			x,
			y: trunkBase.y + randomInRange(rng, -3, 5),
			type: 'stone',
			variant: Math.floor(rng() * 3),
			scale,
			rotation: randomInRange(rng, -15, 15),
		});
	}

	for (let i = 0; i < GROUND_ELEMENT_COUNTS.grass; i++) {
		const scale = randomInRange(rng, 1.75, 3.25);
		let x: number;
		let attempts = 0;
		do {
			x = trunkBase.x + randomInRange(rng, -halfSpread, halfSpread);
			attempts++;
		} while (
			hasSpacingConflict(x, scale, placements, 'grass') &&
			attempts < MAX_PLACEMENT_ATTEMPTS
		);

		placements.push({
			x,
			y: trunkBase.y + randomInRange(rng, -2, 3),
			type: 'grass',
			variant: Math.floor(rng() * 2),
			scale,
			rotation: randomInRange(rng, -10, 10),
		});
	}

	return placements;
}
