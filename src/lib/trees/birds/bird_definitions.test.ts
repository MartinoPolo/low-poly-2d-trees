import { describe, it, expect } from 'vitest';
import { BIRD_DEFINITIONS } from './bird_definitions.js';
import { BIRD_SPECIES } from './bird_types.js';

describe('BIRD_DEFINITIONS', () => {
	it('has entry for every BIRD_SPECIES', () => {
		for (const species of Object.values(BIRD_SPECIES)) {
			expect(BIRD_DEFINITIONS).toHaveProperty(species);
		}
	});

	it('each entry has truthy svgComponent', () => {
		for (const [key, def] of Object.entries(BIRD_DEFINITIONS)) {
			expect(def.svgComponent, `${key} svgComponent`).toBeTruthy();
		}
	});

	it('each entry has positive defaultScale', () => {
		for (const [key, def] of Object.entries(BIRD_DEFINITIONS)) {
			expect(def.defaultScale, `${key} defaultScale`).toBeGreaterThan(0);
		}
	});

	it('owl is the largest scale and hummingbird the smallest', () => {
		const scales = Object.entries(BIRD_DEFINITIONS).map(([key, def]) => ({
			key,
			scale: def.defaultScale,
		}));
		const maxEntry = scales.reduce((a, b) => (a.scale >= b.scale ? a : b));
		const minEntry = scales.reduce((a, b) => (a.scale <= b.scale ? a : b));
		expect(maxEntry.key).toBe('owl');
		expect(minEntry.key).toBe('hummingbird');
	});
});
