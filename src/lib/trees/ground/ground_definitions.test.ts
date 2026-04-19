import { describe, expect, it } from 'vitest';
import {
	GROUND_DEFINITIONS,
	GROUND_TYPES,
	type GroundDefinition,
	type GroundType,
} from './ground_definitions.js';

const expectedGroundTypes: GroundType[] = Object.values(GROUND_TYPES);

describe('GROUND_DEFINITIONS', () => {
	it('has entries for all ground types', () => {
		const keys = Object.keys(GROUND_DEFINITIONS);
		expect(keys).toHaveLength(2);
		for (const groundType of expectedGroundTypes) {
			expect(GROUND_DEFINITIONS).toHaveProperty(groundType);
		}
	});

	it('each entry has a truthy svgComponent', () => {
		for (const [key, def] of Object.entries(GROUND_DEFINITIONS)) {
			expect(def.svgComponent, `${key} svgComponent`).toBeTruthy();
		}
	});

	it('each entry has scaleRange and rotationRange with numeric min and max', () => {
		for (const [key, def] of Object.entries(GROUND_DEFINITIONS) as [
			string,
			GroundDefinition,
		][]) {
			expect(typeof def.scaleRange.min, `${key} scaleRange.min`).toBe('number');
			expect(typeof def.scaleRange.max, `${key} scaleRange.max`).toBe('number');
			expect(typeof def.rotationRange.min, `${key} rotationRange.min`).toBe('number');
			expect(typeof def.rotationRange.max, `${key} rotationRange.max`).toBe('number');
		}
	});

	it('each ground type has a unique svgComponent', () => {
		const components = Object.values(GROUND_DEFINITIONS).map((d) => d.svgComponent);
		expect(new Set(components).size).toBe(components.length);
	});
});
