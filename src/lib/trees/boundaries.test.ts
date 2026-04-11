import { describe, it, expect } from 'vitest';
import {
	BOUNDARIES,
	BOUNDARY_KINDS,
	circleBoundary,
	teardropBoundary,
	eggBoundary,
	equilateralTriangleBoundary,
	isoscelesTriangleBoundary,
} from './boundaries.js';
import { createPrng } from './prng.js';

describe('boundaries — registry', () => {
	it('exposes circle and teardrop boundary kinds', () => {
		expect(BOUNDARY_KINDS.circle).toBe('circle');
		expect(BOUNDARY_KINDS.teardrop).toBe('teardrop');
	});

	it('exposes egg and triangle boundary kinds (issue #10)', () => {
		expect(BOUNDARY_KINDS.egg).toBe('egg');
		expect(BOUNDARY_KINDS.isoscelesTriangle).toBe('isoscelesTriangle');
		expect(BOUNDARY_KINDS.equilateralTriangle).toBe('equilateralTriangle');
	});

	it('BOUNDARIES maps every kind to the correct shape impl', () => {
		expect(BOUNDARIES[BOUNDARY_KINDS.circle]).toBe(circleBoundary);
		expect(BOUNDARIES[BOUNDARY_KINDS.teardrop]).toBe(teardropBoundary);
		expect(BOUNDARIES[BOUNDARY_KINDS.egg]).toBe(eggBoundary);
		expect(BOUNDARIES[BOUNDARY_KINDS.equilateralTriangle]).toBe(equilateralTriangleBoundary);
		expect(BOUNDARIES[BOUNDARY_KINDS.isoscelesTriangle]).toBe(isoscelesTriangleBoundary);
	});

	it('circle boundary kind is circle', () => {
		expect(circleBoundary.kind).toBe(BOUNDARY_KINDS.circle);
	});

	it('teardrop boundary kind is teardrop', () => {
		expect(teardropBoundary.kind).toBe(BOUNDARY_KINDS.teardrop);
	});

	it('new boundary shapes have matching kinds', () => {
		expect(eggBoundary.kind).toBe(BOUNDARY_KINDS.egg);
		expect(equilateralTriangleBoundary.kind).toBe(BOUNDARY_KINDS.equilateralTriangle);
		expect(isoscelesTriangleBoundary.kind).toBe(BOUNDARY_KINDS.isoscelesTriangle);
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

// ============================================================================
// Issue #10: egg boundary
// ============================================================================

describe('eggBoundary.contains', () => {
	const cx = 100;
	const cy = 150;
	const rx = 30;
	const ry = 40;

	it('returns true at the center', () => {
		expect(eggBoundary.contains(cx, cy, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns true near the round bottom (cx, cy + 0.99*ry)', () => {
		expect(eggBoundary.contains(cx, cy + 0.99 * ry, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns true near the smooth top (cx, cy - 0.99*ry) — no sharp point unlike teardrop', () => {
		expect(eggBoundary.contains(cx, cy - 0.99 * ry, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns false above the top (cx, cy - 1.1*ry)', () => {
		expect(eggBoundary.contains(cx, cy - 1.1 * ry, cx, cy, rx, ry, 0)).toBe(false);
	});

	it('returns false below the bottom (cx, cy + 1.1*ry)', () => {
		expect(eggBoundary.contains(cx, cy + 1.1 * ry, cx, cy, rx, ry, 0)).toBe(false);
	});

	it('top half (t = -0.5) has narrower half-width than a plain ellipse (regression guard for α = -0.15)', () => {
		// Ellipse half-width at t = -0.5 is rx·√0.75. Egg top half narrows it
		// by factor (1 - 0.15·0.5) = 0.925. A point at the ellipse's right
		// edge (cx + rx·√0.75, cy - 0.5·ry) is outside the egg; a point at
		// 0.9·rx·√0.75 is inside.
		const tY = cy - 0.5 * ry;
		const ellipseHalfWidth = rx * Math.sqrt(0.75);
		expect(eggBoundary.contains(cx + ellipseHalfWidth * 0.99, tY, cx, cy, rx, ry, 0)).toBe(
			false,
		);
		expect(eggBoundary.contains(cx + ellipseHalfWidth * 0.9, tY, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('bottom half (t = +0.5) has wider half-width than a plain ellipse (regression guard for β = +0.15)', () => {
		// Ellipse half-width at t = 0.5 is rx·√0.75. Egg bottom half widens it
		// by factor (1 + 0.15·0.5) = 1.075. A point at 1.05·rx·√0.75 is
		// inside the egg but would be outside a plain ellipse.
		const tY = cy + 0.5 * ry;
		const ellipseHalfWidth = rx * Math.sqrt(0.75);
		expect(eggBoundary.contains(cx + ellipseHalfWidth * 1.05, tY, cx, cy, rx, ry, 0)).toBe(
			true,
		);
	});

	it('rotation=180°: the unrotated round bottom moves to the top', () => {
		const epsilon = 0.99;
		expect(eggBoundary.contains(cx, cy - epsilon * ry, cx, cy, rx, ry, 180)).toBe(true);
	});
});

describe('eggBoundary.sample', () => {
	const cx = 80;
	const cy = 120;
	const rx = 25;
	const ry = 50;

	it('returns the requested number of points', () => {
		const pts = eggBoundary.sample(cx, cy, rx, ry, 24, createPrng(7), 0);
		expect(pts).toHaveLength(24);
	});

	it('every sampled point lies inside the egg', () => {
		const pts = eggBoundary.sample(cx, cy, rx, ry, 32, createPrng(11), 0);
		for (const p of pts) {
			expect(eggBoundary.contains(p.x, p.y, cx, cy, rx, ry, 0)).toBe(true);
		}
	});

	it('is deterministic under the same seeded rng', () => {
		const a = eggBoundary.sample(cx, cy, rx, ry, 16, createPrng(42), 0);
		const b = eggBoundary.sample(cx, cy, rx, ry, 16, createPrng(42), 0);
		expect(a).toEqual(b);
	});
});

// ============================================================================
// Issue #10: equilateral triangle boundary
// ============================================================================

describe('equilateralTriangleBoundary.contains', () => {
	const cx = 100;
	const cy = 150;
	const rx = 30;
	const ry = 40;
	const sqrt3Over2 = Math.sqrt(3) / 2;

	it('returns true at the centroid (cx, cy)', () => {
		expect(equilateralTriangleBoundary.contains(cx, cy, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns true just inside the apex vertex (cx, cy - 0.99*ry)', () => {
		expect(equilateralTriangleBoundary.contains(cx, cy - 0.99 * ry, cx, cy, rx, ry, 0)).toBe(
			true,
		);
	});

	it('returns true just inside the right base vertex', () => {
		const px = cx + rx * sqrt3Over2 * 0.99;
		const py = cy + ry * 0.5 * 0.99;
		expect(equilateralTriangleBoundary.contains(px, py, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns false above the apex (cx, cy - 1.01*ry)', () => {
		expect(equilateralTriangleBoundary.contains(cx, cy - 1.01 * ry, cx, cy, rx, ry, 0)).toBe(
			false,
		);
	});

	it('returns false just outside the bottom edge (cx, cy + 0.51*ry)', () => {
		expect(equilateralTriangleBoundary.contains(cx, cy + 0.51 * ry, cx, cy, rx, ry, 0)).toBe(
			false,
		);
	});

	it('returns false far to the right (cx + 1.5*rx, cy)', () => {
		expect(equilateralTriangleBoundary.contains(cx + 1.5 * rx, cy, cx, cy, rx, ry, 0)).toBe(
			false,
		);
	});

	it('rotation=180° maps the apex from top to bottom', () => {
		// Unrotated apex is at (cx, cy - ry). Rotated 180° around centroid
		// (cx, cy), the apex moves to (cx, cy + ry). Sampling just inside that
		// new apex should be inside; the original apex position should be
		// outside because the rotated triangle now has a flat edge up top.
		const insideRotatedApex = equilateralTriangleBoundary.contains(
			cx,
			cy + 0.99 * ry,
			cx,
			cy,
			rx,
			ry,
			180,
		);
		expect(insideRotatedApex).toBe(true);
	});
});

describe('equilateralTriangleBoundary.sample', () => {
	const cx = 80;
	const cy = 120;
	const rx = 30;
	const ry = 40;

	it('returns the requested number of points', () => {
		const pts = equilateralTriangleBoundary.sample(cx, cy, rx, ry, 21, createPrng(3), 0);
		expect(pts).toHaveLength(21);
	});

	it('every sampled point lies inside the triangle', () => {
		const pts = equilateralTriangleBoundary.sample(cx, cy, rx, ry, 30, createPrng(5), 0);
		for (const p of pts) {
			expect(equilateralTriangleBoundary.contains(p.x, p.y, cx, cy, rx, ry, 0)).toBe(true);
		}
	});

	it('is deterministic under the same seeded rng', () => {
		const a = equilateralTriangleBoundary.sample(cx, cy, rx, ry, 18, createPrng(9), 0);
		const b = equilateralTriangleBoundary.sample(cx, cy, rx, ry, 18, createPrng(9), 0);
		expect(a).toEqual(b);
	});
});

// ============================================================================
// Issue #10: isosceles triangle boundary
// ============================================================================

describe('isoscelesTriangleBoundary.contains', () => {
	const cx = 100;
	const cy = 150;
	const rx = 30;
	const ry = 40;
	const shiftY = ry * 0.06666666666666667;

	it('returns true at the centroid (cx, cy)', () => {
		expect(isoscelesTriangleBoundary.contains(cx, cy, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns true just inside the apex (shifted up by centroid offset)', () => {
		// Centered apex is at (0, -ry - shiftY) in local space.
		const px = cx;
		const py = cy - ry - shiftY + 0.5; // just inside
		expect(isoscelesTriangleBoundary.contains(px, py, cx, cy, rx, ry, 0)).toBe(true);
	});

	it('returns false above the apex', () => {
		const py = cy - ry - shiftY - 1;
		expect(isoscelesTriangleBoundary.contains(cx, py, cx, cy, rx, ry, 0)).toBe(false);
	});

	it('returns false far to the right (cx + rx, cy) — narrow apex angle', () => {
		// Isosceles with 40° apex has base half-width = rx·tan(20°) ≈ 0.364·rx
		// so a point at x = cx + rx is well outside the base.
		expect(isoscelesTriangleBoundary.contains(cx + rx, cy, cx, cy, rx, ry, 0)).toBe(false);
	});

	it('returns false below the base (cy + ry)', () => {
		expect(isoscelesTriangleBoundary.contains(cx, cy + ry, cx, cy, rx, ry, 0)).toBe(false);
	});

	it('base corner is inside the triangle', () => {
		const baseHalfX = rx * Math.tan((20 * Math.PI) / 180);
		const baseY = ry * 0.6 - shiftY;
		// Just inside by pulling slightly toward centroid.
		const px = cx + baseHalfX * 0.95;
		const py = cy + baseY * 0.95;
		expect(isoscelesTriangleBoundary.contains(px, py, cx, cy, rx, ry, 0)).toBe(true);
	});
});

describe('isoscelesTriangleBoundary.sample', () => {
	const cx = 80;
	const cy = 120;
	const rx = 30;
	const ry = 40;

	it('returns the requested number of points', () => {
		const pts = isoscelesTriangleBoundary.sample(cx, cy, rx, ry, 18, createPrng(4), 0);
		expect(pts).toHaveLength(18);
	});

	it('every sampled point lies inside the triangle', () => {
		const pts = isoscelesTriangleBoundary.sample(cx, cy, rx, ry, 24, createPrng(6), 0);
		for (const p of pts) {
			expect(isoscelesTriangleBoundary.contains(p.x, p.y, cx, cy, rx, ry, 0)).toBe(true);
		}
	});

	it('is deterministic under the same seeded rng', () => {
		const a = isoscelesTriangleBoundary.sample(cx, cy, rx, ry, 16, createPrng(8), 0);
		const b = isoscelesTriangleBoundary.sample(cx, cy, rx, ry, 16, createPrng(8), 0);
		expect(a).toEqual(b);
	});
});
