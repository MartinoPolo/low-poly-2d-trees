import { createPrng, randomInRange } from '$lib/trees/prng.js';
import {
	SCENE_SHAPES,
	FRONT_ROW_CAPACITY,
	BACK_SCALE_MIN,
	BACK_SCALE_MAX,
	BACK_DEPTH_FALLBACK,
	type SceneConfig,
	type SceneTreeInput,
	type SceneTreePlacement,
} from './scene_config.js';

/**
 * Generate deterministic scene tree placements from a config.
 *
 * Trees are partitioned into front row (equidistant at y=0, scale=1) and
 * back row (semi-random positions/scale). Priority and blockedBy fields
 * control placement. Output sorted descending by y (back-to-front) for
 * painter's algorithm — back trees first in DOM, front trees last.
 */
export function generateSceneLayout(config: SceneConfig): SceneTreePlacement[] {
	const { treeCount, depthSpread, baseSeed } = config;
	if (treeCount === 0) {
		return [];
	}

	const rng = createPrng(baseSeed);

	// Build input descriptors — use config.trees if provided, else default foreground
	const inputs: SceneTreeInput[] = Array.from(
		{ length: treeCount },
		(_, i) => config.trees?.[i] ?? {},
	);

	// Assign shapes and seeds upfront
	const shapeSeeds = inputs.map((_, i) => {
		const shape = SCENE_SHAPES[Math.floor(rng() * SCENE_SHAPES.length)];
		const seed = baseSeed + i * 1000 + Math.floor(rng() * 999);
		return { shape, seed };
	});

	// Partition into front and back indices
	const frontIndices: number[] = [];
	const backIndices: number[] = [];

	for (let i = 0; i < inputs.length; i++) {
		const input = inputs[i];
		if (input.priority === 0) {
			backIndices.push(i);
		} else if (frontIndices.length < FRONT_ROW_CAPACITY) {
			frontIndices.push(i);
		} else {
			backIndices.push(i);
		}
	}

	const effectiveDepth = Math.max(depthSpread, BACK_DEPTH_FALLBACK);

	const buildPlacement = (
		idx: number,
		x: number,
		y: number,
		scale: number,
	): SceneTreePlacement => ({
		id: inputs[idx].id,
		shape: shapeSeeds[idx].shape,
		seed: shapeSeeds[idx].seed,
		x,
		y,
		scale,
	});

	// Position front row: equidistant, y=0, scale=1.0
	const frontCount = frontIndices.length;
	const placements = new Map<number, SceneTreePlacement>();

	for (let slot = 0; slot < frontCount; slot++) {
		const idx = frontIndices[slot];
		const x = ((slot + 1) * 100) / (frontCount + 1);
		placements.set(idx, buildPlacement(idx, x, 0, 1.0));
	}

	// Position back row: semi-random within depth range
	for (const idx of backIndices) {
		const x = randomInRange(rng, 5, 95);
		const y = randomInRange(rng, effectiveDepth * 0.3, effectiveDepth);
		const scale = randomInRange(rng, BACK_SCALE_MIN, BACK_SCALE_MAX);
		placements.set(idx, buildPlacement(idx, x, y, scale));
	}

	// Enforce blockedBy constraints (blocked tree must have y >= blocker's y)
	enforceBlockedBy(inputs, placements);

	// Collect, sort descending by y (back-to-front for painter's algorithm)
	// Higher y = further back → first in DOM → painted behind front trees
	const result = Array.from(placements.values());
	result.sort((a, b) => b.y - a.y);
	return result;
}

/**
 * Enforce blockedBy: if tree A has blockedBy "X", ensure A.y >= X.y.
 * Uses fixpoint iteration to handle transitive chains (A→B→C).
 * Detects cycles and skips them. Ignores nonexistent IDs.
 */
function enforceBlockedBy(
	inputs: SceneTreeInput[],
	placements: Map<number, SceneTreePlacement>,
): void {
	// Build id-to-index map
	const idToIndex = new Map<string, number>();
	for (let i = 0; i < inputs.length; i++) {
		const id = inputs[i].id;
		if (id !== undefined) {
			idToIndex.set(id, i);
		}
	}

	// Fixpoint: iterate until no changes (handles transitive chains)
	let changed = true;
	while (changed) {
		changed = false;
		for (let i = 0; i < inputs.length; i++) {
			const blockedById = inputs[i].blockedBy;
			if (blockedById === undefined) {
				continue;
			}

			const blockerIndex = idToIndex.get(blockedById);
			if (blockerIndex === undefined) {
				continue;
			}

			if (hasCycle(inputs, idToIndex, i)) {
				continue;
			}

			const blockerPlacement = placements.get(blockerIndex);
			const currentPlacement = placements.get(i);
			if (!blockerPlacement || !currentPlacement) {
				continue;
			}

			if (currentPlacement.y < blockerPlacement.y) {
				placements.set(i, { ...currentPlacement, y: blockerPlacement.y });
				changed = true;
			}
		}
	}
}

/** Check if following the blockedBy chain from startIndex leads back to itself. */
function hasCycle(
	inputs: SceneTreeInput[],
	idToIndex: Map<string, number>,
	startIndex: number,
): boolean {
	const visited = new Set<number>();
	visited.add(startIndex);

	let currentIndex = startIndex;
	while (true) {
		const blockedById = inputs[currentIndex].blockedBy;
		if (blockedById === undefined) {
			return false;
		}

		const nextIndex = idToIndex.get(blockedById);
		if (nextIndex === undefined) {
			return false;
		}

		if (visited.has(nextIndex)) {
			return true;
		}
		visited.add(nextIndex);
		currentIndex = nextIndex;
	}
}
