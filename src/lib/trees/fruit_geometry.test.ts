import { describe, it, expect } from 'vitest';
import { FRUIT_TYPES, FRUIT_TYPE_OPTIONS, FRUIT_SPECS } from './types.js';
import { GEOMETRY_GROUPS } from './types.js';
import { createPrng } from './prng.js';

// ============================================================================
// Fruit type definitions
// ============================================================================

describe('Fruit type definitions', () => {
	it('FRUIT_TYPES has none, apple, cherry, flower', () => {
		expect(FRUIT_TYPES).toEqual({
			none: 'none',
			apple: 'apple',
			cherry: 'cherry',
			flower: 'flower',
		});
	});

	it('FRUIT_TYPE_OPTIONS provides labeled options for LabeledSelect', () => {
		expect(FRUIT_TYPE_OPTIONS).toEqual([
			{ value: 'none', label: 'None' },
			{ value: 'apple', label: 'Apple' },
			{ value: 'cherry', label: 'Cherry' },
			{ value: 'flower', label: 'Flower' },
		]);
	});

	it('FRUIT_SPECS maps non-none types to color and generateShape', () => {
		expect(FRUIT_SPECS.apple.color).toBe('#e53e3e');
		expect(FRUIT_SPECS.cherry.color).toBe('#9b2c2c');
		expect(FRUIT_SPECS.flower.color).toBe('#ed64a6');
		expect(typeof FRUIT_SPECS.apple.generateShape).toBe('function');
		expect(typeof FRUIT_SPECS.cherry.generateShape).toBe('function');
		expect(typeof FRUIT_SPECS.flower.generateShape).toBe('function');
	});
});

// ============================================================================
// GEOMETRY_GROUPS includes fruit
// ============================================================================

describe('GEOMETRY_GROUPS includes fruit', () => {
	it('has a fruit group', () => {
		expect(GEOMETRY_GROUPS.fruit).toBe('fruit');
	});
});

// ============================================================================
// Fruit geometry generation
// ============================================================================

describe('generateApple', () => {
	it('returns array of triangles (each 3 Point2D), 5-6 total', async () => {
		const { generateApple } = await import('./shapes/fruit_geometry.js');
		const rng = createPrng(42);
		const result = generateApple(50, 50, 4, rng);
		expect(result.length).toBeGreaterThanOrEqual(5);
		expect(result.length).toBeLessThanOrEqual(6);
		for (const tri of result) {
			expect(tri).toHaveLength(3);
			for (const pt of tri) {
				expect(typeof pt.x).toBe('number');
				expect(typeof pt.y).toBe('number');
			}
		}
	});

	it('all points lie within reasonable radius of anchor', async () => {
		const { generateApple } = await import('./shapes/fruit_geometry.js');
		const rng = createPrng(42);
		const cx = 100;
		const cy = 100;
		const size = 4;
		const result = generateApple(cx, cy, size, rng);
		const maxRadius = size * 2;
		for (const tri of result) {
			for (const pt of tri) {
				const dx = pt.x - cx;
				const dy = pt.y - cy;
				expect(Math.sqrt(dx * dx + dy * dy)).toBeLessThan(maxRadius);
			}
		}
	});
});

describe('generateCherry', () => {
	it('returns two groups of 3-4 triangles each', async () => {
		const { generateCherry } = await import('./shapes/fruit_geometry.js');
		const rng = createPrng(42);
		const result = generateCherry(50, 50, 3, rng);
		// Two cherries = 6-8 triangles total, plus stem triangles
		expect(result.length).toBeGreaterThanOrEqual(6);
		expect(result.length).toBeLessThanOrEqual(12);
		for (const tri of result) {
			expect(tri).toHaveLength(3);
		}
	});

	it('all points lie within reasonable radius of anchor', async () => {
		const { generateCherry } = await import('./shapes/fruit_geometry.js');
		const rng = createPrng(42);
		const cx = 100;
		const cy = 100;
		const size = 3;
		const result = generateCherry(cx, cy, size, rng);
		const maxRadius = size * 4;
		for (const tri of result) {
			for (const pt of tri) {
				const dx = pt.x - cx;
				const dy = pt.y - cy;
				expect(Math.sqrt(dx * dx + dy * dy)).toBeLessThan(maxRadius);
			}
		}
	});
});

describe('generateFlower', () => {
	it('returns 4 triangles in diamond arrangement', async () => {
		const { generateFlower } = await import('./shapes/fruit_geometry.js');
		const rng = createPrng(42);
		const result = generateFlower(50, 50, 4, rng);
		expect(result).toHaveLength(4);
		for (const tri of result) {
			expect(tri).toHaveLength(3);
		}
	});

	it('all points lie within reasonable radius of anchor', async () => {
		const { generateFlower } = await import('./shapes/fruit_geometry.js');
		const rng = createPrng(42);
		const cx = 100;
		const cy = 100;
		const size = 4;
		const result = generateFlower(cx, cy, size, rng);
		const maxRadius = size * 2;
		for (const tri of result) {
			for (const pt of tri) {
				const dx = pt.x - cx;
				const dy = pt.y - cy;
				expect(Math.sqrt(dx * dx + dy * dy)).toBeLessThan(maxRadius);
			}
		}
	});
});

describe('generateFruitAtSlots', () => {
	it('with apple produces triangles with red color and fruit group', async () => {
		const { generateFruitAtSlots } = await import('./shapes/fruit_geometry.js');
		const rng = createPrng(42);
		const slots = [
			{ x: 50, y: 50 },
			{ x: 80, y: 80 },
		];
		const result = generateFruitAtSlots('apple', slots, rng);
		expect(result.length).toBeGreaterThan(0);
		for (const tri of result) {
			expect(tri.color).toBe('#e53e3e');
			expect(tri.group).toBe(GEOMETRY_GROUPS.fruit);
			expect(tri.points).toHaveLength(3);
		}
	});

	it('with none returns empty array', async () => {
		const { generateFruitAtSlots } = await import('./shapes/fruit_geometry.js');
		const rng = createPrng(42);
		const slots = [{ x: 50, y: 50 }];
		const result = generateFruitAtSlots('none', slots, rng);
		expect(result).toEqual([]);
	});

	it('with empty slots returns empty array', async () => {
		const { generateFruitAtSlots } = await import('./shapes/fruit_geometry.js');
		const rng = createPrng(42);
		const result = generateFruitAtSlots('apple', [], rng);
		expect(result).toEqual([]);
	});

	it('cherry triangles have cherry color', async () => {
		const { generateFruitAtSlots } = await import('./shapes/fruit_geometry.js');
		const rng = createPrng(42);
		const slots = [{ x: 50, y: 50 }];
		const result = generateFruitAtSlots('cherry', slots, rng);
		expect(result.length).toBeGreaterThan(0);
		for (const tri of result) {
			expect(tri.color).toBe('#9b2c2c');
			expect(tri.group).toBe(GEOMETRY_GROUPS.fruit);
		}
	});

	it('flower triangles have flower color', async () => {
		const { generateFruitAtSlots } = await import('./shapes/fruit_geometry.js');
		const rng = createPrng(42);
		const slots = [{ x: 50, y: 50 }];
		const result = generateFruitAtSlots('flower', slots, rng);
		expect(result.length).toBeGreaterThan(0);
		for (const tri of result) {
			expect(tri.color).toBe('#ed64a6');
			expect(tri.group).toBe(GEOMETRY_GROUPS.fruit);
		}
	});
});
