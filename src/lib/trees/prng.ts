/**
 * Mulberry32 — a fast seeded 32-bit PRNG.
 * Returns values in [0, 1).
 */
export function createPrng(seed: number): () => number {
	let s = seed | 0;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function randomInRange(rng: () => number, min: number, max: number): number {
	return min + rng() * (max - min);
}

/**
 * Poisson-disk-like sampling within a polygon defined by a point-in-shape test.
 * Uses rejection sampling with a minimum distance constraint.
 */
export function poissonSample(
	rng: () => number,
	count: number,
	bounds: { minX: number; minY: number; maxX: number; maxY: number },
	isInside: (x: number, y: number) => boolean,
	minDistance: number,
): { x: number; y: number }[] {
	const points: { x: number; y: number }[] = [];
	const maxAttempts = count * 30;
	let attempts = 0;

	while (points.length < count && attempts < maxAttempts) {
		attempts++;
		const x = randomInRange(rng, bounds.minX, bounds.maxX);
		const y = randomInRange(rng, bounds.minY, bounds.maxY);

		if (!isInside(x, y)) {
			continue;
		}

		const tooClose = points.some((p) => {
			const dx = p.x - x;
			const dy = p.y - y;
			return dx * dx + dy * dy < minDistance * minDistance;
		});

		if (!tooClose) {
			points.push({ x, y });
		}
	}

	return points;
}
