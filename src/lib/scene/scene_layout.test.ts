import { describe, expect, it } from 'vitest';
import {
	generateSceneLayout,
	computeRowShifts,
	computeGroundHeightPercent,
} from './scene_layout.js';
import {
	SCENE_SHAPES,
	SCENE_SHAPE_RANDOM,
	LAYER_COUNT,
	SCALE_FRONT,
	SCALE_BACK,
	type SceneConfig,
} from './scene_config.js';

const BASE_CONFIG: SceneConfig = { treeCount: 3, depthSpread: 0, baseSeed: 42 };

describe('generateSceneLayout', () => {
	describe('Group 1: Layer 1 basics (<=10 trees)', () => {
		it('treeCount=0 returns empty array', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 0 });
			expect(result).toEqual([]);
		});

		it('treeCount=1: x=50, y=0, scale=1.0, layer=1', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 1 });
			expect(result).toHaveLength(1);
			expect(result[0].x).toBeCloseTo(50, 5);
			expect(result[0].y).toBe(0);
			expect(result[0].scale).toBeCloseTo(1.0, 5);
			expect(result[0].layer).toBe(1);
		});

		it('treeCount=3 (layer 1 only): equidistant x at 25/50/75, y=0, scale=1.0, layer=1', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 3 });
			expect(result).toHaveLength(3);
			for (const tree of result) {
				expect(tree.y).toBe(0);
				expect(tree.scale).toBeCloseTo(1.0, 5);
				expect(tree.layer).toBe(1);
			}
			const xs = result.map((t) => t.x).sort((a, b) => a - b);
			expect(xs[0]).toBeCloseTo(25, 5);
			expect(xs[1]).toBeCloseTo(50, 5);
			expect(xs[2]).toBeCloseTo(75, 5);
		});

		it('treeCount=10 (full layer 1): equidistant x, y=0, scale=1.0, layer=1', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 10 });
			expect(result).toHaveLength(10);
			for (const tree of result) {
				expect(tree.y).toBe(0);
				expect(tree.scale).toBeCloseTo(1.0, 5);
				expect(tree.layer).toBe(1);
			}
			const xs = result.map((t) => t.x).sort((a, b) => a - b);
			for (let i = 0; i < 10; i++) {
				const expectedX = ((i + 1) * 100) / 11;
				expect(xs[i]).toBeCloseTo(expectedX, 5);
			}
		});

		it('assigns only non-custom shapes from SCENE_SHAPES', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 10 });
			for (const tree of result) {
				expect(tree.shape).not.toBe('custom');
				expect(SCENE_SHAPES).toContain(tree.shape);
			}
		});

		it('unique seeds per tree', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 10 });
			const seeds = result.map((t) => t.seed);
			expect(new Set(seeds).size).toBe(seeds.length);
		});
	});

	describe('Group 2: Multi-layer fill (>10 trees)', () => {
		it('treeCount=11 with depthSpread=50: 10 in layer 1, 1 in layer 2', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 11,
				depthSpread: 50,
			});
			expect(result).toHaveLength(11);
			const layer1 = result.filter((t) => t.layer === 1);
			const layer2 = result.filter((t) => t.layer === 2);
			expect(layer1).toHaveLength(10);
			expect(layer2).toHaveLength(1);
			for (const t of layer1) {
				expect(t.y).toBe(0);
				expect(t.scale).toBeCloseTo(SCALE_FRONT, 5);
			}
			for (const t of layer2) {
				expect(t.y).toBeCloseTo(25, 5);
				// scale = 1.0 - (2-1) * 0.35/9 = 1.0 - 0.0389 ≈ 0.961
				expect(t.scale).toBeCloseTo(
					SCALE_FRONT - (SCALE_FRONT - SCALE_BACK) / (LAYER_COUNT - 1),
					3,
				);
			}
		});

		it('treeCount=20: layers 1-2 each have 10 trees', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 20,
				depthSpread: 50,
			});
			expect(result).toHaveLength(20);
			const layer1 = result.filter((t) => t.layer === 1);
			const layer2 = result.filter((t) => t.layer === 2);
			expect(layer1).toHaveLength(10);
			expect(layer2).toHaveLength(10);
		});

		it('100 trees = 10 full layers, all positioned correctly', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 100,
				depthSpread: 100,
			});
			expect(result).toHaveLength(100);
			for (let layerNumber = 1; layerNumber <= 10; layerNumber++) {
				const layerTrees = result.filter((t) => t.layer === layerNumber);
				expect(layerTrees).toHaveLength(10);
			}
		});

		it('each placement has correct layer number', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 25,
				depthSpread: 50,
			});
			// Trees 1-10 → layer 1, 11-20 → layer 2, 21-25 → layer 3
			const layer1 = result.filter((t) => t.layer === 1);
			const layer2 = result.filter((t) => t.layer === 2);
			const layer3 = result.filter((t) => t.layer === 3);
			expect(layer1).toHaveLength(10);
			expect(layer2).toHaveLength(10);
			expect(layer3).toHaveLength(5);
		});
	});

	describe('Group 3: Seeded row stagger', () => {
		it('front row (layer 1) has 0% shift', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 20,
				depthSpread: 50,
			});
			const layer1 = result.filter((t) => t.layer === 1);
			const interTree = 100 / 11;

			const layer1xs = layer1.map((t) => t.x).sort((a, b) => a - b);
			for (let i = 0; i < 10; i++) {
				expect(layer1xs[i]).toBeCloseTo((i + 1) * interTree, 5);
			}
		});

		it('rows 2+ have non-zero shift within 15-45% of inter-tree distance', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 30,
				depthSpread: 50,
			});
			const interTree = 100 / 11;

			for (let layerNumber = 2; layerNumber <= 3; layerNumber++) {
				const layerTrees = result.filter((t) => t.layer === layerNumber);
				const layerXs = layerTrees.map((t) => t.x).sort((a, b) => a - b);
				const baseX = 1 * interTree;
				const shift = layerXs[0]! - baseX;
				expect(shift).toBeGreaterThanOrEqual(interTree * 0.15 - 0.01);
				expect(shift).toBeLessThanOrEqual(interTree * 0.45 + 0.01);
			}
		});

		it('deterministic: same seed produces same stagger', () => {
			const config = { ...BASE_CONFIG, treeCount: 30, depthSpread: 50 };
			const a = generateSceneLayout(config);
			const b = generateSceneLayout(config);
			expect(a).toEqual(b);
		});
	});

	describe('Group 4: Depth spread formula', () => {
		it('depthSpread=0: ALL layers at y=0 regardless of layer number', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 30,
				depthSpread: 0,
			});
			for (const tree of result) {
				expect(tree.y).toBe(0);
			}
		});

		it('depthSpread=50 formula: layer 2 y=25, layer 3 y=50, layer 10 y=225', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 100,
				depthSpread: 50,
			});

			const layer2 = result.filter((t) => t.layer === 2);
			const layer3 = result.filter((t) => t.layer === 3);
			const layer10 = result.filter((t) => t.layer === 10);

			// y = depthSpread * (layerNumber-1) / 2
			// layer 2: 50 * 1 / 2 = 25
			expect(layer2[0].y).toBeCloseTo(25, 5);
			// layer 3: 50 * 2 / 2 = 50
			expect(layer3[0].y).toBeCloseTo(50, 5);
			// layer 10: 50 * 9 / 2 = 225
			expect(layer10[0].y).toBeCloseTo(225, 5);
		});
	});

	describe('Group 5: Scale interpolation', () => {
		it('scale decreases with layer: layer 1 = 1.0, layer 10 = 0.65, linear interpolation', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 100,
				depthSpread: 50,
			});

			for (let layerNumber = 1; layerNumber <= 10; layerNumber++) {
				const layerTrees = result.filter((t) => t.layer === layerNumber);
				const expectedScale =
					SCALE_FRONT - ((layerNumber - 1) * (SCALE_FRONT - SCALE_BACK)) / 9;
				for (const tree of layerTrees) {
					expect(tree.scale).toBeCloseTo(expectedScale, 5);
				}
			}
		});
	});

	describe('Group 6: Determinism & sorting', () => {
		it('deterministic: same config+seed produces identical output', () => {
			const config: SceneConfig = { ...BASE_CONFIG, treeCount: 50, depthSpread: 50 };
			const a = generateSceneLayout(config);
			const b = generateSceneLayout(config);
			expect(a).toEqual(b);
		});

		it('different seeds produce different shape assignments', () => {
			const a = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 20,
				depthSpread: 50,
				baseSeed: 1,
			});
			const b = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 20,
				depthSpread: 50,
				baseSeed: 2,
			});
			const aShapes = a.map((t) => t.shape);
			const bShapes = b.map((t) => t.shape);
			expect(aShapes).not.toEqual(bShapes);
		});

		it('output sorted descending by y (painter algorithm — back trees first)', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 50,
				depthSpread: 50,
			});
			for (let i = 1; i < result.length; i++) {
				expect(result[i].y).toBeLessThanOrEqual(result[i - 1].y);
			}
		});
	});

	describe('Group 7: Fixed scene shape', () => {
		it('sceneShape=oak: all trees get oak shape', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 10,
				sceneShape: 'oak',
			});
			for (const tree of result) {
				expect(tree.shape).toBe('oak');
			}
		});

		it('sceneShape=random: trees get varied shapes from SCENE_SHAPES', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 20,
				sceneShape: SCENE_SHAPE_RANDOM,
			});
			const shapes = new Set(result.map((t) => t.shape));
			expect(shapes.size).toBeGreaterThan(1);
			for (const tree of result) {
				expect(SCENE_SHAPES).toContain(tree.shape);
			}
		});

		it('sceneShape=undefined defaults to random shapes', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 20,
			});
			const shapes = new Set(result.map((t) => t.shape));
			expect(shapes.size).toBeGreaterThan(1);
		});

		it('fixed shape preserves unique seeds per tree', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 10,
				sceneShape: 'pine',
			});
			const seeds = result.map((t) => t.seed);
			expect(new Set(seeds).size).toBe(seeds.length);
		});

		it('fixed shape is deterministic with same seed', () => {
			const config = { ...BASE_CONFIG, treeCount: 10, sceneShape: 'birch' as const };
			const a = generateSceneLayout(config);
			const b = generateSceneLayout(config);
			expect(a).toEqual(b);
		});
	});

	describe('Group 8: Backward compatibility (config without trees, ID passthrough)', () => {
		it('config without trees field works', () => {
			const config: SceneConfig = { treeCount: 5, depthSpread: 0, baseSeed: 42 };
			const result = generateSceneLayout(config);
			expect(result).toHaveLength(5);
			for (const t of result) {
				expect(t.y).toBe(0);
				expect(t.scale).toBeCloseTo(1.0, 5);
				expect(t.layer).toBe(1);
			}
		});

		it('ID passthrough when trees array has ids', () => {
			const config: SceneConfig = {
				...BASE_CONFIG,
				treeCount: 3,
				trees: [{ id: 'tree-a' }, { id: 'tree-b' }, { id: 'tree-c' }],
			};
			const result = generateSceneLayout(config);
			const ids = result.map((t) => t.id).sort((a, b) => (a ?? '').localeCompare(b ?? ''));
			expect(ids).toEqual(['tree-a', 'tree-b', 'tree-c']);
		});
	});
});

describe('computeRowShifts', () => {
	it('front row (index 0) is always 0', () => {
		const shifts = computeRowShifts(5, 42);
		expect(shifts[0]).toBe(0);
	});

	it('rows 1+ are within [15, 45]', () => {
		const shifts = computeRowShifts(10, 42);
		for (let i = 1; i < shifts.length; i++) {
			expect(shifts[i]).toBeGreaterThanOrEqual(15);
			expect(shifts[i]).toBeLessThanOrEqual(45);
		}
	});

	it('no two rows within ±3 share position within 10%', () => {
		const shifts = computeRowShifts(10, 42);
		for (let i = 0; i < shifts.length; i++) {
			for (let j = i + 1; j < shifts.length; j++) {
				if (Math.abs(i - j) <= 3) {
					expect(Math.abs(shifts[i]! - shifts[j]!)).toBeGreaterThanOrEqual(10 - 0.01);
				}
			}
		}
	});

	it('deterministic: same seed produces same output', () => {
		const a = computeRowShifts(10, 42);
		const b = computeRowShifts(10, 42);
		expect(a).toEqual(b);
	});

	it('different seeds produce different shifts', () => {
		const a = computeRowShifts(5, 42);
		const b = computeRowShifts(5, 999);
		expect(a).not.toEqual(b);
	});

	it('single layer returns [0]', () => {
		const shifts = computeRowShifts(1, 42);
		expect(shifts).toEqual([0]);
	});
});

describe('computeGroundHeightPercent', () => {
	it('depthSpread=0, any treeCount: returns 12 (baseline)', () => {
		expect(computeGroundHeightPercent(0, 10)).toBe(12);
		expect(computeGroundHeightPercent(0, 50)).toBe(12);
		expect(computeGroundHeightPercent(0, 100)).toBe(12);
	});

	it('single layer (treeCount<=10): returns 12 regardless of depthSpread', () => {
		expect(computeGroundHeightPercent(50, 1)).toBe(12);
		expect(computeGroundHeightPercent(100, 10)).toBe(12);
	});

	it('depthSpread=10, treeCount=20 (2 layers): 12 + (10*1)/2 = 17', () => {
		expect(computeGroundHeightPercent(10, 20)).toBe(17);
	});

	it('depthSpread=50, treeCount=30 (3 layers): 12 + (50*2)/2 = 62', () => {
		expect(computeGroundHeightPercent(50, 30)).toBe(62);
	});

	it('never returns less than 12', () => {
		expect(computeGroundHeightPercent(-10, 20)).toBe(12);
	});
});
