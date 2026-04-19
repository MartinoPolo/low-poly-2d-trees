import { describe, expect, it } from 'vitest';
import { FRUIT_DEFINITIONS, type FruitDefinition } from './fruit_definitions.js';
import { FRUIT_TYPES } from '../types/fruit.js';

const expectedFruitTypes = Object.values(FRUIT_TYPES).filter((t) => t !== 'none');

describe('FRUIT_DEFINITIONS', () => {
	it('has entries for all 12 fruit types (excluding none)', () => {
		const keys = Object.keys(FRUIT_DEFINITIONS);
		expect(keys).toHaveLength(12);
		for (const fruitType of expectedFruitTypes) {
			expect(FRUIT_DEFINITIONS).toHaveProperty(fruitType);
		}
	});

	it('each entry has a truthy svgComponent', () => {
		for (const [key, def] of Object.entries(FRUIT_DEFINITIONS)) {
			expect(def.svgComponent, `${key} svgComponent`).toBeTruthy();
		}
	});

	it('each entry has scale as a number and originOffset with numeric x and y', () => {
		for (const [key, def] of Object.entries(FRUIT_DEFINITIONS) as [string, FruitDefinition][]) {
			expect(typeof def.scale, `${key} scale`).toBe('number');
			expect(typeof def.originOffset.x, `${key} originOffset.x`).toBe('number');
			expect(typeof def.originOffset.y, `${key} originOffset.y`).toBe('number');
		}
	});

	it('each fruit has a unique svgComponent', () => {
		const components = Object.values(FRUIT_DEFINITIONS).map((d) => d.svgComponent);
		expect(new Set(components).size).toBe(components.length);
	});
});
