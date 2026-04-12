import { describe, expect, it } from 'vitest';
import { generateSceneLayout } from './scene_layout.js';
import type { SceneConfig } from './scene_config.js';

const BASE_CONFIG: SceneConfig = { treeCount: 10, depthSpread: 50, baseSeed: 42 };

describe('generateSceneLayout', () => {
	it('returns same output for same config (deterministic)', () => {
		const a = generateSceneLayout(BASE_CONFIG);
		const b = generateSceneLayout(BASE_CONFIG);
		expect(a).toEqual(b);
	});

	it.each([3, 10, 50, 100])('returns exactly %i trees when treeCount=%i', (count) => {
		const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: count });
		expect(result).toHaveLength(count);
	});

	it('assigns only non-custom shapes', () => {
		const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 30 });
		for (const tree of result) {
			expect(tree.shape).not.toBe('custom');
		}
	});

	it('produces unique seeds for each tree', () => {
		const result = generateSceneLayout(BASE_CONFIG);
		const seeds = result.map((t) => t.seed);
		expect(new Set(seeds).size).toBe(seeds.length);
	});

	it('keeps x positions within [0, 100]', () => {
		const result = generateSceneLayout({ ...BASE_CONFIG, treeCount: 50 });
		for (const tree of result) {
			expect(tree.x).toBeGreaterThanOrEqual(0);
			expect(tree.x).toBeLessThanOrEqual(100);
		}
	});

	it('sorts output ascending by y (back-to-front for painter algorithm)', () => {
		const result = generateSceneLayout(BASE_CONFIG);
		for (let i = 1; i < result.length; i++) {
			expect(result[i].y).toBeGreaterThanOrEqual(result[i - 1].y);
		}
	});

	describe('depthSpread=0 (flat)', () => {
		const flat = generateSceneLayout({ ...BASE_CONFIG, depthSpread: 0 });

		it('gives all trees the same y', () => {
			const ys = new Set(flat.map((t) => t.y));
			expect(ys.size).toBe(1);
		});

		it('gives all trees scale 1.0', () => {
			for (const tree of flat) {
				expect(tree.scale).toBeCloseTo(1.0, 5);
			}
		});
	});

	describe('depthSpread=100 (full depth)', () => {
		const deep = generateSceneLayout({
			...BASE_CONFIG,
			treeCount: 50,
			depthSpread: 100,
		});

		it('has back trees scaled down toward 0.65', () => {
			const minScale = Math.min(...deep.map((t) => t.scale));
			expect(minScale).toBeGreaterThanOrEqual(0.64);
			expect(minScale).toBeLessThanOrEqual(0.75);
		});

		it('has front trees scaled near 1.0', () => {
			const maxScale = Math.max(...deep.map((t) => t.scale));
			expect(maxScale).toBeGreaterThanOrEqual(0.95);
			expect(maxScale).toBeLessThanOrEqual(1.0);
		});

		it('scales correlate with y — higher y means larger scale', () => {
			// Compare first (back) and last (front) after sort
			const back = deep[0];
			const front = deep[deep.length - 1];
			expect(front.scale).toBeGreaterThan(back.scale);
		});
	});

	it('produces different layouts for different seeds', () => {
		const a = generateSceneLayout({ ...BASE_CONFIG, baseSeed: 1 });
		const b = generateSceneLayout({ ...BASE_CONFIG, baseSeed: 2 });
		const aXs = a.map((t) => t.x);
		const bXs = b.map((t) => t.x);
		expect(aXs).not.toEqual(bXs);
	});
});
