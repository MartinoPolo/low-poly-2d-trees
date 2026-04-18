import { describe, it, expect } from 'vitest';
import { TREE_SHAPES, BRANCH_MIRRORING, type TreeShape } from '../types.js';
import { computeMaxBranches, clampBranchMaximums } from './branch_maximums.js';

describe('computeMaxBranches', () => {
	it('L1 max scales with trunk height — trunkHeight=100 > trunkHeight=10', () => {
		const tall = computeMaxBranches(TREE_SHAPES.oak, 100);
		const short = computeMaxBranches(TREE_SHAPES.oak, 10);
		expect(tall.maxLevel1).toBeGreaterThan(short.maxLevel1);
	});

	it('L1 max is always >= 1 even with minimum trunk height', () => {
		const result = computeMaxBranches(TREE_SHAPES.oak, 1);
		expect(result.maxLevel1).toBeGreaterThanOrEqual(1);
	});

	it('L2 max is always >= 1', () => {
		const result = computeMaxBranches(TREE_SHAPES.oak, 1);
		expect(result.maxLevel2).toBeGreaterThanOrEqual(1);
	});

	it('L3 max is always >= 1', () => {
		const result = computeMaxBranches(TREE_SHAPES.oak, 1);
		expect(result.maxLevel3).toBeGreaterThanOrEqual(1);
	});

	it('short trunk produces small L1 max (1-3)', () => {
		const result = computeMaxBranches(TREE_SHAPES.oak, 10);
		expect(result.maxLevel1).toBeGreaterThanOrEqual(1);
		expect(result.maxLevel1).toBeLessThanOrEqual(3);
	});

	it('tall trunk produces reasonable L1 max (>= 5)', () => {
		const result = computeMaxBranches(TREE_SHAPES.oak, 100);
		expect(result.maxLevel1).toBeGreaterThanOrEqual(5);
	});

	it('all tree shapes produce valid maximums', () => {
		const shapes = Object.values(TREE_SHAPES) as TreeShape[];
		for (const shape of shapes) {
			const result = computeMaxBranches(shape, 50);
			expect(result.maxLevel1, `${shape} maxLevel1`).toBeGreaterThanOrEqual(1);
			expect(result.maxLevel2, `${shape} maxLevel2`).toBeGreaterThanOrEqual(1);
			expect(result.maxLevel3, `${shape} maxLevel3`).toBeGreaterThanOrEqual(1);
		}
	});
});

describe('clampBranchMaximums', () => {
	it('respects mirroring=preferred L1 min — maxLevel1 >= 2', () => {
		const result = clampBranchMaximums(
			{ maxLevel1: 1, maxLevel2: 1, maxLevel3: 1 },
			BRANCH_MIRRORING.preferred,
			false,
		);
		expect(result.maxLevel1).toBeGreaterThanOrEqual(2);
	});

	it('respects trunkFork L1 min — maxLevel1 >= 2', () => {
		const result = clampBranchMaximums(
			{ maxLevel1: 1, maxLevel2: 1, maxLevel3: 1 },
			BRANCH_MIRRORING.off,
			true,
		);
		expect(result.maxLevel1).toBeGreaterThanOrEqual(2);
	});

	it('respects mirroring=preferred L2 min — maxLevel2 >= 2', () => {
		const result = clampBranchMaximums(
			{ maxLevel1: 3, maxLevel2: 1, maxLevel3: 1 },
			BRANCH_MIRRORING.preferred,
			false,
		);
		expect(result.maxLevel2).toBeGreaterThanOrEqual(2);
	});

	it('does not change values when no constraints apply', () => {
		const input = { maxLevel1: 5, maxLevel2: 3, maxLevel3: 2 };
		const result = clampBranchMaximums(input, BRANCH_MIRRORING.off, false);
		expect(result).toEqual(input);
	});
});
