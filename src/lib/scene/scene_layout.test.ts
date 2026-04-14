import { describe, expect, it } from 'vitest';
import { generateSceneLayout } from './scene_layout.js';
import type { SceneConfig } from './scene_config.js';
import { BACK_SCALE_MIN, BACK_SCALE_MAX, BACK_DEPTH_FALLBACK } from './scene_config.js';

const BASE_CONFIG: SceneConfig = { treeCount: 3, depthSpread: 0, baseSeed: 42 };

describe('generateSceneLayout', () => {
	describe('Group 1: Front row basics (<=10 trees)', () => {
		it('treeCount=0 returns empty array', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 0 });
			expect(result).toEqual([]);
		});

		it('treeCount=3 produces 3 placements at y=0, scale=1.0, x equidistant at 25/50/75', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 3 });
			expect(result).toHaveLength(3);
			for (const tree of result) {
				expect(tree.y).toBe(0);
				expect(tree.scale).toBeCloseTo(1.0, 5);
			}
			const xs = result.map((t) => t.x).sort((a, b) => a - b);
			expect(xs[0]).toBeCloseTo(25, 5);
			expect(xs[1]).toBeCloseTo(50, 5);
			expect(xs[2]).toBeCloseTo(75, 5);
		});

		it('treeCount=1 produces x=50, y=0, scale=1.0', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 1 });
			expect(result).toHaveLength(1);
			expect(result[0].x).toBeCloseTo(50, 5);
			expect(result[0].y).toBe(0);
			expect(result[0].scale).toBeCloseTo(1.0, 5);
		});

		it('treeCount=10 produces all y=0, scale=1.0, equidistant x', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 10 });
			expect(result).toHaveLength(10);
			const xs = result.map((t) => t.x).sort((a, b) => a - b);
			for (let i = 0; i < 10; i++) {
				expect(result[i].y).toBe(0);
				expect(result[i].scale).toBeCloseTo(1.0, 5);
			}
			for (let i = 0; i < 10; i++) {
				const expectedX = ((i + 1) * 100) / 11;
				expect(xs[i]).toBeCloseTo(expectedX, 5);
			}
		});

		it('assigns only non-custom shapes', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 10 });
			for (const tree of result) {
				expect(tree.shape).not.toBe('custom');
			}
		});

		it('produces unique seeds per tree', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 10 });
			const seeds = result.map((t) => t.seed);
			expect(new Set(seeds).size).toBe(seeds.length);
		});
	});

	describe('Group 2: Back row overflow (>10 trees)', () => {
		it('treeCount=11 produces 10 front (y=0, scale=1.0) + 1 back (y>0, scale in [0.65, 0.8])', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 11 });
			expect(result).toHaveLength(11);
			const front = result.filter((t) => t.y === 0);
			const back = result.filter((t) => t.y > 0);
			expect(front).toHaveLength(10);
			expect(back).toHaveLength(1);
			for (const t of front) {
				expect(t.scale).toBeCloseTo(1.0, 5);
			}
			for (const t of back) {
				expect(t.scale).toBeGreaterThanOrEqual(BACK_SCALE_MIN);
				expect(t.scale).toBeLessThanOrEqual(BACK_SCALE_MAX);
			}
		});

		it('treeCount=15 produces 10 front + 5 back', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 15 });
			const front = result.filter((t) => t.y === 0);
			const back = result.filter((t) => t.y > 0);
			expect(front).toHaveLength(10);
			expect(back).toHaveLength(5);
		});

		it('back row x positions within [0, 100]', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 20 });
			const back = result.filter((t) => t.y > 0);
			for (const t of back) {
				expect(t.x).toBeGreaterThanOrEqual(0);
				expect(t.x).toBeLessThanOrEqual(100);
			}
		});

		it('back row y values within effective depth range', () => {
			const depthSpread = 0;
			const effectiveDepth = Math.max(depthSpread, BACK_DEPTH_FALLBACK);
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 15, depthSpread: 0 });
			const back = result.filter((t) => t.y > 0);
			for (const t of back) {
				expect(t.y).toBeGreaterThanOrEqual(effectiveDepth * 0.3);
				expect(t.y).toBeLessThanOrEqual(effectiveDepth);
			}
		});

		it('back row respects depthSpread when larger than fallback', () => {
			const depthSpread = 50;
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 15, depthSpread });
			const back = result.filter((t) => t.y > 0);
			for (const t of back) {
				expect(t.y).toBeGreaterThanOrEqual(depthSpread * 0.3);
				expect(t.y).toBeLessThanOrEqual(depthSpread);
			}
		});
	});

	describe('Group 3: Priority field', () => {
		it('priority=0 forces tree to back row even when front has capacity', () => {
			const config: SceneConfig = {
				...BASE_CONFIG,
				treeCount: 5,
				trees: [
					{ priority: 0 },
					{ priority: 1 },
					{ priority: 1 },
					{ priority: 1 },
					{ priority: 1 },
				],
			};
			const result = generateSceneLayout(config);
			const front = result.filter((t) => t.y === 0);
			const back = result.filter((t) => t.y > 0);
			expect(front).toHaveLength(4);
			expect(back).toHaveLength(1);
		});

		it('priority=1 or undefined defaults to front row', () => {
			const config: SceneConfig = {
				...BASE_CONFIG,
				treeCount: 3,
				trees: [{ priority: 1 }, {}, { priority: 1 }],
			};
			const result = generateSceneLayout(config);
			for (const t of result) {
				expect(t.y).toBe(0);
				expect(t.scale).toBeCloseTo(1.0, 5);
			}
		});

		it('mixed: 8 trees with 3 having priority=0 produces 5 front, 3 back', () => {
			const config: SceneConfig = {
				...BASE_CONFIG,
				treeCount: 8,
				trees: [
					{ priority: 0 },
					{ priority: 1 },
					{ priority: 0 },
					{ priority: 1 },
					{ priority: 1 },
					{ priority: 0 },
					{ priority: 1 },
					{ priority: 1 },
				],
			};
			const result = generateSceneLayout(config);
			const front = result.filter((t) => t.y === 0);
			const back = result.filter((t) => t.y > 0);
			expect(front).toHaveLength(5);
			expect(back).toHaveLength(3);
		});
	});

	describe('Group 4: blockedBy field', () => {
		it('tree with blockedBy has y >= blocker y', () => {
			const config: SceneConfig = {
				...BASE_CONFIG,
				treeCount: 3,
				depthSpread: 50,
				trees: [
					{ id: 'blocker', priority: 0 },
					{ id: 'blocked', priority: 0, blockedBy: 'blocker' },
					{ priority: 1 },
				],
			};
			const result = generateSceneLayout(config);
			const blocker = result.find((t) => t.id === 'blocker');
			const blocked = result.find((t) => t.id === 'blocked');
			expect(blocker).toBeDefined();
			expect(blocked).toBeDefined();
			expect(blocked!.y).toBeGreaterThanOrEqual(blocker!.y);
		});

		it('nonexistent blockedBy ID is ignored, tree positioned normally', () => {
			const config: SceneConfig = {
				...BASE_CONFIG,
				treeCount: 2,
				trees: [{ id: 'a', blockedBy: 'nonexistent' }, { id: 'b' }],
			};
			const result = generateSceneLayout(config);
			expect(result).toHaveLength(2);
			// No crash, both placed
			for (const t of result) {
				expect(t.x).toBeGreaterThanOrEqual(0);
				expect(t.x).toBeLessThanOrEqual(100);
			}
		});

		it('circular blockedBy does not cause infinite loop, both trees still placed', () => {
			const config: SceneConfig = {
				...BASE_CONFIG,
				treeCount: 2,
				depthSpread: 50,
				trees: [
					{ id: 'a', priority: 0, blockedBy: 'b' },
					{ id: 'b', priority: 0, blockedBy: 'a' },
				],
			};
			const result = generateSceneLayout(config);
			expect(result).toHaveLength(2);
			expect(result.find((t) => t.id === 'a')).toBeDefined();
			expect(result.find((t) => t.id === 'b')).toBeDefined();
		});
	});

	describe('Group 5: Determinism & sorting', () => {
		it('same config + seed produces identical output', () => {
			const config: SceneConfig = { ...BASE_CONFIG, treeCount: 15, depthSpread: 50 };
			const a = generateSceneLayout(config);
			const b = generateSceneLayout(config);
			expect(a).toEqual(b);
		});

		it('different seeds produce different layouts', () => {
			const a = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 15,
				depthSpread: 50,
				baseSeed: 1,
			});
			const b = generateSceneLayout({
				...BASE_CONFIG,
				treeCount: 15,
				depthSpread: 50,
				baseSeed: 2,
			});
			const aPositions = a.map((t) => ({ x: t.x, y: t.y }));
			const bPositions = b.map((t) => ({ x: t.x, y: t.y }));
			expect(aPositions).not.toEqual(bPositions);
		});

		it('output sorted descending by y (back-to-front for painter algorithm)', () => {
			const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 20, depthSpread: 50 });
			for (let i = 1; i < result.length; i++) {
				expect(result[i].y).toBeLessThanOrEqual(result[i - 1].y);
			}
		});
	});

	describe('Group 6: Backward compatibility', () => {
		it('config without trees field still works, all front row', () => {
			const config: SceneConfig = { treeCount: 5, depthSpread: 0, baseSeed: 42 };
			const result = generateSceneLayout(config);
			expect(result).toHaveLength(5);
			for (const t of result) {
				expect(t.y).toBe(0);
				expect(t.scale).toBeCloseTo(1.0, 5);
			}
		});
	});

	describe('Group 7: ID passthrough', () => {
		it('when trees have id, corresponding placement has id', () => {
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
