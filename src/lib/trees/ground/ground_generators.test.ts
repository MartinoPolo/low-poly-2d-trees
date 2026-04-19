import { describe, expect, it } from 'vitest';
import { generateGroundPlacements } from './ground_generators.js';
import { GROUND_ELEMENT_COUNTS } from './ground_types.js';

const TRUNK_BASE = { x: 150, y: 270 };
const SPREAD = 60;

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

	it('returns correct total count of stones + grass', () => {
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
});
