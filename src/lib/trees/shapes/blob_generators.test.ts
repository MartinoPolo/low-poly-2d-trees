import { describe, it, expect } from 'vitest';
import { getShapeDefinition } from './blob_generators.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';

const W = VIEWBOX_WIDTH;
const H = VIEWBOX_HEIGHT;

describe('Envelope defaults — 1.8× scale (issue #110)', () => {
	const leafySpecies = [
		{ shape: 'oak' as const, oldRxFactor: 0.32, oldRyFactor: 0.22 },
		{ shape: 'birch' as const, oldRxFactor: 0.28, oldRyFactor: 0.28 },
		{ shape: 'maple' as const, oldRxFactor: 0.3, oldRyFactor: 0.2 },
		{ shape: 'willow' as const, oldRxFactor: 0.32, oldRyFactor: 0.2 },
		{ shape: 'apple' as const, oldRxFactor: 0.28, oldRyFactor: 0.22 },
		{ shape: 'cherry' as const, oldRxFactor: 0.4, oldRyFactor: 0.16 },
		{ shape: 'baobab' as const, oldRxFactor: 0.22, oldRyFactor: 0.12 },
		{ shape: 'acacia' as const, oldRxFactor: 0.42, oldRyFactor: 0.1 },
	];

	for (const { shape, oldRxFactor, oldRyFactor } of leafySpecies) {
		it(`${shape} envelope baseRadiusX >= 1.75× old value`, () => {
			const def = getShapeDefinition(shape);
			expect(def.envelopeDefaults).toBeDefined();
			expect(def.envelopeDefaults!.baseRadiusX).toBeGreaterThanOrEqual(
				W * oldRxFactor * 1.75,
			);
		});

		it(`${shape} envelope baseRadiusY >= 1.75× old value`, () => {
			const def = getShapeDefinition(shape);
			expect(def.envelopeDefaults).toBeDefined();
			expect(def.envelopeDefaults!.baseRadiusY).toBeGreaterThanOrEqual(
				H * oldRyFactor * 1.75,
			);
		});
	}
});
