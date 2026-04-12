import { createPrng } from '$lib/trees/prng.js';
import { SCENE_SHAPES, type SceneConfig, type SceneTreePlacement } from './scene_config.js';

/** Minimum scale for the farthest-back trees. */
const BACK_SCALE = 0.65;

/**
 * Generate deterministic scene tree placements from a config.
 *
 * Returns an array sorted ascending by y (back-to-front) for painter's
 * algorithm rendering — DOM/SVG order matches visual depth.
 */
export function generateSceneLayout(config: SceneConfig): SceneTreePlacement[] {
	const { treeCount, depthSpread, baseSeed } = config;
	const rng = createPrng(baseSeed);

	const placements: SceneTreePlacement[] = [];

	for (let i = 0; i < treeCount; i++) {
		const shape = SCENE_SHAPES[Math.floor(rng() * SCENE_SHAPES.length)];
		const seed = baseSeed + i * 1000 + Math.floor(rng() * 999);
		const x = rng() * 100;
		const y = depthSpread === 0 ? 0 : rng() * depthSpread;

		placements.push({ shape, seed, x, y, scale: 0 }); // scale computed after
	}

	// Derive scale from y relative to depth range
	if (depthSpread === 0) {
		// Flat — all trees at front, full scale
		for (let i = 0; i < placements.length; i++) {
			placements[i] = { ...placements[i], scale: 1 };
		}
	} else {
		const maxY = Math.max(...placements.map((p) => p.y));
		const minY = Math.min(...placements.map((p) => p.y));
		const range = maxY - minY;

		for (let i = 0; i < placements.length; i++) {
			// normalizedDepth 0 = back (min y), 1 = front (max y)
			const normalizedDepth = range === 0 ? 1 : (placements[i].y - minY) / range;
			const scale = BACK_SCALE + normalizedDepth * (1 - BACK_SCALE);
			placements[i] = { ...placements[i], scale };
		}
	}

	// Sort ascending by y — back trees first in DOM = painted behind front trees
	placements.sort((a, b) => a.y - b.y);

	return placements;
}
