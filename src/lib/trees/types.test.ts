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
			branchLength: 100,
			branchLengthVariance: 50,
			canopyLightColor: '#a8d84e',
			canopyDarkColor: '#1a472a',
			trunkHue: 25,
			trunkSaturation: 50,
			trunkLightness: 25,
			fruitType: 'none',
			fruitCount: 0,
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
			branchLength: 100,
			branchLengthVariance: 50,
			canopyLightColor: '#4a9e5c',
			canopyDarkColor: '#0d2b1a',
			trunkHue: 20,
			trunkSaturation: 45,
			trunkLightness: 20,
			fruitType: 'none',
			fruitCount: 0,
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
			branchLength: 100,
			branchLengthVariance: 50,
			canopyLightColor: '#b8e065',
			canopyDarkColor: '#2d5e3a',
			trunkHue: 40,
			trunkSaturation: 15,
			trunkLightness: 80,
			fruitType: 'none',
			fruitCount: 0,
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
			branchLength: 100,
			branchLengthVariance: 50,
			canopyLightColor: '#3d8b50',
			canopyDarkColor: '#0a2418',
			trunkHue: 22,
			trunkSaturation: 50,
			trunkLightness: 28,
			fruitType: 'none',
			fruitCount: 0,
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
			branchLength: 100,
			branchLengthVariance: 50,
			canopyLightColor: '#e8a028',
			canopyDarkColor: '#8b2010',
			trunkHue: 30,
			trunkSaturation: 20,
			trunkLightness: 35,
			fruitType: 'none',
			fruitCount: 0,
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
			branchLength: 100,
			branchLengthVariance: 50,
			canopyLightColor: '#7cc45a',
			canopyDarkColor: '#1a4020',
			trunkHue: 25,
			trunkSaturation: 40,
			trunkLightness: 22,
			fruitType: 'none',
			fruitCount: 0,
		});
	});

	it('every shape entry has branchLength and branchLengthVariance (REQ-P-23/24)', () => {
		for (const shape of nonCustomShapes) {
			expect(SHAPE_DEFAULTS[shape].branchLength).toBe(100);
			expect(SHAPE_DEFAULTS[shape].branchLengthVariance).toBe(50);
		}
	});

	it('every shape entry carries all 5 color fields (§2.6, REQ-L-09)', () => {
		for (const shape of nonCustomShapes) {
			const entry = SHAPE_DEFAULTS[shape];
			expect(entry.canopyLightColor).toMatch(/^#[0-9a-f]{6}$/);
			expect(entry.canopyDarkColor).toMatch(/^#[0-9a-f]{6}$/);
			expect(typeof entry.trunkHue).toBe('number');
			expect(typeof entry.trunkSaturation).toBe('number');
			expect(typeof entry.trunkLightness).toBe('number');
		}
	});
});

describe('DEFAULT_TREE_CONFIG canopy color defaults (REQ-P-30/31)', () => {
	it('uses oak canopyLightColor and canopyDarkColor from §2.6', () => {
		expect(DEFAULT_TREE_CONFIG.canopyLightColor).toBe('#a8d84e');
		expect(DEFAULT_TREE_CONFIG.canopyDarkColor).toBe('#1a472a');
	});
});
