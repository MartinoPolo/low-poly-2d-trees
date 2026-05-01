import type { BirchStripe, Point2D } from '../types.js';
import { computeTrunkHeightRange, interpolateTrunkAtY } from './trunk_interpolation.js';

// ---------------------------------------------------------------------------
// Birch trunk stripes
// ---------------------------------------------------------------------------

export function generateBirchStripes(
	junctions: readonly Point2D[],
	junctionWidths: readonly number[],
	rng: () => number,
): BirchStripe[] {
	const range = computeTrunkHeightRange(junctions);
	if (range === null) {
		return [];
	}
	const { topY, height: trunkHeight } = range;
	const stripeCount = 3 + Math.floor(rng() * 4);
	const stripes: BirchStripe[] = [];
	for (let i = 0; i < stripeCount; i++) {
		const t = (i + 0.5) / stripeCount; // normalized position (0=top, 1=bottom)
		const y = topY + trunkHeight * t;
		const { centerX, width } = interpolateTrunkAtY(y, junctions, junctionWidths);
		const stripeHeight = 1.5 + rng() * 1.5; // 1.5-3px tall
		const stripeWidth = width * (0.7 + rng() * 0.25); // 70-95% of trunk width
		const lightness = 15 + Math.floor(rng() * 15); // dark grey
		stripes.push({
			y,
			centerX,
			width: stripeWidth,
			height: stripeHeight,
			color: `hsl(0, 0%, ${lightness}%)`,
		});
	}
	return stripes;
}
