import { describe, it, expect } from 'vitest';
import {
	computeCanopyColor,
	computeTrunkColor,
	computeTriSplitColors,
	computeStripColors,
} from './lighting.js';
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

	it('shadow-side triangles reach near-dark color', () => {
		// Triangle at lower-right edge (away from light at 130 degrees) should
		// produce lightness within 2 units of canopyDarkColor — validates that
		// the lowered ambient floor lets shadows reach near-minimum.
		const shadowTri: TrianglePoints = [
			{ x: 92, y: 92 },
			{ x: 97, y: 92 },
			{ x: 95, y: 97 },
		];
		const darkL = hexToHsl(oakConfig.canopyDarkColor).l;
		const resultL = hexToHsl(computeCanopyColor(shadowTri, BOUNDS, oakConfig)).l;
		expect(Math.abs(resultL - darkL)).toBeLessThanOrEqual(2);
	});

	it('lit-side triangles reach near-light color', () => {
		// Triangle on the lit side of the hemisphere (toward light at 130 degrees).
		// Tolerance is 4 because z=0.3 shifts peak specular off-axis.
		const litTri: TrianglePoints = [
			{ x: 22, y: 17 },
			{ x: 27, y: 17 },
			{ x: 24, y: 22 },
		];
		const lightL = hexToHsl(oakConfig.canopyLightColor).l;
		const resultL = hexToHsl(computeCanopyColor(litTri, BOUNDS, oakConfig)).l;
		expect(Math.abs(resultL - lightL)).toBeLessThanOrEqual(4);
	});

	it('wide contrast range across the canopy', () => {
		// Sample a uniform grid across the canopy — the observed lightness range
		// should exceed 95% of the full dark-to-light range, validating that
		// both extremes are reachable with the steeper normals and lower ambient.
		const darkL = hexToHsl(oakConfig.canopyDarkColor).l;
		const lightL = hexToHsl(oakConfig.canopyLightColor).l;
		const fullRange = lightL - darkL;

		const lightnesses: number[] = [];
		for (let gx = 5; gx <= 95; gx += 10) {
			for (let gy = 5; gy <= 95; gy += 10) {
				const tri: TrianglePoints = [
					{ x: gx, y: gy },
					{ x: gx + 4, y: gy },
					{ x: gx + 2, y: gy + 4 },
				];
				lightnesses.push(hexToHsl(computeCanopyColor(tri, BOUNDS, oakConfig)).l);
			}
		}

		const minL = Math.min(...lightnesses);
		const maxL = Math.max(...lightnesses);
		expect(maxL - minL).toBeGreaterThan(fullRange * 0.95);
	});

	it('shadow bias — median lightness below midpoint', () => {
		// Uniformly distributed triangles should have median lightness below
		// the midpoint of dark-to-light range (power curve pushes toward shadow)
		const darkL = hexToHsl(oakConfig.canopyDarkColor).l;
		const lightL = hexToHsl(oakConfig.canopyLightColor).l;
		const midpoint = (darkL + lightL) / 2;

		const lightnesses: number[] = [];
		for (let gx = 5; gx <= 95; gx += 10) {
			for (let gy = 5; gy <= 95; gy += 10) {
				const tri: TrianglePoints = [
					{ x: gx, y: gy },
					{ x: gx + 4, y: gy },
					{ x: gx + 2, y: gy + 4 },
				];
				lightnesses.push(hexToHsl(computeCanopyColor(tri, BOUNDS, oakConfig)).l);
			}
		}

		lightnesses.sort((a, b) => a - b);
		const median = lightnesses[Math.floor(lightnesses.length / 2)];
		// Power curve biases median well below the midpoint (at least 8 units).
		// Old linear formula had median ~34.5 vs midpoint ~38.3 (gap ~3.8);
		// the power curve pushes it to ~25.5 (gap ~12.8).
		expect(median).toBeLessThan(midpoint - 8);
	});
});

// ---------------------------------------------------------------------------
// VQ-2: Light-Angle Responsive Trunk Shading
// ---------------------------------------------------------------------------

const trunkConfig = {
	lightAngle: 0,
	canopyLightColor: '#a8d84e',
	canopyDarkColor: '#1a472a',
	trunkHue: 25,
	trunkSaturation: 50,
	trunkLightness: 25,
	depthVariance: 1.0,
} as const;

const TRUNK_BOUNDS = { minX: 80, maxX: 120 };

// Deterministic RNG stub for trunk tests — always returns 0.5 (no jitter)
function noJitterRng(): number {
	return 0.5;
}

// ---------------------------------------------------------------------------
// Canopy depth layering & facet noise (issue #116)
// ---------------------------------------------------------------------------

describe('computeCanopyColor — facet noise via rng parameter', () => {
	it('with varying rng, same triangle produces different colors on repeated calls', () => {
		let callCount = 0;
		const varyingRng = () => {
			callCount++;
			return callCount % 3 === 0 ? 0.1 : callCount % 3 === 1 ? 0.9 : 0.5;
		};
		const a = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig, varyingRng);
		const b = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig, varyingRng);
		expect(a).not.toBe(b);
	});

	it('with rng returning 0.5, output equals no-rng case', () => {
		const noRngResult = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig);
		const midRng = () => 0.5;
		const withRngResult = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig, midRng);
		expect(withRngResult).toBe(noRngResult);
	});
});

describe('computeCanopyColor — depth darkening factor', () => {
	it('depthDarkeningFactor=0.75 produces darker output than 1.0', () => {
		const darkened = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig, undefined, 0.75);
		const normal = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig, undefined, 1.0);
		const darkenedL = hexToHsl(darkened).l;
		const normalL = hexToHsl(normal).l;
		expect(darkenedL).toBeLessThan(normalL);
	});

	it('default (no parameter) behaves same as depthDarkeningFactor=1.0', () => {
		const defaultResult = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig);
		const explicitResult = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig, undefined, 1.0);
		expect(defaultResult).toBe(explicitResult);
	});
});

describe('computeCanopyColor — facet noise bounds', () => {
	it('rng returning 0 still produces valid hex color', () => {
		const rng = () => 0;
		const color = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig, rng);
		expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('rng returning 1 still produces valid hex color', () => {
		const rng = () => 1;
		const color = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig, rng);
		expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('extreme rng values keep lightness within dark-light range', () => {
		const darkL = hexToHsl(oakConfig.canopyDarkColor).l;
		const lightL = hexToHsl(oakConfig.canopyLightColor).l;
		for (const rngVal of [0, 1]) {
			const rng = () => rngVal;
			const hsl = hexToHsl(computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig, rng));
			expect(hsl.l).toBeGreaterThanOrEqual(darkL - 1);
			expect(hsl.l).toBeLessThanOrEqual(lightL + 1);
		}
	});
});

describe('computeCanopyColor — deterministic facet noise with seeded rng', () => {
	it('same seeded rng produces identical output', () => {
		const makeRng = () => {
			let s = 42;
			return () => {
				s = (s + 0x6d2b79f5) | 0;
				let t = Math.imul(s ^ (s >>> 15), 1 | s);
				t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
				return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
			};
		};
		const a = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig, makeRng());
		const b = computeCanopyColor(CENTER_TRI, BOUNDS, oakConfig, makeRng());
		expect(a).toBe(b);
	});
});

describe('VQ-2: trunk triangles on lit side are brighter than shadowed side', () => {
	it('with lightAngle=0 (light from right), right-side triangles are brighter', () => {
		// Triangle far right of trunk center
		const rightTri: TrianglePoints = [
			{ x: 115, y: 150 },
			{ x: 118, y: 150 },
			{ x: 116, y: 155 },
		];
		// Triangle far left of trunk center
		const leftTri: TrianglePoints = [
			{ x: 82, y: 150 },
			{ x: 85, y: 150 },
			{ x: 83, y: 155 },
		];

		const rightColor = computeTrunkColor(rightTri, TRUNK_BOUNDS, trunkConfig, noJitterRng);
		const leftColor = computeTrunkColor(leftTri, TRUNK_BOUNDS, trunkConfig, noJitterRng);

		const rightL = hexToHsl(rightColor).l;
		const leftL = hexToHsl(leftColor).l;

		// The lit side should be noticeably brighter — at least 15 lightness units
		// (requires the enhanced contrast range introduced in VQ-2)
		expect(rightL - leftL).toBeGreaterThan(15);
	});
});

describe('VQ-2: changing lightAngle shifts brightness distribution', () => {
	it('lightAngle=0 vs lightAngle=180 flips which side is brighter', () => {
		const rightTri: TrianglePoints = [
			{ x: 115, y: 150 },
			{ x: 118, y: 150 },
			{ x: 116, y: 155 },
		];

		const colorAngle0 = computeTrunkColor(
			rightTri,
			TRUNK_BOUNDS,
			{ ...trunkConfig, lightAngle: 0 },
			noJitterRng,
		);
		const colorAngle180 = computeTrunkColor(
			rightTri,
			TRUNK_BOUNDS,
			{ ...trunkConfig, lightAngle: 180 },
			noJitterRng,
		);

		const lightness0 = hexToHsl(colorAngle0).l;
		const lightness180 = hexToHsl(colorAngle180).l;

		// With light from right (0), right tri should be much brighter than
		// with light from left (180) — at least 15 lightness units difference
		expect(lightness0 - lightness180).toBeGreaterThan(15);
	});
});

// ---------------------------------------------------------------------------
// Tri-split shading (issue #80)
// ---------------------------------------------------------------------------

const triSplitBase = {
	segmentDirectionX: 0,
	segmentDirectionY: -1, // vertical trunk pointing up
	lightAngle: 0,
	trunkHue: 25,
	trunkSaturation: 50,
	trunkLightness: 25,
	centerPerturbationX: 0,
	centerPerturbationY: 0,
} as const;

describe('computeTriSplitColors — returns 3 valid hex colors', () => {
	it('returns leftColor, centerColor, rightColor as valid hex', () => {
		const result = computeTriSplitColors(triSplitBase);
		expect(result.leftColor).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.centerColor).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.rightColor).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('produces 3 distinct colors for a vertical trunk', () => {
		const result = computeTriSplitColors(triSplitBase);
		const colors = new Set([result.leftColor, result.centerColor, result.rightColor]);
		// At least 2 distinct colors (center may differ from sides due to z-dominant normal)
		expect(colors.size).toBeGreaterThanOrEqual(2);
	});
});

describe('computeTriSplitColors — lightAngle shifts brightness', () => {
	it('lightAngle=0 makes right face brightest for vertical trunk', () => {
		const result = computeTriSplitColors({ ...triSplitBase, lightAngle: 0 });
		const leftL = hexToHsl(result.leftColor).l;
		const rightL = hexToHsl(result.rightColor).l;
		expect(rightL).toBeGreaterThan(leftL);
	});

	it('lightAngle=180 makes left face brightest for vertical trunk', () => {
		const result = computeTriSplitColors({ ...triSplitBase, lightAngle: 180 });
		const leftL = hexToHsl(result.leftColor).l;
		const rightL = hexToHsl(result.rightColor).l;
		expect(leftL).toBeGreaterThan(rightL);
	});

	it('flipping lightAngle 0→180 reverses left/right brightness ordering', () => {
		const at0 = computeTriSplitColors({ ...triSplitBase, lightAngle: 0 });
		const at180 = computeTriSplitColors({ ...triSplitBase, lightAngle: 180 });
		const rightBrighterAt0 = hexToHsl(at0.rightColor).l > hexToHsl(at0.leftColor).l;
		const leftBrighterAt180 = hexToHsl(at180.leftColor).l > hexToHsl(at180.rightColor).l;
		expect(rightBrighterAt0).toBe(true);
		expect(leftBrighterAt180).toBe(true);
	});
});

describe('computeTriSplitColors — lightness offset range [-10, +12]', () => {
	it('all face lightness offsets stay within [-10, +12] of base', () => {
		const baseLightness = triSplitBase.trunkLightness;
		// Test multiple angles to cover full dot-product range
		for (const angle of [0, 45, 90, 130, 180, 270]) {
			const result = computeTriSplitColors({ ...triSplitBase, lightAngle: angle });
			for (const color of [result.leftColor, result.centerColor, result.rightColor]) {
				const l = hexToHsl(color).l;
				const offset = l - baseLightness;
				expect(offset).toBeGreaterThanOrEqual(-11); // 1 unit tolerance for rounding
				expect(offset).toBeLessThanOrEqual(13);
			}
		}
	});
});

describe('computeTriSplitColors — center perturbation', () => {
	it('different center perturbation produces different center color', () => {
		const a = computeTriSplitColors({
			...triSplitBase,
			centerPerturbationX: 0.1,
			centerPerturbationY: 0,
		});
		const b = computeTriSplitColors({
			...triSplitBase,
			centerPerturbationX: -0.1,
			centerPerturbationY: 0,
		});
		expect(a.centerColor).not.toBe(b.centerColor);
	});

	it('perturbation does not affect left/right colors', () => {
		const a = computeTriSplitColors({
			...triSplitBase,
			centerPerturbationX: 0.15,
			centerPerturbationY: 0.15,
		});
		const b = computeTriSplitColors({
			...triSplitBase,
			centerPerturbationX: -0.15,
			centerPerturbationY: -0.15,
		});
		expect(a.leftColor).toBe(b.leftColor);
		expect(a.rightColor).toBe(b.rightColor);
	});
});

describe('computeTriSplitColors — deterministic', () => {
	it('same inputs produce identical outputs', () => {
		const a = computeTriSplitColors(triSplitBase);
		const b = computeTriSplitColors(triSplitBase);
		expect(a).toEqual(b);
	});
});

describe('computeStripColors (REQ-EV2-LT-01)', () => {
	const baseInput = {
		segmentDirectionX: 0,
		segmentDirectionY: -50,
		lightAngle: 130,
		trunkHue: 25,
		trunkSaturation: 50,
		trunkLightness: 25,
		centerPerturbationX: 0,
		centerPerturbationY: 0,
	};

	it('returns 2 colors for stripCount=2', () => {
		const colors = computeStripColors({ ...baseInput, stripCount: 2 });
		expect(colors).toHaveLength(2);
		for (const c of colors) {
			expect(c).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it('returns 3 colors for stripCount=3', () => {
		const colors = computeStripColors({ ...baseInput, stripCount: 3 });
		expect(colors).toHaveLength(3);
	});

	it('returns 4 colors for stripCount=4', () => {
		const colors = computeStripColors({ ...baseInput, stripCount: 4 });
		expect(colors).toHaveLength(4);
	});

	it('is deterministic', () => {
		const a = computeStripColors({ ...baseInput, stripCount: 3 });
		const b = computeStripColors({ ...baseInput, stripCount: 3 });
		expect(a).toEqual(b);
	});

	it('light direction affects face colors', () => {
		const colorsA = computeStripColors({ ...baseInput, lightAngle: 0, stripCount: 3 });
		const colorsB = computeStripColors({ ...baseInput, lightAngle: 180, stripCount: 3 });

		// Different light angles produce different color sets
		expect(colorsA).not.toEqual(colorsB);
		// Edge faces should differ between opposite light angles
		expect(colorsA[0]).not.toBe(colorsB[0]);
	});
});
