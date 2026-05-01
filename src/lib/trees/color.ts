/**
 * Hex/HSL color utilities used by the canopy lighting pipeline and the
 * preset swatch UI. HSL channel ranges follow the CSS convention:
 *   h ∈ [0, 360) degrees
 *   s ∈ [0, 100] percent
 *   l ∈ [0, 100] percent
 *
 * Hex inputs are the 6-digit `#rrggbb` form (uppercase or lowercase).
 * Hex outputs are always lowercase.
 */

import { lerp } from './math.js';

export interface HslColor {
	readonly h: number;
	readonly s: number;
	readonly l: number;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function normalizeHue(hue: number): number {
	return ((hue % 360) + 360) % 360;
}

interface Rgb {
	readonly r: number;
	readonly g: number;
	readonly b: number;
}

function parseHexToRgb(hex: string): Rgb {
	const match = /^#([0-9a-f]{6})$/i.exec(hex);
	if (!match) {
		throw new Error(`Invalid hex color: ${hex}`);
	}
	const digits = match[1]!;
	return {
		r: parseInt(digits.slice(0, 2), 16) / 255,
		g: parseInt(digits.slice(2, 4), 16) / 255,
		b: parseInt(digits.slice(4, 6), 16) / 255,
	};
}

/**
 * Parse a `#rrggbb` hex string into HSL. Throws on malformed input.
 */
export function hexToHsl(hex: string): HslColor {
	const { r, g, b } = parseHexToRgb(hex);

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	const l = (max + min) / 2;

	let h = 0;
	let s = 0;
	if (delta > 0) {
		s = delta / (1 - Math.abs(2 * l - 1));
		if (max === r) {
			h = ((g - b) / delta) % 6;
		} else if (max === g) {
			h = (b - r) / delta + 2;
		} else {
			h = (r - g) / delta + 4;
		}
		h *= 60;
		if (h < 0) {
			h += 360;
		}
	}

	return {
		h: Math.round(h * 10) / 10,
		s: Math.round(s * 1000) / 10,
		l: Math.round(l * 1000) / 10,
	};
}

/**
 * Format an HSL triplet as a `#rrggbb` hex string. Hue wraps; s/l clamp.
 */
export function hslToHex(h: number, s: number, l: number): string {
	const hue = normalizeHue(h);
	const sat = clamp(s, 0, 100) / 100;
	const light = clamp(l, 0, 100) / 100;

	const c = (1 - Math.abs(2 * light - 1)) * sat;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = light - c / 2;

	let r: number;
	let g: number;
	let b: number;
	if (hue < 60) {
		[r, g, b] = [c, x, 0];
	} else if (hue < 120) {
		[r, g, b] = [x, c, 0];
	} else if (hue < 180) {
		[r, g, b] = [0, c, x];
	} else if (hue < 240) {
		[r, g, b] = [0, x, c];
	} else if (hue < 300) {
		[r, g, b] = [x, 0, c];
	} else {
		[r, g, b] = [c, 0, x];
	}

	const toHex = (value: number): string =>
		Math.round((value + m) * 255)
			.toString(16)
			.padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Interpolate hue via the shortest arc on the color wheel. Handles the
 * 0°/360° wrap so that pairs like (350°, 10°) cross through 0° rather
 * than through 180°.
 */
function lerpHue(from: number, to: number, t: number): number {
	const diff = to - from;
	let shortest = diff;
	if (diff > 180) {
		shortest = diff - 360;
	} else if (diff < -180) {
		shortest = diff + 360;
	}
	return normalizeHue(from + shortest * t);
}

/**
 * Compute W3C relative luminance from a `#rrggbb` hex string.
 * Linearizes sRGB channels then applies the ITU-R BT.709 coefficients.
 */
export function relativeLuminance(hex: string): number {
	const { r, g, b } = parseHexToRgb(hex);

	const linearize = (channel: number): number =>
		channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

	return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Return `'#000000'` (dark text) for light backgrounds, `'#ffffff'` (light
 * text) for dark backgrounds. Uses the W3C 0.179 luminance threshold.
 */
export function contrastTextColor(backgroundHex: string): string {
	return relativeLuminance(backgroundHex) > 0.179 ? '#000000' : '#ffffff';
}

/**
 * Interpolate between two hex colors in HSL space and return a new hex.
 * `t = 0` → `darkHex`; `t = 1` → `lightHex`. Hue uses shortest-arc
 * interpolation; saturation and lightness are linear. Used by the canopy
 * lighting pipeline to map a 0..1 lighting factor to a color along the
 * user-chosen dark→light gradient (REQ-L-01, REQ-L-07).
 */
export function interpolateHslInHexSpace(darkHex: string, lightHex: string, t: number): string {
	const clamped = clamp(t, 0, 1);
	if (clamped === 0) {
		return darkHex.toLowerCase();
	}
	if (clamped === 1) {
		return lightHex.toLowerCase();
	}
	const dark = hexToHsl(darkHex);
	const light = hexToHsl(lightHex);
	const h = lerpHue(dark.h, light.h, clamped);
	const s = lerp(dark.s, light.s, clamped);
	const l = lerp(dark.l, light.l, clamped);
	return hslToHex(h, s, l);
}
