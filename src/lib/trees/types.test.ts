import { describe, it, expect } from 'vitest';
import {
	DEFAULT_TREE_CONFIG,
	SHAPE_DEFAULTS,
	SHAPE_FRUIT_MAP,
	TREE_SHAPES,
	TREE_SHAPE_OPTIONS,
	type TreeShape,
} from './types.js';

describe('TREE_SHAPES union', () => {
	const allShapes = [
		'acacia',
		'apple',
		'baobab',
		'birch',
		'bush',
		'cherry',
		'custom',
		'cypress',
		'fir',
		'maple',
		'oak',
		'pine',
		'willow',
	];

	it('includes all 13 shapes', () => {
		expect(Object.keys(TREE_SHAPES).sort()).toEqual(allShapes);
	});

	it('TREE_SHAPE_OPTIONS exposes all 13 shapes for UI selectors', () => {
		const values = TREE_SHAPE_OPTIONS.map((o) => o.value).sort();
		expect(values).toEqual(allShapes);
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
		'cypress',
		'apple',
		'cherry',
		'bush',
		'baobab',
		'acacia',
	];

	it('contains an entry for all 12 non-custom shapes', () => {
		for (const shape of nonCustomShapes) {
			expect(SHAPE_DEFAULTS[shape]).toBeDefined();
		}
	});

	it('has oak defaults', () => {
		expect(SHAPE_DEFAULTS.oak).toEqual({
			blobCount: 5,
			branchDepth: 2,
			branchesLevel1Range: [1, 3],
			branchesLevel2Range: [1, 2],
			branchesLevel3Range: [0, 1],
			branchAngle: 50,
			blobSizeVariance: 2.5,
			blobCloseness: 45,
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
			fruitType: 'acorn',
			fruitCount: 3,
		});
	});

	it('has pine defaults', () => {
		expect(SHAPE_DEFAULTS.pine).toEqual({
			blobCount: 5,
			branchDepth: 0,
			branchesLevel1Range: [0, 0],
			branchesLevel2Range: [0, 0],
			branchesLevel3Range: [0, 0],
			branchAngle: 50,
			blobSizeVariance: 2.0,
			blobCloseness: 30,
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
			fruitType: 'pine_cone',
			fruitCount: 3,
		});
	});

	it('has birch defaults', () => {
		expect(SHAPE_DEFAULTS.birch).toEqual({
			blobCount: 6,
			branchDepth: 2,
			branchesLevel1Range: [1, 2],
			branchesLevel2Range: [1, 2],
			branchesLevel3Range: [0, 1],
			branchAngle: 60,
			blobSizeVariance: 2.5,
			blobCloseness: 35,
			branchThickness: 80,
			trunkSegments: 1,
			trunkCrookedness: 0,
			branchLength: 100,
			branchLengthVariance: 50,
			canopyLightColor: '#b8e065',
			canopyDarkColor: '#2d5e3a',
			trunkHue: 40,
			trunkSaturation: 8,
			trunkLightness: 82,
			fruitType: 'catkin_birch',
			fruitCount: 3,
		});
	});

	it('has fir defaults', () => {
		expect(SHAPE_DEFAULTS.fir).toEqual({
			blobCount: 6,
			branchDepth: 0,
			branchesLevel1Range: [0, 0],
			branchesLevel2Range: [0, 0],
			branchesLevel3Range: [0, 0],
			branchAngle: 50,
			blobSizeVariance: 2.5,
			blobCloseness: 45,
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
			fruitType: 'fir_cone',
			fruitCount: 3,
		});
	});

	it('has maple defaults (low closeness, reduced variance)', () => {
		expect(SHAPE_DEFAULTS.maple).toEqual({
			blobCount: 5,
			branchDepth: 2,
			branchesLevel1Range: [3, 5],
			branchesLevel2Range: [1, 2],
			branchesLevel3Range: [0, 1],
			branchAngle: 40,
			blobSizeVariance: 1.3,
			blobCloseness: 40,
			branchThickness: 100,
			trunkSegments: 2,
			trunkCrookedness: 30,
			branchLength: 100,
			branchLengthVariance: 50,
			canopyLightColor: '#e8a028',
			canopyDarkColor: '#8b2010',
			trunkHue: 30,
			trunkSaturation: 20,
			trunkLightness: 35,
			fruitType: 'samara',
			fruitCount: 3,
		});
	});

	it('has willow defaults (drooping, 2 segments, 25% crookedness)', () => {
		expect(SHAPE_DEFAULTS.willow).toEqual({
			blobCount: 6,
			branchDepth: 2,
			branchesLevel1Range: [3, 5],
			branchesLevel2Range: [1, 2],
			branchesLevel3Range: [0, 1],
			branchAngle: 30,
			blobSizeVariance: 2.0,
			blobCloseness: 35,
			branchThickness: 80,
			trunkSegments: 2,
			trunkCrookedness: 25,
			branchLength: 100,
			branchLengthVariance: 50,
			canopyLightColor: '#7cc45a',
			canopyDarkColor: '#1a4020',
			trunkHue: 25,
			trunkSaturation: 40,
			trunkLightness: 22,
			fruitType: 'catkin_willow',
			fruitCount: 3,
		});
	});

	it('every shape entry has branchLength and branchLengthVariance (REQ-P-23/24)', () => {
		for (const shape of nonCustomShapes) {
			expect(typeof SHAPE_DEFAULTS[shape].branchLength).toBe('number');
			expect(SHAPE_DEFAULTS[shape].branchLength).toBeGreaterThan(0);
			expect(typeof SHAPE_DEFAULTS[shape].branchLengthVariance).toBe('number');
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

	it('has cypress defaults (tall narrow, no branches, dark green)', () => {
		expect(SHAPE_DEFAULTS.cypress.blobCount).toBe(2);
		expect(SHAPE_DEFAULTS.cypress.branchDepth).toBe(0);
		expect(SHAPE_DEFAULTS.cypress.canopyLightColor).toBe('#2d5e3a');
		expect(SHAPE_DEFAULTS.cypress.fruitType).toBe('small_cone');
		expect(SHAPE_DEFAULTS.cypress.fruitCount).toBe(3);
	});

	it('has apple defaults (compact round, short trunk, apple fruit)', () => {
		expect(SHAPE_DEFAULTS.apple.blobCount).toBe(2);
		expect(SHAPE_DEFAULTS.apple.branchDepth).toBe(1);
		expect(SHAPE_DEFAULTS.apple.fruitType).toBe('apple');
		expect(SHAPE_DEFAULTS.apple.fruitCount).toBe(3);
	});

	it('has cherry defaults (wide spread, pink canopy, cherry_pair fruit)', () => {
		expect(SHAPE_DEFAULTS.cherry.blobCount).toBe(4);
		expect(SHAPE_DEFAULTS.cherry.branchDepth).toBe(2);
		expect(SHAPE_DEFAULTS.cherry.canopyLightColor).toBe('#ffb7c5');
		expect(SHAPE_DEFAULTS.cherry.canopyDarkColor).toBe('#c4586a');
		expect(SHAPE_DEFAULTS.cherry.fruitType).toBe('cherry_pair');
		expect(SHAPE_DEFAULTS.cherry.fruitCount).toBe(4);
	});

	it('has bush defaults (ground-level, no branches)', () => {
		expect(SHAPE_DEFAULTS.bush.blobCount).toBe(2);
		expect(SHAPE_DEFAULTS.bush.branchDepth).toBe(0);
	});

	it('has baobab defaults (small canopy, short branches at top)', () => {
		expect(SHAPE_DEFAULTS.baobab.blobCount).toBe(3);
		expect(SHAPE_DEFAULTS.baobab.branchDepth).toBe(1);
		expect(SHAPE_DEFAULTS.baobab.trunkSaturation).toBe(15);
	});

	it('has acacia defaults (flat-topped, olive-green)', () => {
		expect(SHAPE_DEFAULTS.acacia.blobCount).toBe(3);
		expect(SHAPE_DEFAULTS.acacia.branchDepth).toBe(1);
		expect(SHAPE_DEFAULTS.acacia.branchAngle).toBe(25);
	});
});

describe('DEFAULT_TREE_CONFIG canopy color defaults (REQ-P-30/31)', () => {
	it('uses oak canopyLightColor and canopyDarkColor from §2.6', () => {
		expect(DEFAULT_TREE_CONFIG.canopyLightColor).toBe('#a8d84e');
		expect(DEFAULT_TREE_CONFIG.canopyDarkColor).toBe('#1a472a');
	});
});

describe('SHAPE_FRUIT_MAP', () => {
	it('has 12 entries (one per non-custom shape)', () => {
		expect(Object.keys(SHAPE_FRUIT_MAP)).toHaveLength(12);
	});

	it('maps each shape to its expected fruit type', () => {
		expect(SHAPE_FRUIT_MAP.oak).toBe('acorn');
		expect(SHAPE_FRUIT_MAP.birch).toBe('catkin_birch');
		expect(SHAPE_FRUIT_MAP.maple).toBe('samara');
		expect(SHAPE_FRUIT_MAP.pine).toBe('pine_cone');
		expect(SHAPE_FRUIT_MAP.fir).toBe('fir_cone');
		expect(SHAPE_FRUIT_MAP.willow).toBe('catkin_willow');
		expect(SHAPE_FRUIT_MAP.cypress).toBe('small_cone');
		expect(SHAPE_FRUIT_MAP.apple).toBe('apple');
		expect(SHAPE_FRUIT_MAP.cherry).toBe('cherry_pair');
		expect(SHAPE_FRUIT_MAP.bush).toBe('berry');
		expect(SHAPE_FRUIT_MAP.baobab).toBe('baobab_fruit');
		expect(SHAPE_FRUIT_MAP.acacia).toBe('seed_pod');
	});
});
