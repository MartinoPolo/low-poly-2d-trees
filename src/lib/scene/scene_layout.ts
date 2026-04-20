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

const ROW_SHIFT_SEED_OFFSET = 77777;
const ROW_SHIFT_MIN = 15;
const ROW_SHIFT_MAX = 45;

/**
 * Compute seeded random horizontal shift percentages per row.
 * Row 0 (front) is always 0%. Rows 1+ get 15-45% with the constraint
 * that no two rows within ±3 indices share position within 10%.
 *
 * Uses a seeded permutation of 4 well-spaced base values {15,25,35,45}
 * cycled across rows. The seed controls which permutation is chosen,
 * giving different arrangements per scene.
 */
export function computeRowShifts(layerCount: number, baseSeed: number): number[] {
	if (layerCount <= 0) {
		return [];
	}
	const rng = createPrng(baseSeed + ROW_SHIFT_SEED_OFFSET);
	const shifts: number[] = [0];

	const bases = [ROW_SHIFT_MIN, 25, 35, ROW_SHIFT_MAX];
	const permuted = [...bases];
	for (let k = permuted.length - 1; k > 0; k--) {
		const j = Math.floor(rng() * (k + 1));
		[permuted[k], permuted[j]] = [permuted[j]!, permuted[k]!];
	}

	for (let i = 1; i < layerCount; i++) {
		shifts.push(permuted[(i - 1) % permuted.length]!);
	}

	return shifts;
}

/**
 * Generate deterministic scene tree placements using a 10-layer sequential system.
 *
 * Trees fill layers sequentially: trees 1-10 → layer 1, 11-20 → layer 2, etc.
 * Rows 2+ are staggered by a seeded random 15-45% shift of the inter-tree distance.
 * Output sorted descending by y (painter's algorithm).
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

	const totalLayers = Math.ceil(treeCount / TREES_PER_LAYER);
	const rowShifts = computeRowShifts(totalLayers, baseSeed);

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

		const shiftPercent = rowShifts[layerNumber - 1] ?? 0;
		const horizontalOffset = (shiftPercent / 100) * interTreeDistance;
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
