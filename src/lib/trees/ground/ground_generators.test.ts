import { describe, expect, it } from 'vitest';
import { generateGroundPlacements } from './ground_generators.js';
import { GROUND_ELEMENT_COUNTS, GROUND_MIN_SPACING_RATIO } from './ground_types.js';

const TRUNK_BASE = { x: 250, y: 475 };
const SPREAD = 100;

describe('generateGroundPlacements', () => {
	it('is deterministic — same seed produces same output', () => {
		const a = generateGroundPlacements(42, TRUNK_BASE, SPREAD);
		const b = generateGroundPlacements(42, TRUNK_BASE, SPREAD);
		expect(a).toEqual(b);
	});

	it('different seeds produce different output', () => {
		const a = generateGroundPlacements(42, TRUNK_BASE, SPREAD);
		const b = generateGroundPlacements(99, TRUNK_BASE, SPREAD);
		expect(a).not.toEqual(b);
	});

	it('returns correct default count of stones + grass', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD);
		const expectedCount = GROUND_ELEMENT_COUNTS.stones + GROUND_ELEMENT_COUNTS.grass;
		expect(placements).toHaveLength(expectedCount);
	});

	it('stones come before grass in output', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD);
		const stoneCount = placements.filter((p) => p.type === 'stone').length;
		const grassCount = placements.filter((p) => p.type === 'grass').length;
		expect(stoneCount).toBe(GROUND_ELEMENT_COUNTS.stones);
		expect(grassCount).toBe(GROUND_ELEMENT_COUNTS.grass);
	});

	it('placements stay near trunkBase', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD);
		const halfSpread = SPREAD / 2;
		for (const p of placements) {
			expect(p.x).toBeGreaterThanOrEqual(TRUNK_BASE.x - halfSpread - 1);
			expect(p.x).toBeLessThanOrEqual(TRUNK_BASE.x + halfSpread + 1);
			expect(p.y).toBeGreaterThanOrEqual(TRUNK_BASE.y - 5);
			expect(p.y).toBeLessThanOrEqual(TRUNK_BASE.y + 10);
		}
	});

	it('stones avoid direct trunk center', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD);
		const stones = placements.filter((p) => p.type === 'stone');
		for (const stone of stones) {
			expect(Math.abs(stone.x - TRUNK_BASE.x)).toBeGreaterThanOrEqual(5);
		}
	});

	it('all placements have valid scale and rotation', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD);
		for (const p of placements) {
			expect(p.scale).toBeGreaterThan(0);
			expect(p.scale).toBeLessThan(4);
			expect(p.rotation).toBeGreaterThanOrEqual(-20);
			expect(p.rotation).toBeLessThanOrEqual(20);
		}
	});

	it('stone scales are in range [1.5, 3.0]', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD);
		const stones = placements.filter((p) => p.type === 'stone');
		for (const stone of stones) {
			expect(stone.scale).toBeGreaterThanOrEqual(1.5);
			expect(stone.scale).toBeLessThanOrEqual(3.0);
		}
	});

	it('grass scales are in range [1.75, 3.25]', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD);
		const grasses = placements.filter((p) => p.type === 'grass');
		for (const grass of grasses) {
			expect(grass.scale).toBeGreaterThanOrEqual(1.75);
			expect(grass.scale).toBeLessThanOrEqual(3.25);
		}
	});

	it('no two same-type elements overlap more than 50% of estimated width', () => {
		for (const seed of [42, 99, 1234, 7777]) {
			const placements = generateGroundPlacements(seed, TRUNK_BASE, SPREAD);
			const stones = placements.filter((p) => p.type === 'stone');
			const grasses = placements.filter((p) => p.type === 'grass');

			for (const group of [stones, grasses]) {
				for (let i = 0; i < group.length; i++) {
					for (let j = i + 1; j < group.length; j++) {
						const largerScale = Math.max(group[i]!.scale, group[j]!.scale);
						const minSpacing = largerScale * 10 * GROUND_MIN_SPACING_RATIO;
						const distance = Math.abs(group[i]!.x - group[j]!.x);
						expect(
							distance,
							`Seed ${seed}: ${group[i]!.type}s at indices ${i},${j} too close (${distance.toFixed(1)} < ${minSpacing.toFixed(1)})`,
						).toBeGreaterThanOrEqual(minSpacing);
					}
				}
			}
		}
	});

	it('with custom count produces that many elements with correct stone/grass ratio', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD, 15);
		expect(placements).toHaveLength(15);
		const stones = placements.filter((p) => p.type === 'stone').length;
		const grass = placements.filter((p) => p.type === 'grass').length;
		expect(stones + grass).toBe(15);
		const stoneRatio =
			GROUND_ELEMENT_COUNTS.stones /
			(GROUND_ELEMENT_COUNTS.stones + GROUND_ELEMENT_COUNTS.grass);
		expect(stones).toBe(Math.round(15 * stoneRatio));
		expect(grass).toBe(15 - Math.round(15 * stoneRatio));
	});

	it('with sizeMultiplier=2 produces elements with doubled scale ranges', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD, undefined, 2);
		const stones = placements.filter((p) => p.type === 'stone');
		for (const stone of stones) {
			expect(stone.scale).toBeGreaterThanOrEqual(3.0);
			expect(stone.scale).toBeLessThanOrEqual(6.0);
		}
		const grasses = placements.filter((p) => p.type === 'grass');
		for (const grass of grasses) {
			expect(grass.scale).toBeGreaterThanOrEqual(3.5);
			expect(grass.scale).toBeLessThanOrEqual(6.5);
		}
	});

	it('with count=1 produces exactly 1 element', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD, 1);
		expect(placements).toHaveLength(1);
	});

	it('with count=20 produces 20 elements', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD, 20);
		expect(placements).toHaveLength(20);
	});

	it('backward-compatible: calling with just (seed, trunkBase, spreadWidth) still works', () => {
		const placements = generateGroundPlacements(42, TRUNK_BASE, SPREAD);
		expect(placements).toHaveLength(GROUND_ELEMENT_COUNTS.stones + GROUND_ELEMENT_COUNTS.grass);
		const stones = placements.filter((p) => p.type === 'stone');
		const grass = placements.filter((p) => p.type === 'grass');
		expect(stones.length).toBe(GROUND_ELEMENT_COUNTS.stones);
		expect(grass.length).toBe(GROUND_ELEMENT_COUNTS.grass);
	});
});
