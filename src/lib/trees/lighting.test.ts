import { describe, it, expect } from 'vitest';
import { computeCanopyColor } from './lighting.js';
import { hexToHsl } from './color.js';
import type { Point2D } from './types.js';

type TrianglePoints = readonly [Point2D, Point2D, Point2D];

const oakConfig = {
	lightAngle: 130,
	canopyLightColor: '#a8d84e',
	canopyDarkColor: '#1a472a',
	trunkHue: 25,
	trunkSaturation: 50,
	trunkLightness: 25,
	depthVariance: 1.0,
} as const;

const BOUNDS = { minX: 0, minY: 0, maxX: 100, maxY: 100 };

const CENTER_TRI: TrianglePoints = [
	{ x: 50, y: 50 },
	{ x: 60, y: 50 },
	{ x: 55, y: 60 },
];

describe('computeCanopyColor — two-color interpolation', () => {
	it('is deterministic for the same triangle + config (REQ-L-01)', () => {
		const a = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig);
		const b = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig);
		expect(a).toBe(b);
	});

	it('returns a valid 6-digit hex color', () => {
		const color = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig);
		expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('outputs a lightness between the dark and light config colors (REQ-L-07)', () => {
		const darkHsl = hexToHsl(oakConfig.canopyDarkColor);
		const lightHsl = hexToHsl(oakConfig.canopyLightColor);
		// Sample triangles at varying positions within the canopy bounds
		const samples: readonly TrianglePoints[] = [
			[
				{ x: 10, y: 10 },
				{ x: 15, y: 10 },
				{ x: 12, y: 15 },
			],
			[
				{ x: 50, y: 50 },
				{ x: 55, y: 50 },
				{ x: 52, y: 55 },
			],
			[
				{ x: 90, y: 90 },
				{ x: 95, y: 90 },
				{ x: 92, y: 95 },
			],
		];
		for (const t of samples) {
			const hsl = hexToHsl(computeCanopyColor(t, BOUNDS, oakConfig));
			expect(hsl.l).toBeGreaterThanOrEqual(darkHsl.l - 1);
			expect(hsl.l).toBeLessThanOrEqual(lightHsl.l + 1);
		}
	});

	it('swapping canopyLightColor shifts the output color', () => {
		const green = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig);
		const orange = computeCanopyColor(CENTER_TRI, BOUNDS, {
			...oakConfig,
			canopyLightColor: '#e8a028',
			canopyDarkColor: '#8b2010',
		});
		expect(green).not.toBe(orange);
	});

	it('depthVariance=0 still produces a valid canopy color at the bounds center', () => {
		// With depthVariance=0, the hemisphere z-component collapses to 0, so
		// lighting is driven only by in-plane normals. The pipeline must still
		// produce a well-formed hex color — the math should not NaN out.
		const flat = { ...oakConfig, depthVariance: 0 };
		const center: TrianglePoints = [
			{ x: 49, y: 49 },
			{ x: 51, y: 49 },
			{ x: 50, y: 51 },
		];
		const color = computeCanopyColor(center, BOUNDS, flat);
		expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});
});
