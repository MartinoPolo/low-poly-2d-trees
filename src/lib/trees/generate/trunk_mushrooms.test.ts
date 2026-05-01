import { describe, it, expect } from 'vitest';
import { generateTrunkMushrooms } from './trunk_mushrooms.js';
import { interpolateTrunkAtY } from './trunk_interpolation.js';
import { createPrng } from '../prng.js';
import type { Point2D } from '../types.js';

/** 4-junction straight trunk centered at x=250, from y=400 (bottom) to y=100 (top). */
function makeTrunkJunctions(): Point2D[] {
	return [
		{ x: 250, y: 400 },
		{ x: 250, y: 300 },
		{ x: 250, y: 200 },
		{ x: 250, y: 100 },
	];
}

function makeTrunkWidths(): number[] {
	return [20, 18, 14, 10];
}

describe('generateTrunkMushrooms', () => {
	it('returns empty array when junctions.length < 2', () => {
		const result = generateTrunkMushrooms([{ x: 250, y: 300 }], [20], createPrng(42));
		expect(result).toEqual([]);
	});

	it('returns 2-4 mushrooms for valid trunk', () => {
		// Test with multiple seeds to verify range
		for (let seed = 0; seed < 20; seed++) {
			const result = generateTrunkMushrooms(
				makeTrunkJunctions(),
				makeTrunkWidths(),
				createPrng(seed),
			);
			expect(result.length).toBeGreaterThanOrEqual(2);
			expect(result.length).toBeLessThanOrEqual(4);
		}
	});

	it('each mushroom has y within trunk Y range', () => {
		const junctions = makeTrunkJunctions();
		const topY = junctions[junctions.length - 1]!.y; // 100
		const bottomY = junctions[0]!.y; // 400
		const result = generateTrunkMushrooms(junctions, makeTrunkWidths(), createPrng(42));
		for (const mushroom of result) {
			expect(mushroom.y).toBeGreaterThanOrEqual(topY);
			expect(mushroom.y).toBeLessThanOrEqual(bottomY);
		}
	});

	it('each mushroom has valid side', () => {
		const result = generateTrunkMushrooms(
			makeTrunkJunctions(),
			makeTrunkWidths(),
			createPrng(42),
		);
		for (const mushroom of result) {
			expect(['left', 'right']).toContain(mushroom.side);
		}
	});

	it('each mushroom has variant 0, 1, or 2', () => {
		const result = generateTrunkMushrooms(
			makeTrunkJunctions(),
			makeTrunkWidths(),
			createPrng(42),
		);
		for (const mushroom of result) {
			expect([0, 1, 2]).toContain(mushroom.variant);
		}
	});

	it('each mushroom has scale between 0.6 and 1.2', () => {
		const result = generateTrunkMushrooms(
			makeTrunkJunctions(),
			makeTrunkWidths(),
			createPrng(42),
		);
		for (const mushroom of result) {
			expect(mushroom.scale).toBeGreaterThanOrEqual(0.6);
			expect(mushroom.scale).toBeLessThanOrEqual(1.2);
		}
	});

	it('mushroom centerX is at trunk edge, not center', () => {
		const junctions = makeTrunkJunctions();
		const widths = makeTrunkWidths();
		const result = generateTrunkMushrooms(junctions, widths, createPrng(42));
		for (const mushroom of result) {
			const { centerX: trunkCenter, width: trunkWidth } = interpolateTrunkAtY(
				mushroom.y,
				junctions,
				widths,
			);
			const expectedLeftEdge = trunkCenter - trunkWidth / 2;
			const expectedRightEdge = trunkCenter + trunkWidth / 2;
			if (mushroom.side === 'left') {
				expect(mushroom.centerX).toBeCloseTo(expectedLeftEdge, 1);
			} else {
				expect(mushroom.centerX).toBeCloseTo(expectedRightEdge, 1);
			}
		}
	});
});
