import type { BirchStripe, Point2D } from '../types.js';

// ---------------------------------------------------------------------------
// Birch trunk stripes
// ---------------------------------------------------------------------------

/** Interpolate trunk centerX and width at a given y by finding bracketing junctions. */
function interpolateTrunkAtY(
	y: number,
	junctions: readonly { x: number; y: number }[],
	junctionWidths: readonly number[],
): { centerX: number; width: number } {
	// Junctions are ordered bottom-to-top (index 0 = bottom = highest Y).
	// Find two junctions that bracket the given y.
	for (let i = 0; i < junctions.length - 1; i++) {
		const lower = junctions[i]!; // higher Y (lower on screen)
		const upper = junctions[i + 1]!; // lower Y (higher on screen)
		if (y <= lower.y && y >= upper.y) {
			const range = lower.y - upper.y;
			const t = range > 0 ? (lower.y - y) / range : 0;
			const centerX = lower.x + (upper.x - lower.x) * t;
			const lowerWidth = junctionWidths[i] ?? 0;
			const upperWidth = junctionWidths[i + 1] ?? 0;
			const width = lowerWidth + (upperWidth - lowerWidth) * t;
			return { centerX, width };
		}
	}
	// Fallback: use the closest junction
	const last = junctions[junctions.length - 1]!;
	return { centerX: last.x, width: junctionWidths[junctions.length - 1] ?? 0 };
}

export function generateBirchStripes(
	junctions: readonly Point2D[],
	junctionWidths: readonly number[],
	rng: () => number,
): BirchStripe[] {
	if (junctions.length < 2) {
		return [];
	}
	const topY = junctions[junctions.length - 1]!.y;
	const bottomY = junctions[0]!.y;
	const trunkHeight = bottomY - topY;
	if (trunkHeight <= 0) {
		return [];
	}
	// 3-6 stripes evenly distributed along trunk height
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
