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
 * Uses rejection sampling with a minimum distance constraint and a spatial grid
 * for O(n) amortized proximity checks instead of O(n^2).
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

	const cellSize = minDistance;
	const gridCols = Math.ceil((bounds.maxX - bounds.minX) / cellSize) || 1;
	const gridRows = Math.ceil((bounds.maxY - bounds.minY) / cellSize) || 1;
	const grid: (number | undefined)[][] = Array.from({ length: gridCols * gridRows }, () => []);

	function gridKey(x: number, y: number): number {
		const col = Math.min(Math.floor((x - bounds.minX) / cellSize), gridCols - 1);
		const row = Math.min(Math.floor((y - bounds.minY) / cellSize), gridRows - 1);
		return row * gridCols + col;
	}

	function isTooClose(x: number, y: number): boolean {
		const col = Math.min(Math.floor((x - bounds.minX) / cellSize), gridCols - 1);
		const row = Math.min(Math.floor((y - bounds.minY) / cellSize), gridRows - 1);
		const minDist2 = minDistance * minDistance;
		for (let dr = -2; dr <= 2; dr++) {
			for (let dc = -2; dc <= 2; dc++) {
				const nr = row + dr;
				const nc = col + dc;
				if (nr < 0 || nr >= gridRows || nc < 0 || nc >= gridCols) {
					continue;
				}
				const cell = grid[nr * gridCols + nc]!;
				for (const idx of cell) {
					if (idx === undefined) {
						continue;
					}
					const p = points[idx]!;
					const dx = p.x - x;
					const dy = p.y - y;
					if (dx * dx + dy * dy < minDist2) {
						return true;
					}
				}
			}
		}
		return false;
	}

	while (points.length < count && attempts < maxAttempts) {
		attempts++;
		const x = randomInRange(rng, bounds.minX, bounds.maxX);
		const y = randomInRange(rng, bounds.minY, bounds.maxY);

		if (!isInside(x, y)) {
			continue;
		}
		if (isTooClose(x, y)) {
			continue;
		}

		const idx = points.length;
		points.push({ x, y });
		grid[gridKey(x, y)]!.push(idx);
	}

	return points;
}
