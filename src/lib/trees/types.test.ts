import { describe, it, expect } from 'vitest';
import {
	DEFAULT_TREE_CONFIG,
	SHAPE_DEFAULTS,
	SHAPE_FRUIT_MAP,
	TREE_SHAPES,
	TREE_SHAPE_OPTIONS,
	type TreeShape,
} from './types.js';
import { getShapeDefinition } from './shapes/shape_definitions.js';

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

	it('has crookednessMode "alternating" by default', () => {
		expect(DEFAULT_TREE_CONFIG.crookednessMode).toBe('alternating');
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
		expect({ ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS.oak }).toMatchObject({
			blobCount: 5,
			branchDepth: 2,
			branchesLevel1Range: [1, 3],
			branchesLevel2Range: [1, 2],
			branchesLevel3Range: [0, 1],
			branchAngle: 50,
			trunkTwist: 35,
			blobSizeVariance: 2.5,
			blobCloseness: 45,
			branchThickness: 100,
			trunkSegments: 5,
			trunkCrookedness: 15,
			crookednessMode: 'alternating',
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
		expect({ ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS.pine }).toMatchObject({
			blobCount: 5,
			branchDepth: 0,
			branchesLevel1Range: [0, 0],
			branchesLevel2Range: [0, 0],
			branchesLevel3Range: [0, 0],
			branchAngle: 50,
			trunkTwist: 20,
			blobSizeVariance: 2.0,
			blobCloseness: 60,
			branchThickness: 100,
			trunkSegments: 3,
			trunkCrookedness: 10,
			crookednessMode: 'alternating',
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

	it('has birch defaults (REQ-EV2-TZ-03: trunkSegments 3→4)', () => {
		expect({ ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS.birch }).toMatchObject({
			blobCount: 6,
			branchDepth: 2,
			branchesLevel1Range: [1, 2],
			branchesLevel2Range: [1, 2],
			branchesLevel3Range: [0, 1],
			branchAngle: 60,
			trunkTwist: 25,
			blobSizeVariance: 2.5,
			blobCloseness: 35,
			branchThickness: 80,
			trunkSegments: 4,
			trunkCrookedness: 10,
			crookednessMode: 'alternating',
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
		expect({ ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS.fir }).toMatchObject({
			blobCount: 6,
			branchDepth: 0,
			branchesLevel1Range: [0, 0],
			branchesLevel2Range: [0, 0],
			branchesLevel3Range: [0, 0],
			branchAngle: 50,
			trunkTwist: 20,
			blobSizeVariance: 2.5,
			blobCloseness: 45,
			branchThickness: 100,
			trunkSegments: 3,
			trunkCrookedness: 10,
			crookednessMode: 'alternating',
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

	it('has maple defaults (REQ-EV2-TZ-03: trunkSegments 3→7)', () => {
		expect({ ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS.maple }).toMatchObject({
			blobCount: 5,
			branchDepth: 2,
			branchesLevel1Range: [3, 5],
			branchesLevel2Range: [1, 2],
			branchesLevel3Range: [0, 1],
			branchAngle: 40,
			trunkTwist: 30,
			blobSizeVariance: 1.3,
			blobCloseness: 40,
			branchThickness: 100,
			trunkSegments: 7,
			trunkCrookedness: 20,
			crookednessMode: 'alternating',
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

	it('has willow defaults (REQ-EV2-TZ-03: trunkSegments 5→7)', () => {
		expect({ ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS.willow }).toMatchObject({
			blobCount: 6,
			branchDepth: 2,
			branchesLevel1Range: [3, 5],
			branchesLevel2Range: [1, 2],
			branchesLevel3Range: [0, 1],
			branchAngle: 15,
			trunkTwist: 35,
			blobSizeVariance: 2.0,
			blobCloseness: 35,
			branchThickness: 80,
			trunkSegments: 7,
			trunkCrookedness: 20,
			crookednessMode: 'alternating',
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

	it('willow blobVerticalOffset is 25 (drooping canopy)', () => {
		const willowDef = getShapeDefinition(TREE_SHAPES.willow);
		expect(willowDef.styleParameters?.blobVerticalOffset).toBe(25);
	});

	it('every merged shape has crookednessMode, trunkSegments >= 1, trunkCrookedness >= 0', () => {
		for (const shape of nonCustomShapes) {
			const merged = { ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS[shape] };
			expect(merged.crookednessMode).toBe('alternating');
			expect(merged.trunkSegments).toBeGreaterThanOrEqual(1);
			expect(merged.trunkCrookedness).toBeGreaterThanOrEqual(0);
		}
	});

	it('every merged shape has branchLength and branchLengthVariance (REQ-P-23/24)', () => {
		for (const shape of nonCustomShapes) {
			const merged = { ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS[shape] };
			expect(typeof merged.branchLength).toBe('number');
			expect(merged.branchLength).toBeGreaterThan(0);
			expect(typeof merged.branchLengthVariance).toBe('number');
		}
	});

	it('every merged shape carries all 5 color fields (§2.6, REQ-L-09)', () => {
		for (const shape of nonCustomShapes) {
			const merged = { ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS[shape] };
			expect(merged.canopyLightColor).toMatch(/^#[0-9a-f]{6}$/);
			expect(merged.canopyDarkColor).toMatch(/^#[0-9a-f]{6}$/);
			expect(typeof merged.trunkHue).toBe('number');
			expect(typeof merged.trunkSaturation).toBe('number');
			expect(typeof merged.trunkLightness).toBe('number');
		}
	});

	it('has cypress defaults (tall narrow, no branches, dark green)', () => {
		expect(SHAPE_DEFAULTS.cypress.blobCount).toBe(2);
		expect(SHAPE_DEFAULTS.cypress.branchDepth).toBe(0);
		expect(SHAPE_DEFAULTS.cypress.canopyLightColor).toBe('#2d5e3a');
		expect(SHAPE_DEFAULTS.cypress.fruitType).toBe('small_cone');
	});

	it('has apple defaults (compact round, short trunk, apple fruit)', () => {
		expect(SHAPE_DEFAULTS.apple.blobCount).toBe(2);
		expect(SHAPE_DEFAULTS.apple.branchDepth).toBe(1);
		expect(SHAPE_DEFAULTS.apple.fruitType).toBe('apple');
	});

	it('has cherry defaults (wide spread, pink canopy, cherry_pair fruit)', () => {
		const merged = { ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS.cherry };
		expect(merged.blobCount).toBe(4);
		expect(merged.branchDepth).toBe(2);
		expect(merged.canopyLightColor).toBe('#ffb7c5');
		expect(merged.canopyDarkColor).toBe('#c4586a');
		expect(merged.fruitType).toBe('cherry_pair');
		expect(merged.fruitCount).toBe(4);
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

describe('Engine v2 config fields (§13)', () => {
	it('DEFAULT_TREE_CONFIG has trunkStripCount=3 (REQ-EV2-X-01)', () => {
		expect(DEFAULT_TREE_CONFIG.trunkStripCount).toBe(3);
	});

	it('DEFAULT_TREE_CONFIG has branchWidthVariance=25 (REQ-EV2-V-02)', () => {
		expect(DEFAULT_TREE_CONFIG.branchWidthVariance).toBe(25);
	});

	it('DEFAULT_TREE_CONFIG has trunkTwist=25 (REQ-EV2-X-03)', () => {
		expect(DEFAULT_TREE_CONFIG.trunkTwist).toBe(25);
	});

	it('trunkPolygons is removed from TreeConfig (REQ-EV2-D-03)', () => {
		expect('trunkPolygons' in DEFAULT_TREE_CONFIG).toBe(false);
	});

	it('merged shape trunkSegments values per REQ-EV2-TZ-03', () => {
		const merged = (shape: Exclude<TreeShape, 'custom'>) => ({
			...DEFAULT_TREE_CONFIG,
			...SHAPE_DEFAULTS[shape],
		});
		expect(SHAPE_DEFAULTS.oak.trunkSegments).toBe(5);
		expect(SHAPE_DEFAULTS.maple.trunkSegments).toBe(7);
		expect(SHAPE_DEFAULTS.willow.trunkSegments).toBe(7);
		expect(SHAPE_DEFAULTS.cherry.trunkSegments).toBe(6);
		expect(SHAPE_DEFAULTS.birch.trunkSegments).toBe(4);
		expect(SHAPE_DEFAULTS.baobab.trunkSegments).toBe(5);
		expect(SHAPE_DEFAULTS.acacia.trunkSegments).toBe(5);
		// pine, fir, cypress, apple, bush inherit trunkSegments=3 from DEFAULT_TREE_CONFIG
		expect(merged('pine').trunkSegments).toBe(3);
		expect(merged('fir').trunkSegments).toBe(3);
		expect(merged('cypress').trunkSegments).toBe(3);
		expect(merged('apple').trunkSegments).toBe(3);
		expect(merged('bush').trunkSegments).toBe(3);
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

describe('Issue #110: SHAPE_DEFAULTS reset completeness', () => {
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

	it('each species defaults produces a valid config when merged with DEFAULT_TREE_CONFIG', () => {
		for (const shape of nonCustomShapes) {
			const defaults = SHAPE_DEFAULTS[shape];
			const merged = { ...DEFAULT_TREE_CONFIG, ...defaults, shape };
			// Verify key fields exist and are valid
			expect(typeof merged.blobCount).toBe('number');
			expect(typeof merged.branchDepth).toBe('number');
			expect(typeof merged.blobCloseness).toBe('number');
			expect(typeof merged.canopyLightColor).toBe('string');
			expect(merged.canopyLightColor).toMatch(/^#[0-9a-f]{6}$/);
			expect(merged.shape).toBe(shape);
		}
	});

	it('pine blobCloseness is 60 (issue #110)', () => {
		expect(SHAPE_DEFAULTS.pine.blobCloseness).toBe(60);
	});
});
