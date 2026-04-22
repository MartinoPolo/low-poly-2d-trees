import { describe, expect, it } from 'vitest';
import { generateRainLines } from './overlay_generators.js';
import { OVERLAY_DEFAULTS, hasActiveOverlay } from './overlay_types.js';

describe('overlay_types', () => {
	it('defaults have glow disabled', () => {
		expect(OVERLAY_DEFAULTS.glow.enabled).toBe(false);
	});

	it('OVERLAY_DEFAULTS does not have stormCloud or speechBubble', () => {
		expect(OVERLAY_DEFAULTS).not.toHaveProperty('stormCloud');
		expect(OVERLAY_DEFAULTS).not.toHaveProperty('speechBubble');
	});

	it('hasActiveOverlay returns false when all disabled', () => {
		expect(hasActiveOverlay(OVERLAY_DEFAULTS)).toBe(false);
	});

	it('hasActiveOverlay returns true when glow enabled', () => {
		const config = {
			...OVERLAY_DEFAULTS,
			glow: { ...OVERLAY_DEFAULTS.glow, enabled: true },
		};
		expect(hasActiveOverlay(config)).toBe(true);
	});
});

describe('generateRainLines', () => {
	it('is deterministic', () => {
		const a = generateRainLines(42, 10, 60);
		const b = generateRainLines(42, 10, 60);
		expect(a).toEqual(b);
	});

	it('returns requested count', () => {
		const lines = generateRainLines(42, 8, 60);
		expect(lines).toHaveLength(8);
	});

	it('rain lines confined to cloud width', () => {
		const cloudWidth = 60;
		const lines = generateRainLines(42, 20, cloudWidth);
		for (const line of lines) {
			expect(line.x).toBeGreaterThanOrEqual(0);
			expect(line.x).toBeLessThanOrEqual(cloudWidth);
			expect(line.length).toBeGreaterThan(0);
			expect(line.speed).toBeGreaterThan(0);
		}
	});
});
