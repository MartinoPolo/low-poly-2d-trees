import { createPrng, randomInRange } from '$lib/trees/prng.js';
import type { Point2D } from '$lib/trees/types/core.js';
import { GROUND_ELEMENT_COUNTS, type GroundPlacement } from './ground_types.js';

export function generateGroundPlacements(
	seed: number,
	trunkBase: Point2D,
	spreadWidth: number,
): GroundPlacement[] {
	const rng = createPrng(seed + 77777);
	const placements: GroundPlacement[] = [];

	const halfSpread = spreadWidth / 2;
	const minGap = 8;

	for (let i = 0; i < GROUND_ELEMENT_COUNTS.stones; i++) {
		let x: number;
		let attempts = 0;
		do {
			x = trunkBase.x + randomInRange(rng, -halfSpread, halfSpread);
			attempts++;
		} while (Math.abs(x - trunkBase.x) < minGap && attempts < 10);

		placements.push({
			x,
			y: trunkBase.y + randomInRange(rng, -3, 5),
			type: 'stone',
			variant: Math.floor(rng() * 3),
			scale: randomInRange(rng, 1.5, 3.0),
			rotation: randomInRange(rng, -15, 15),
		});
	}

	for (let i = 0; i < GROUND_ELEMENT_COUNTS.grass; i++) {
		placements.push({
			x: trunkBase.x + randomInRange(rng, -halfSpread, halfSpread),
			y: trunkBase.y + randomInRange(rng, -2, 3),
			type: 'grass',
			variant: Math.floor(rng() * 2),
			scale: randomInRange(rng, 1.75, 3.25),
			rotation: randomInRange(rng, -10, 10),
		});
	}

	return placements;
}
