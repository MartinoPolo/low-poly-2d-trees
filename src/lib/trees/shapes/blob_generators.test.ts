import { describe, it, expect } from 'vitest';
import {
	getShapeDefinition,
	TREE_SCALE,
	treeY,
	treeSizeH,
	treeSizeW,
	TRUNK_ENTRY_MIN_PX,
} from './blob_generators.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';
import type { TreeShape } from '../types.js';

const W = VIEWBOX_WIDTH;
const H = VIEWBOX_HEIGHT;

// ---------------------------------------------------------------------------
// Group 1: TREE_SCALE helpers
// ---------------------------------------------------------------------------

describe('TREE_SCALE helpers', () => {
	it('TREE_SCALE = 0.6', () => {
		expect(TREE_SCALE).toBe(0.6);
	});

	it('treeY(0.05) = 205 — top of canopy scaled toward ground', () => {
		// TRUNK_BASE_Y = 500 * 0.95 = 475
		// treeY(0.05) = 475 - (475 - 500*0.05) * 0.6 = 475 - (475 - 25)*0.6 = 475 - 270 = 205
		expect(treeY(0.05)).toBe(205);
	});

	it('treeY(0.95) = 475 — ground stays fixed', () => {
		// treeY(0.95) = 475 - (475 - 475)*0.6 = 475
		expect(treeY(0.95)).toBe(475);
	});

	it('treeSizeH(0.5) = 150', () => {
		// 500 * 0.5 * 0.6 = 150
		expect(treeSizeH(0.5)).toBe(150);
	});

	it('treeSizeW(0.22) = 66', () => {
		// 500 * 0.22 * 0.6 = 66
		expect(treeSizeW(0.22)).toBe(66);
	});
});

// ---------------------------------------------------------------------------
// Group 2: Trunk widths (reverted to 300-equivalent)
// ---------------------------------------------------------------------------

describe('Trunk widths — reverted to 300-equivalent', () => {
	const expectedWidths: Record<string, { base: number; top: number }> = {
		oak: { base: 32, top: 20 },
		pine: { base: 21, top: 12 },
		birch: { base: 16, top: 9 },
		fir: { base: 19, top: 11 },
		maple: { base: 28, top: 18 },
		willow: { base: 28, top: 18 },
		cypress: { base: 14, top: 8 },
		apple: { base: 32, top: 22 },
		cherry: { base: 22, top: 14 },
		bush: { base: 10, top: 6 },
		baobab: { base: 50, top: 20 },
		acacia: { base: 16, top: 10 },
		custom: { base: 28, top: 18 },
	};

	for (const [shape, expected] of Object.entries(expectedWidths)) {
		it(`${shape}: trunkBaseWidth = ${expected.base}`, () => {
			const def = getShapeDefinition(shape as TreeShape);
			expect(def.trunkBaseWidth).toBe(expected.base);
		});

		it(`${shape}: trunkTopWidth = ${expected.top}`, () => {
			const def = getShapeDefinition(shape as TreeShape);
			expect(def.trunkTopWidth).toBe(expected.top);
		});
	}
});

// ---------------------------------------------------------------------------
// Group 3: TRUNK_ENTRY_MIN_PX
// ---------------------------------------------------------------------------

describe('TRUNK_ENTRY_MIN_PX', () => {
	it('equals 15', () => {
		expect(TRUNK_ENTRY_MIN_PX).toBe(15);
	});
});

describe('Envelope defaults — TREE_SCALE applied (issue #152)', () => {
	const species = [
		{ shape: 'oak' as const, rxFactor: 0.576, ryFactor: 0.396 },
		{ shape: 'birch' as const, rxFactor: 0.504, ryFactor: 0.504 },
		{ shape: 'maple' as const, rxFactor: 0.54, ryFactor: 0.36 },
		{ shape: 'willow' as const, rxFactor: 0.576, ryFactor: 0.36 },
		{ shape: 'apple' as const, rxFactor: 0.504, ryFactor: 0.396 },
		{ shape: 'cherry' as const, rxFactor: 0.72, ryFactor: 0.288 },
		{ shape: 'baobab' as const, rxFactor: 0.396, ryFactor: 0.216 },
		{ shape: 'acacia' as const, rxFactor: 0.756, ryFactor: 0.18 },
	];

	for (const { shape, rxFactor, ryFactor } of species) {
		it(`${shape} envelope baseRadiusX = treeSizeW(${rxFactor})`, () => {
			const def = getShapeDefinition(shape);
			expect(def.envelopeDefaults).toBeDefined();
			expect(def.envelopeDefaults!.baseRadiusX).toBeCloseTo(W * rxFactor * 0.6, 1);
		});

		it(`${shape} envelope baseRadiusY = treeSizeH(${ryFactor})`, () => {
			const def = getShapeDefinition(shape);
			expect(def.envelopeDefaults).toBeDefined();
			expect(def.envelopeDefaults!.baseRadiusY).toBeCloseTo(H * ryFactor * 0.6, 1);
		});
	}
});
