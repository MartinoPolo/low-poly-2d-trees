import { describe, expect, it } from 'vitest';
import { generateSceneLayout } from './scene_layout.js';
import {
	SCENE_SHAPES,
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

	describe('Group 3: Horizontal stagger (even vs odd layers)', () => {
		it('even layer horizontal stagger: layer 2 x positions offset by half inter-tree distance', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 20,
				depthSpread: 50,
			});
			const layer1 = result.filter((t) => t.layer === 1);
			const layer2 = result.filter((t) => t.layer === 2);

			// Layer 1: 10 trees, inter-tree = 100/11
			// Layer 2: 10 trees, inter-tree = 100/11, offset = 100/11/2
			const interTree = 100 / 11;
			const offset = interTree / 2;

			const layer1xs = layer1.map((t) => t.x).sort((a, b) => a - b);
			const layer2xs = layer2.map((t) => t.x).sort((a, b) => a - b);

			// Layer 1 positions: interTree*1, interTree*2, ...
			for (let i = 0; i < 10; i++) {
				expect(layer1xs[i]).toBeCloseTo((i + 1) * interTree, 5);
			}
			// Layer 2 positions: offset + interTree*1, offset + interTree*2, ...
			for (let i = 0; i < 10; i++) {
				expect(layer2xs[i]).toBeCloseTo(offset + (i + 1) * interTree, 5);
			}
		});

		it('odd layer alignment: layer 3 x positions match layer 1 alignment (no stagger)', () => {
			const result = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 30,
				depthSpread: 50,
			});
			const layer1 = result.filter((t) => t.layer === 1);
			const layer3 = result.filter((t) => t.layer === 3);

			const layer1xs = layer1.map((t) => t.x).sort((a, b) => a - b);
			const layer3xs = layer3.map((t) => t.x).sort((a, b) => a - b);

			// Both have 10 trees, same formula, no offset
			expect(layer1xs).toHaveLength(10);
			expect(layer3xs).toHaveLength(10);
			for (let i = 0; i < 10; i++) {
				expect(layer3xs[i]).toBeCloseTo(layer1xs[i], 5);
			}
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

	describe('Group 7: Backward compatibility (config without trees, ID passthrough)', () => {
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
