import { describe, it, expect } from 'vitest';
import { OVERLAY_DEFINITIONS, OVERLAY_PARTICLE_TYPES } from './overlay_definitions.js';

describe('OVERLAY_DEFINITIONS', () => {
	it('has entries for all 6 overlay particle types', () => {
		for (const overlayType of Object.values(OVERLAY_PARTICLE_TYPES)) {
			expect(OVERLAY_DEFINITIONS).toHaveProperty(overlayType);
		}
	});

	it('each entry has a truthy svgComponent', () => {
		for (const overlayType of Object.values(OVERLAY_PARTICLE_TYPES)) {
			expect(OVERLAY_DEFINITIONS[overlayType].svgComponent).toBeTruthy();
		}
	});

	it('each entry has numeric scale', () => {
		for (const overlayType of Object.values(OVERLAY_PARTICLE_TYPES)) {
			expect(typeof OVERLAY_DEFINITIONS[overlayType].scale).toBe('number');
			expect(OVERLAY_DEFINITIONS[overlayType].scale).toBeGreaterThan(0);
		}
	});

	it('each entry has defaultColor as string or null', () => {
		for (const overlayType of Object.values(OVERLAY_PARTICLE_TYPES)) {
			const { defaultColor } = OVERLAY_DEFINITIONS[overlayType];
			expect(defaultColor === null || typeof defaultColor === 'string').toBe(true);
		}
	});

	it('each overlay has a unique svgComponent', () => {
		const components = Object.values(OVERLAY_DEFINITIONS).map((d) => d.svgComponent);
		expect(new Set(components).size).toBe(components.length);
	});

	it('leaf has green default color', () => {
		expect(OVERLAY_DEFINITIONS.leaf.defaultColor).toBe('#4a7a2a');
	});

	it('windParticle has null default color', () => {
		expect(OVERLAY_DEFINITIONS.windParticle.defaultColor).toBeNull();
	});
});
