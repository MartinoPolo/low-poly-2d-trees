import { describe, it, expect } from 'vitest';
import {
	DEFAULT_TREE_CONFIG,
	SHAPE_DEFAULTS,
	TREE_SHAPES,
	TREE_SHAPE_OPTIONS,
	type TreeShape,
} from './types.js';

describe('TREE_SHAPES union', () => {
	it('includes all 7 Plan v4 shapes', () => {
		expect(Object.keys(TREE_SHAPES).sort()).toEqual(
			['birch', 'custom', 'fir', 'maple', 'oak', 'pine', 'willow'].sort(),
		);
	});

	it('TREE_SHAPE_OPTIONS exposes all 7 shapes for UI selectors', () => {
		const values = TREE_SHAPE_OPTIONS.map((o) => o.value).sort();
		expect(values).toEqual(['birch', 'custom', 'fir', 'maple', 'oak', 'pine', 'willow'].sort());
	});
});

describe('DEFAULT_TREE_CONFIG', () => {
	it('uses lightAngle 130 (REQ-P-12)', () => {
		expect(DEFAULT_TREE_CONFIG.lightAngle).toBe(130);
	});
});

describe('SHAPE_DEFAULTS §2.5', () => {
	const nonCustomShapes: readonly Exclude<TreeShape, 'custom'>[] = [
		'oak',
		'pine',
		'birch',
		'fir',
		'maple',
		'willow',
	];

	it('contains an entry for all 6 non-custom shapes', () => {
		for (const shape of nonCustomShapes) {
			expect(SHAPE_DEFAULTS[shape]).toBeDefined();
		}
	});

	it('has oak defaults', () => {
		expect(SHAPE_DEFAULTS.oak).toEqual({
			blobCount: 5,
			branchCount: 2,
			blobSizeVariance: 3.0,
			blobCloseness: 50,
			branchThickness: 100,
			trunkSegments: 1,
			trunkCrookedness: 0,
		});
	});

	it('has pine defaults', () => {
		expect(SHAPE_DEFAULTS.pine).toEqual({
			blobCount: 3,
			branchCount: 0,
			blobSizeVariance: 3.0,
			blobCloseness: 50,
			branchThickness: 100,
			trunkSegments: 1,
			trunkCrookedness: 0,
		});
	});

	it('has birch defaults', () => {
		expect(SHAPE_DEFAULTS.birch).toEqual({
			blobCount: 3,
			branchCount: 1,
			blobSizeVariance: 3.0,
			blobCloseness: 50,
			branchThickness: 100,
			trunkSegments: 1,
			trunkCrookedness: 0,
		});
	});

	it('has fir defaults', () => {
		expect(SHAPE_DEFAULTS.fir).toEqual({
			blobCount: 4,
			branchCount: 0,
			blobSizeVariance: 3.0,
			blobCloseness: 50,
			branchThickness: 100,
			trunkSegments: 1,
			trunkCrookedness: 0,
		});
	});

	it('has maple defaults (low closeness, low variance)', () => {
		expect(SHAPE_DEFAULTS.maple).toEqual({
			blobCount: 5,
			branchCount: 5,
			blobSizeVariance: 2.0,
			blobCloseness: 30,
			branchThickness: 100,
			trunkSegments: 1,
			trunkCrookedness: 0,
		});
	});

	it('has willow defaults (thick branches 150, 3 segments, 40% crookedness)', () => {
		expect(SHAPE_DEFAULTS.willow).toEqual({
			blobCount: 4,
			branchCount: 4,
			blobSizeVariance: 3.0,
			blobCloseness: 50,
			branchThickness: 150,
			trunkSegments: 3,
			trunkCrookedness: 40,
		});
	});
});
