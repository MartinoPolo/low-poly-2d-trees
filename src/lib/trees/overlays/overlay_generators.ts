import { createPrng, randomInRange } from '$lib/trees/prng.js';
import type { RainLine } from './overlay_types.js';

export function generateRainLines(seed: number, count: number, cloudWidth: number): RainLine[] {
	const rng = createPrng(seed);
	const lines: RainLine[] = [];

	for (let i = 0; i < count; i++) {
		lines.push({
			x: randomInRange(rng, 0, cloudWidth),
			y: randomInRange(rng, 0, 20),
			length: randomInRange(rng, 4, 12),
			delay: randomInRange(rng, 0, 1.5),
			speed: randomInRange(rng, 0.3, 0.8),
		});
	}

	return lines;
}
