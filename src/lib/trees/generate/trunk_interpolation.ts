interface TrunkHeightRange {
	readonly topY: number;
	readonly bottomY: number;
	readonly height: number;
}

export function computeTrunkHeightRange(
	junctions: readonly { y: number }[],
): TrunkHeightRange | null {
	if (junctions.length < 2) {
		return null;
	}
	const topY = junctions[junctions.length - 1]!.y;
	const bottomY = junctions[0]!.y;
	const height = bottomY - topY;
	if (height <= 0) {
		return null;
	}
	return { topY, bottomY, height };
}

/** Interpolate trunk centerX and width at a given y by finding bracketing junctions. */
export function interpolateTrunkAtY(
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
