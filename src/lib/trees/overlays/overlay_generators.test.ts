import { describe, expect, it } from 'vitest';
import {
	generateStormCloudTriangles,
	generateRainLines,
	generateSpeechBubblePath,
} from './overlay_generators.js';
import {
	OVERLAY_DEFAULTS,
	hasActiveOverlay,
	needsViewboxExpansion,
	type OverlayConfig,
} from './overlay_types.js';

describe('overlay_types', () => {
	it('defaults have all overlays disabled', () => {
		expect(OVERLAY_DEFAULTS.stormCloud.enabled).toBe(false);
		expect(OVERLAY_DEFAULTS.speechBubble.enabled).toBe(false);
		expect(OVERLAY_DEFAULTS.wilting.enabled).toBe(false);
		expect(OVERLAY_DEFAULTS.glow.enabled).toBe(false);
	});

	it('hasActiveOverlay returns false when all disabled', () => {
		expect(hasActiveOverlay(OVERLAY_DEFAULTS)).toBe(false);
	});

	it('hasActiveOverlay returns true when any enabled', () => {
		const config: OverlayConfig = {
			...OVERLAY_DEFAULTS,
			stormCloud: { ...OVERLAY_DEFAULTS.stormCloud, enabled: true },
		};
		expect(hasActiveOverlay(config)).toBe(true);
	});

	it('needsViewboxExpansion only for stormCloud', () => {
		expect(needsViewboxExpansion(OVERLAY_DEFAULTS)).toBe(false);
		const withStorm: OverlayConfig = {
			...OVERLAY_DEFAULTS,
			stormCloud: { ...OVERLAY_DEFAULTS.stormCloud, enabled: true },
		};
		expect(needsViewboxExpansion(withStorm)).toBe(true);
		const withGlow: OverlayConfig = {
			...OVERLAY_DEFAULTS,
			glow: { ...OVERLAY_DEFAULTS.glow, enabled: true },
		};
		expect(needsViewboxExpansion(withGlow)).toBe(false);
	});
});

describe('generateStormCloudTriangles', () => {
	it('is deterministic — same seed produces same output', () => {
		const a = generateStormCloudTriangles(42, 60);
		const b = generateStormCloudTriangles(42, 60);
		expect(a).toEqual(b);
	});

	it('generates 5-8 triangles', () => {
		for (let seed = 0; seed < 20; seed++) {
			const result = generateStormCloudTriangles(seed, 60);
			expect(result.triangles.length).toBeGreaterThanOrEqual(5);
			expect(result.triangles.length).toBeLessThanOrEqual(8);
		}
	});

	it('each triangle has valid points string and color', () => {
		const result = generateStormCloudTriangles(42, 60);
		for (const tri of result.triangles) {
			expect(tri.points).toMatch(/^[\d.,-]+\s[\d.,-]+\s[\d.,-]+$/);
			expect(tri.color).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it('width and height match expected proportions', () => {
		const result = generateStormCloudTriangles(42, 80);
		expect(result.width).toBe(80);
		expect(result.height).toBeCloseTo(80 * 0.4);
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

describe('generateSpeechBubblePath', () => {
	it('returns valid SVG path string', () => {
		const result = generateSpeechBubblePath(80, 50);
		expect(result.path).toMatch(/^M[\d.,-]+\sL[\s\S]+Z$/);
	});

	it('returns pointer path', () => {
		const result = generateSpeechBubblePath(80, 50);
		expect(result.pointerPath).toMatch(/^M[\d.,\s-]+L[\d.,\s-]+L[\d.,\s-]+Z$/);
	});

	it('dimensions match input', () => {
		const result = generateSpeechBubblePath(100, 60);
		expect(result.width).toBe(100);
		expect(result.height).toBe(60);
	});
});
