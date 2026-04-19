import { describe, expect, it } from 'vitest';
import { FLOWER_DEFINITIONS, type FlowerDefinition } from './flower_definitions.js';
import { TREE_SHAPES } from '../types/config.js';

const expectedShapes = Object.values(TREE_SHAPES).filter((s) => s !== 'custom');

describe('FLOWER_DEFINITIONS', () => {
	it('has entries for all 12 tree shapes (excluding custom)', () => {
		const keys = Object.keys(FLOWER_DEFINITIONS);
		expect(keys).toHaveLength(12);
		for (const shape of expectedShapes) {
			expect(FLOWER_DEFINITIONS).toHaveProperty(shape);
		}
	});

	it('each entry has a truthy svgComponent', () => {
		for (const [key, def] of Object.entries(FLOWER_DEFINITIONS)) {
			expect(def.svgComponent, `${key} svgComponent`).toBeTruthy();
		}
	});

	it('each entry has scale as a number and originOffset with numeric x and y', () => {
		for (const [key, def] of Object.entries(FLOWER_DEFINITIONS) as [
			string,
			FlowerDefinition,
		][]) {
			expect(typeof def.scale, `${key} scale`).toBe('number');
			expect(typeof def.originOffset.x, `${key} originOffset.x`).toBe('number');
			expect(typeof def.originOffset.y, `${key} originOffset.y`).toBe('number');
		}
	});

	it('each shape has a unique svgComponent', () => {
		const components = Object.values(FLOWER_DEFINITIONS).map((d) => d.svgComponent);
		expect(new Set(components).size).toBe(components.length);
	});
});
