import { createPrng } from '$lib/trees/prng.js';
import {
	SCENE_SHAPES,
	LAYER_COUNT,
	TREES_PER_LAYER,
	SCALE_FRONT,
	SCALE_BACK,
	type SceneConfig,
	type SceneTreeInput,
	type SceneTreePlacement,
} from './scene_config.js';

/**
 * Generate deterministic scene tree placements using a 10-layer sequential system.
 *
 * Trees fill layers sequentially: trees 1-10 → layer 1, 11-20 → layer 2, etc.
 * Odd layers share x alignment with layer 1; even layers are staggered by half
 * the inter-tree distance. Output sorted descending by y (painter's algorithm).
 */
export function generateSceneLayout(config: SceneConfig): SceneTreePlacement[] {
	const { treeCount, depthSpread, baseSeed } = config;
	if (treeCount === 0) {
		return [];
	}

	const rng = createPrng(baseSeed);

	// Build input descriptors — use config.trees if provided, else empty
	const inputs: SceneTreeInput[] = Array.from(
		{ length: treeCount },
		(_, i) => config.trees?.[i] ?? {},
	);

	// Assign shapes and seeds upfront using PRNG for determinism
	const shapeSeeds = inputs.map((_, i) => {
		const shape = SCENE_SHAPES[Math.floor(rng() * SCENE_SHAPES.length)];
		const seed = baseSeed + i * 1000 + Math.floor(rng() * 999);
		return { shape, seed };
	});

	const placements: SceneTreePlacement[] = [];

	for (let i = 0; i < treeCount; i++) {
		const layerNumber = Math.floor(i / TREES_PER_LAYER) + 1;
		const slotInLayer = i % TREES_PER_LAYER;

		// Count how many trees are in this layer
		const layerStartIndex = (layerNumber - 1) * TREES_PER_LAYER;
		const countInLayer = Math.min(TREES_PER_LAYER, treeCount - layerStartIndex);

		// X position: equidistant within [0, 100]
		const interTreeDistance = 100 / (countInLayer + 1);
		const baseX = (slotInLayer + 1) * interTreeDistance;

		// Even layers get horizontal offset of half inter-tree distance
		const isEvenLayer = layerNumber % 2 === 0;
		const horizontalOffset = isEvenLayer ? interTreeDistance / 2 : 0;
		const x = baseX + horizontalOffset;

		// Y offset: depthSpread * (layerNumber - 1) / 2
		const y = (depthSpread * (layerNumber - 1)) / 2;

		// Scale: linear interpolation from SCALE_FRONT (layer 1) to SCALE_BACK (layer 10)
		const scale =
			SCALE_FRONT - ((layerNumber - 1) * (SCALE_FRONT - SCALE_BACK)) / (LAYER_COUNT - 1);

		placements.push({
			id: inputs[i].id,
			shape: shapeSeeds[i].shape,
			seed: shapeSeeds[i].seed,
			x,
			y,
			scale,
			layer: layerNumber,
		});
	}

	// Sort descending by y (painter's algorithm — back trees first in DOM)
	placements.sort((a, b) => b.y - a.y);

	return placements;
}
