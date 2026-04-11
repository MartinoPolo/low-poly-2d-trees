import { describe, it, expect } from 'vitest';
import { hexToHsl, hslToHex, interpolateHslInHexSpace } from './color.js';

// Round-trip tolerance in HSL channel units. Converting hex -> HSL -> hex
// is lossy at the edges due to integer rounding on 0..255 channels, so
// allow a small drift when comparing hue/saturation/lightness round-trips.
const HSL_TOLERANCE = 1;

function expectHslClose(
	actual: { h: number; s: number; l: number },
	expected: { h: number; s: number; l: number },
	tolerance = HSL_TOLERANCE,
): void {
	expect(Math.abs(actual.h - expected.h)).toBeLessThanOrEqual(tolerance);
	expect(Math.abs(actual.s - expected.s)).toBeLessThanOrEqual(tolerance);
	expect(Math.abs(actual.l - expected.l)).toBeLessThanOrEqual(tolerance);
}

describe('color: hexToHsl', () => {
	it('parses pure red', () => {
		expectHslClose(hexToHsl('#ff0000'), { h: 0, s: 100, l: 50 });
	});

	it('parses pure green', () => {
		expectHslClose(hexToHsl('#00ff00'), { h: 120, s: 100, l: 50 });
	});

	it('parses pure blue', () => {
		expectHslClose(hexToHsl('#0000ff'), { h: 240, s: 100, l: 50 });
	});

	it('parses white', () => {
		const hsl = hexToHsl('#ffffff');
		expect(hsl.l).toBe(100);
		expect(hsl.s).toBe(0);
	});

	it('parses black', () => {
		const hsl = hexToHsl('#000000');
		expect(hsl.l).toBe(0);
		expect(hsl.s).toBe(0);
	});

	it('parses gray', () => {
		const hsl = hexToHsl('#808080');
		expect(hsl.s).toBe(0);
		expect(hsl.l).toBeGreaterThan(45);
		expect(hsl.l).toBeLessThan(55);
	});

	it('accepts uppercase hex', () => {
		expectHslClose(hexToHsl('#FF0000'), { h: 0, s: 100, l: 50 });
	});

	it('parses the oak canopy light default', () => {
		// #a8d84e is a yellow-green; hue should be in the green band
		const hsl = hexToHsl('#a8d84e');
		expect(hsl.h).toBeGreaterThan(60);
		expect(hsl.h).toBeLessThan(90);
		expect(hsl.s).toBeGreaterThan(40);
	});
});

describe('color: hslToHex', () => {
	it('formats pure red', () => {
		expect(hslToHex(0, 100, 50)).toBe('#ff0000');
	});

	it('formats pure green', () => {
		expect(hslToHex(120, 100, 50)).toBe('#00ff00');
	});

	it('formats pure blue', () => {
		expect(hslToHex(240, 100, 50)).toBe('#0000ff');
	});

	it('formats white', () => {
		expect(hslToHex(0, 0, 100)).toBe('#ffffff');
	});

	it('formats black', () => {
		expect(hslToHex(0, 0, 0)).toBe('#000000');
	});

	it('wraps hue beyond 360', () => {
		expect(hslToHex(360, 100, 50)).toBe('#ff0000');
		expect(hslToHex(480, 100, 50)).toBe('#00ff00');
	});

	it('clamps saturation and lightness', () => {
		expect(hslToHex(0, 150, 50)).toBe('#ff0000');
		expect(hslToHex(0, -10, 50)).toBe('#808080');
	});
});

describe('color: hex/HSL round-trip', () => {
	const cases = ['#a8d84e', '#1a472a', '#4a9e5c', '#e8a028', '#8b2010', '#7cc45a'];
	for (const hex of cases) {
		it(`round-trips ${hex}`, () => {
			const hsl = hexToHsl(hex);
			const back = hslToHex(hsl.h, hsl.s, hsl.l);
			// Round-trip is lossy at 1 unit per channel
			const originalR = parseInt(hex.slice(1, 3), 16);
			const originalG = parseInt(hex.slice(3, 5), 16);
			const originalB = parseInt(hex.slice(5, 7), 16);
			const backR = parseInt(back.slice(1, 3), 16);
			const backG = parseInt(back.slice(3, 5), 16);
			const backB = parseInt(back.slice(5, 7), 16);
			expect(Math.abs(backR - originalR)).toBeLessThanOrEqual(2);
			expect(Math.abs(backG - originalG)).toBeLessThanOrEqual(2);
			expect(Math.abs(backB - originalB)).toBeLessThanOrEqual(2);
		});
	}
});

describe('color: interpolateHslInHexSpace', () => {
	const dark = '#1a472a';
	const light = '#a8d84e';

	it('returns dark color at t=0', () => {
		expect(interpolateHslInHexSpace(dark, light, 0)).toBe(dark);
	});

	it('returns light color at t=1', () => {
		expect(interpolateHslInHexSpace(dark, light, 1)).toBe(light);
	});

	it('clamps t below 0 to dark', () => {
		expect(interpolateHslInHexSpace(dark, light, -0.5)).toBe(dark);
	});

	it('clamps t above 1 to light', () => {
		expect(interpolateHslInHexSpace(dark, light, 1.5)).toBe(light);
	});

	it('midpoint has HSL values between dark and light', () => {
		const darkHsl = hexToHsl(dark);
		const lightHsl = hexToHsl(light);
		const midHex = interpolateHslInHexSpace(dark, light, 0.5);
		const midHsl = hexToHsl(midHex);
		expect(midHsl.l).toBeGreaterThan(Math.min(darkHsl.l, lightHsl.l));
		expect(midHsl.l).toBeLessThan(Math.max(darkHsl.l, lightHsl.l));
		expect(midHsl.s).toBeGreaterThan(Math.min(darkHsl.s, lightHsl.s) - 1);
		expect(midHsl.s).toBeLessThan(Math.max(darkHsl.s, lightHsl.s) + 1);
	});

	it('lightness rises monotonically with t from dark to light', () => {
		const steps = [0, 0.2, 0.4, 0.6, 0.8, 1];
		const lightnesses = steps.map((t) => hexToHsl(interpolateHslInHexSpace(dark, light, t)).l);
		for (let i = 1; i < lightnesses.length; i += 1) {
			expect(lightnesses[i]!).toBeGreaterThanOrEqual(lightnesses[i - 1]! - 0.5);
		}
		expect(lightnesses.at(-1)! - lightnesses[0]!).toBeGreaterThan(10);
	});

	it('uses shortest-arc hue interpolation across the 0°/360° wrap', () => {
		// #ff0033 ≈ h=348, #ff3300 ≈ h=12 — shortest arc is through 0, ~24° total
		// Midpoint should land near hue 0 (red), not near hue 180 (cyan)
		const wrapDark = '#ff0033';
		const wrapLight = '#ff3300';
		const mid = interpolateHslInHexSpace(wrapDark, wrapLight, 0.5);
		const midHsl = hexToHsl(mid);
		// Hue distance from 0 (shortest-arc result) must be much smaller than
		// distance from 180 (long-arc, numerically-averaged result)
		const distFromRed = Math.min(midHsl.h, 360 - midHsl.h);
		const distFromCyan = Math.abs(midHsl.h - 180);
		expect(distFromRed).toBeLessThan(distFromCyan);
		expect(distFromRed).toBeLessThan(30);
	});

	it('is deterministic', () => {
		const a = interpolateHslInHexSpace(dark, light, 0.37);
		const b = interpolateHslInHexSpace(dark, light, 0.37);
		expect(a).toBe(b);
	});
});
