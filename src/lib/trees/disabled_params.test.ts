import { describe, it, expect } from 'vitest';
import { DISABLED_PARAMS_BY_SHAPE, isParamDisabled } from './disabled_params.js';

describe('DISABLED_PARAMS_BY_SHAPE', () => {
	it('exposes the pine disabled list with branchCount and trunkBranchRatio', () => {
		expect(DISABLED_PARAMS_BY_SHAPE.pine).toEqual(['branchCount', 'trunkBranchRatio']);
	});

	it('exposes the fir disabled list (same as pine per REQ-S-12)', () => {
		expect(DISABLED_PARAMS_BY_SHAPE.fir).toEqual(['branchCount', 'trunkBranchRatio']);
	});

	it('exposes empty disabled lists for oak, birch, maple, willow, custom', () => {
		expect(DISABLED_PARAMS_BY_SHAPE.oak).toEqual([]);
		expect(DISABLED_PARAMS_BY_SHAPE.birch).toEqual([]);
		expect(DISABLED_PARAMS_BY_SHAPE.maple).toEqual([]);
		expect(DISABLED_PARAMS_BY_SHAPE.willow).toEqual([]);
		expect(DISABLED_PARAMS_BY_SHAPE.custom).toEqual([]);
	});
});

describe('isParamDisabled', () => {
	describe('per-shape static rules', () => {
		it('disables branchCount for pine', () => {
			expect(isParamDisabled('pine', 'branchCount', {})).toBe(true);
		});

		it('disables trunkBranchRatio for pine', () => {
			expect(isParamDisabled('pine', 'trunkBranchRatio', {})).toBe(true);
		});

		it('does not disable branchCount for oak', () => {
			expect(isParamDisabled('oak', 'branchCount', {})).toBe(false);
		});

		it('does not disable trunkBranchRatio for oak', () => {
			expect(isParamDisabled('oak', 'trunkBranchRatio', {})).toBe(false);
		});

		it('does not disable branchCount for birch', () => {
			expect(isParamDisabled('birch', 'branchCount', {})).toBe(false);
		});
	});

	describe('cross-param rules', () => {
		it('disables trunkCrookedness when trunkSegments === 1', () => {
			expect(isParamDisabled('oak', 'trunkCrookedness', { trunkSegments: 1 })).toBe(true);
		});

		it('does not disable trunkCrookedness when trunkSegments === 3', () => {
			expect(isParamDisabled('oak', 'trunkCrookedness', { trunkSegments: 3 })).toBe(false);
		});

		it('does not disable trunkCrookedness when trunkSegments is undefined', () => {
			expect(isParamDisabled('oak', 'trunkCrookedness', {})).toBe(false);
		});
	});

	describe('fruitCount disabled when fruitType is none', () => {
		it('disables fruitCount when fruitType is none', () => {
			expect(isParamDisabled('oak', 'fruitCount', { fruitType: 'none' })).toBe(true);
		});

		it('does not disable fruitCount when fruitType is apple', () => {
			expect(isParamDisabled('oak', 'fruitCount', { fruitType: 'apple' })).toBe(false);
		});

		it('does not disable fruitCount when fruitType is cherry', () => {
			expect(isParamDisabled('oak', 'fruitCount', { fruitType: 'cherry' })).toBe(false);
		});
	});
});
