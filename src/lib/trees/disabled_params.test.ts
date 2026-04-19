import { describe, it, expect } from 'vitest';
import { DISABLED_PARAMS_BY_SHAPE, isParamDisabled } from './disabled_params.js';

describe('DISABLED_PARAMS_BY_SHAPE', () => {
	it('pine disables 7 branch-related params including branchWidthVariance (REQ-EV2-D-02)', () => {
		expect(DISABLED_PARAMS_BY_SHAPE.pine).toEqual([
			'branchesLevel1Range',
			'branchesLevel2Range',
			'branchesLevel3Range',
			'branchAngle',
			'branchSegments',
			'branchCrookedness',
			'branchWidthVariance',
		]);
	});

	it('fir disables same params as pine (REQ-S-12)', () => {
		expect(DISABLED_PARAMS_BY_SHAPE.fir).toEqual(DISABLED_PARAMS_BY_SHAPE.pine);
	});

	it('branching shapes disable blobCloseness (REQ-S-12)', () => {
		for (const shape of [
			'oak',
			'birch',
			'maple',
			'willow',
			'apple',
			'cherry',
			'baobab',
			'acacia',
		] as const) {
			expect(DISABLED_PARAMS_BY_SHAPE[shape]).toContain('blobCloseness');
		}
	});

	it('custom has empty disabled list', () => {
		expect(DISABLED_PARAMS_BY_SHAPE.custom).toEqual([]);
	});

	it('cypress disables same branch params as pine', () => {
		expect(DISABLED_PARAMS_BY_SHAPE.cypress).toEqual(DISABLED_PARAMS_BY_SHAPE.pine);
	});

	it('bush disables all branch + trunk params including trunkStripCount (REQ-EV2-D-01)', () => {
		expect(DISABLED_PARAMS_BY_SHAPE.bush).toContain('branchesLevel1Range');
		expect(DISABLED_PARAMS_BY_SHAPE.bush).toContain('trunkThickness');
		expect(DISABLED_PARAMS_BY_SHAPE.bush).toContain('trunkHeight');
		expect(DISABLED_PARAMS_BY_SHAPE.bush).toContain('trunkLean');
		expect(DISABLED_PARAMS_BY_SHAPE.bush).toContain('trunkStripCount');
		expect(DISABLED_PARAMS_BY_SHAPE.bush).toContain('branchWidthVariance');
	});
});

describe('isParamDisabled', () => {
	describe('per-shape static rules', () => {
		it('disables branchesLevel1Range for pine', () => {
			expect(isParamDisabled('pine', 'branchesLevel1Range', {})).toBe(true);
		});

		it('disables branchAngle for pine', () => {
			expect(isParamDisabled('pine', 'branchAngle', {})).toBe(true);
		});

		it('disables branchSegments for fir', () => {
			expect(isParamDisabled('fir', 'branchSegments', {})).toBe(true);
		});

		it('does not disable branchesLevel1Range for oak (when branchDepth >= 1)', () => {
			expect(isParamDisabled('oak', 'branchesLevel1Range', { branchDepth: 2 })).toBe(false);
		});

		it('does not disable branchAngle for birch', () => {
			expect(isParamDisabled('birch', 'branchAngle', {})).toBe(false);
		});
	});

	describe('cross-param rules — trunkCrookedness', () => {
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

	describe('cross-param rules — branchCrookedness', () => {
		it('disables branchCrookedness when branchSegments === 1', () => {
			expect(isParamDisabled('oak', 'branchCrookedness', { branchSegments: 1 })).toBe(true);
		});

		it('disables branchCrookedness when branchSegments is undefined (defaults to 1)', () => {
			expect(isParamDisabled('oak', 'branchCrookedness', {})).toBe(true);
		});

		it('does not disable branchCrookedness when branchSegments === 2', () => {
			expect(isParamDisabled('oak', 'branchCrookedness', { branchSegments: 2 })).toBe(false);
		});
	});

	describe('per-level visibility — branchDepth-based', () => {
		it('disables branchesLevel1Range when branchDepth < 1', () => {
			expect(isParamDisabled('oak', 'branchesLevel1Range', { branchDepth: 0 })).toBe(true);
		});

		it('does not disable branchesLevel1Range when branchDepth >= 1', () => {
			expect(isParamDisabled('oak', 'branchesLevel1Range', { branchDepth: 1 })).toBe(false);
		});

		it('disables branchesLevel2Range when branchDepth < 2', () => {
			expect(isParamDisabled('oak', 'branchesLevel2Range', { branchDepth: 1 })).toBe(true);
		});

		it('does not disable branchesLevel2Range when branchDepth >= 2', () => {
			expect(isParamDisabled('oak', 'branchesLevel2Range', { branchDepth: 2 })).toBe(false);
		});

		it('disables branchesLevel3Range when branchDepth < 3', () => {
			expect(isParamDisabled('oak', 'branchesLevel3Range', { branchDepth: 2 })).toBe(true);
		});

		it('does not disable branchesLevel3Range when branchDepth >= 3', () => {
			expect(isParamDisabled('oak', 'branchesLevel3Range', { branchDepth: 3 })).toBe(false);
		});
	});

	describe('cross-param rules — branchWidthVariance (REQ-EV2-D-02)', () => {
		it('disables branchWidthVariance when branchDepth === 0', () => {
			expect(isParamDisabled('oak', 'branchWidthVariance', { branchDepth: 0 })).toBe(true);
		});

		it('does not disable branchWidthVariance when branchDepth >= 1', () => {
			expect(isParamDisabled('oak', 'branchWidthVariance', { branchDepth: 1 })).toBe(false);
		});

		it('disables branchWidthVariance when branchDepth is undefined (defaults to 0)', () => {
			expect(isParamDisabled('oak', 'branchWidthVariance', {})).toBe(true);
		});
	});

	describe('fruitCount disabled when fruitType is none', () => {
		it('disables fruitCount when fruitType is none', () => {
			expect(isParamDisabled('oak', 'fruitCount', { fruitType: 'none' })).toBe(true);
		});

		it('does not disable fruitCount when fruitType is apple', () => {
			expect(isParamDisabled('oak', 'fruitCount', { fruitType: 'apple' })).toBe(false);
		});

		it('does not disable fruitCount when fruitType is cherry_pair', () => {
			expect(isParamDisabled('oak', 'fruitCount', { fruitType: 'cherry_pair' })).toBe(false);
		});
	});

	describe('fruitType locked for non-custom shapes', () => {
		it('disables fruitType for oak', () => {
			expect(isParamDisabled('oak', 'fruitType', {})).toBe(true);
		});

		it('disables fruitType for pine', () => {
			expect(isParamDisabled('pine', 'fruitType', {})).toBe(true);
		});

		it('does not disable fruitType for custom', () => {
			expect(isParamDisabled('custom', 'fruitType', {})).toBe(false);
		});
	});

	describe('blobCloseness disabled for branching shapes (REQ-S-12)', () => {
		it.each([
			'oak',
			'birch',
			'maple',
			'willow',
			'apple',
			'cherry',
			'baobab',
			'acacia',
		] as const)('disables blobCloseness for %s', (shape) => {
			expect(isParamDisabled(shape, 'blobCloseness', {})).toBe(true);
		});

		it('does not disable blobCloseness for custom', () => {
			expect(isParamDisabled('custom', 'blobCloseness', {})).toBe(false);
		});

		it('does not disable blobCloseness for pine', () => {
			expect(isParamDisabled('pine', 'blobCloseness', {})).toBe(false);
		});
	});
});
