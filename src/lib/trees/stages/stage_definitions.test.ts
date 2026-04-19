import { describe, it, expect } from 'vitest';
import { STAGE_DEFINITIONS, STAGE_ASSET_TYPES } from './stage_definitions.js';

describe('STAGE_DEFINITIONS', () => {
	it('has entries for all 3 stage asset types', () => {
		for (const stageType of Object.values(STAGE_ASSET_TYPES)) {
			expect(STAGE_DEFINITIONS).toHaveProperty(stageType);
		}
	});

	it('each entry has a truthy svgComponent', () => {
		for (const stageType of Object.values(STAGE_ASSET_TYPES)) {
			expect(STAGE_DEFINITIONS[stageType].svgComponent).toBeTruthy();
		}
	});

	it('each entry has numeric scale', () => {
		for (const stageType of Object.values(STAGE_ASSET_TYPES)) {
			expect(typeof STAGE_DEFINITIONS[stageType].scale).toBe('number');
			expect(STAGE_DEFINITIONS[stageType].scale).toBeGreaterThan(0);
		}
	});

	it('each entry has positionOffset with numeric x and y', () => {
		for (const stageType of Object.values(STAGE_ASSET_TYPES)) {
			const { positionOffset } = STAGE_DEFINITIONS[stageType];
			expect(typeof positionOffset.x).toBe('number');
			expect(typeof positionOffset.y).toBe('number');
		}
	});

	it('each stage has a unique svgComponent', () => {
		const components = Object.values(STAGE_DEFINITIONS).map((d) => d.svgComponent);
		expect(new Set(components).size).toBe(components.length);
	});
});
