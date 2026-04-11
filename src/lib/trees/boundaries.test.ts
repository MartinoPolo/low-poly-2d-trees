import { describe, it, expect } from 'vitest';
import { BOUNDARIES, BOUNDARY_KINDS, circleBoundary, teardropBoundary } from './boundaries.js';
import { createPrng } from './prng.js';

describe('boundaries — registry', () => {
	it('exposes circle and teardrop boundary kinds', () => {
		expect(BOUNDARY_KINDS.circle).toBe('circle');
		expect(BOUNDARY_KINDS.teardrop).toBe('teardrop');
	});

	it('BOUNDARIES maps every kind to the correct shape impl', () => {
		expect(BOUNDARIES[BOUNDARY_KINDS.circle]).toBe(circleBoundary);
		expect(BOUNDARIES[BOUNDARY_KINDS.teardrop]).toBe(teardropBoundary);
	});

	it('circle boundary kind is circle', () => {
		expect(circleBoundary.kind).toBe(BOUNDARY_KINDS.circle);
	});

	it('teardrop boundary kind is teardrop', () => {
		expect(teardropBoundary.kind).toBe(BOUNDARY_KINDS.teardrop);
	});
});

describe('circleBoundary.contains', () => {
	const cx = 50;
	const cy = 60;
	const rx = 20;
	const ry = 10;

	it('returns true at the center', () => {
		expect(circleBoundary.contains(cx, cy, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns true at (cx+rx-epsilon, cy)', () => {
		expect(circleBoundary.contains(cx + rx - 0.01, cy, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns false outside the ellipse bounding box', () => {
		expect(circleBoundary.contains(cx + rx + 1, cy, cx, cy, rx, ry, 0)).toBe(false);
		expect(circleBoundary.contains(cx, cy + ry + 1, cx, cy, rx, ry, 0)).toBe(false);
	});

	it('matches the inlined ellipse formula on random probes', () => {
		const rng = createPrng(99);
		for (let i = 0; i < 200; i++) {
			const px = cx - rx * 2 + rng() * rx * 4;
			const py = cy - ry * 2 + rng() * ry * 4;
			const dx = (px - cx) / rx;
			const dy = (py - cy) / ry;
			const expected = dx * dx + dy * dy <= 1;
			expect(circleBoundary.contains(px, py, cx, cy, rx, ry, 0)).toBe(expected);
		}
	});
});

describe('teardropBoundary.contains', () => {
	const cx = 100;
	const cy = 150;
	const rx = 30;
	const ry = 40;

	it('returns true at the center', () => {
		expect(teardropBoundary.contains(cx, cy, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns true near the round bottom (cx, cy + 0.99*ry)', () => {
		expect(teardropBoundary.contains(cx, cy + 0.99 * ry, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns true just inside the pointy top (cx, cy - 0.99*ry)', () => {
		expect(teardropBoundary.contains(cx, cy - 0.99 * ry, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns false outside the pinched top (cx + rx/2, cy - 0.9*ry)', () => {
		expect(teardropBoundary.contains(cx + rx / 2, cy - 0.9 * ry, cx, cy, rx, ry, 0)).toBe(
			false,
		);
	});

	it('returns false outside the bounding box vertically', () => {
		expect(teardropBoundary.contains(cx, cy - ry * 1.1, cx, cy, rx, ry, 0)).toBe(false);
		expect(teardropBoundary.contains(cx, cy + ry * 1.1, cx, cy, rx, ry, 0)).toBe(false);
	});

	it('rotation=90°: the unrotated (cx, cy - ry + epsilon) maps to (cx + ry - epsilon, cy)', () => {
		// With 90° rotation, the pointy top (which was at negative y) rotates to the
		// positive x direction. A point slightly inside the pointy top — unrotated
		// at (cx, cy - 0.99*ry) — must therefore be inside after rotation when
		// queried at the corresponding rotated location.
		const epsilon = 0.99;
		// Apply the 90° CCW rotation to (0, -epsilon*ry): (x', y') = (epsilon*ry, 0)
		const rotatedPx = cx + epsilon * ry;
		const rotatedPy = cy;
		expect(teardropBoundary.contains(rotatedPx, rotatedPy, cx, cy, rx, ry, 90)).toBe(true);
	});

	it('rotation=180°: the unrotated round bottom moves to the top', () => {
		const epsilon = 0.99;
		// The round bottom at (cx, cy + epsilon*ry) rotates to (cx, cy - epsilon*ry).
		expect(teardropBoundary.contains(cx, cy - epsilon * ry, cx, cy, rx, ry, 180)).toBe(true);
	});
});

describe('teardropBoundary.sample', () => {
	const cx = 80;
	const cy = 120;
	const rx = 25;
	const ry = 50;

	it('returns the requested number of points', () => {
		const rng = createPrng(7);
		const pts = teardropBoundary.sample(cx, cy, rx, ry, 24, rng, 0);
		expect(pts).toHaveLength(24);
	});

	it('every sampled point lies inside the teardrop (within small epsilon)', () => {
		const rng = createPrng(11);
		const pts = teardropBoundary.sample(cx, cy, rx, ry, 32, rng, 0);
		for (const p of pts) {
			expect(teardropBoundary.contains(p.x, p.y, cx, cy, rx, ry, 0)).toBe(true);
		}
	});

	it('is deterministic under the same seeded rng', () => {
		const ptsA = teardropBoundary.sample(cx, cy, rx, ry, 16, createPrng(42), 0);
		const ptsB = teardropBoundary.sample(cx, cy, rx, ry, 16, createPrng(42), 0);
		expect(ptsA).toEqual(ptsB);
	});
});

describe('circleBoundary.sample', () => {
	const cx = 60;
	const cy = 70;
	const rx = 15;
	const ry = 20;

	it('returns the requested number of points', () => {
		const pts = circleBoundary.sample(cx, cy, rx, ry, 20, createPrng(2), 0);
		expect(pts).toHaveLength(20);
	});

	it('is deterministic under the same seeded rng', () => {
		const a = circleBoundary.sample(cx, cy, rx, ry, 20, createPrng(3), 0);
		const b = circleBoundary.sample(cx, cy, rx, ry, 20, createPrng(3), 0);
		expect(a).toEqual(b);
	});
});
