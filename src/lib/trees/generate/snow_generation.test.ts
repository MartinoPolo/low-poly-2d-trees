import { describe, it, expect } from 'vitest';
import { generateBlobSnowCap, generateTierSnowCap } from './snow_generation.js';
import { GEOMETRY_GROUPS } from '../types.js';
import type { Tier } from '../types.js';
import type { Blob } from '../shapes.js';
import { createPrng } from '../prng.js';

function makeCircleBlob(overrides: Partial<Blob> = {}): Blob {
	return { cx: 250, cy: 150, rx: 40, ry: 30, boundary: 'circle', ...overrides };
}

function makeTeardropBlob(overrides: Partial<Blob> = {}): Blob {
	return { cx: 250, cy: 150, rx: 25, ry: 55, boundary: 'teardrop', rotationDeg: 0, ...overrides };
}

function makeTier(overrides: Partial<Tier> = {}): Tier {
	return {
		tipX: 250,
		tipY: 100,
		baseLeftX: 200,
		baseLeftY: 200,
		baseRightX: 300,
		baseRightY: 200,
		...overrides,
	};
}

describe('generateTierSnowCap', () => {
	it('produces triangles for a standard tier', () => {
		const result = generateTierSnowCap(makeTier(), createPrng(42));
		expect(result.triangles.length).toBeGreaterThan(0);
	});

	it('all triangles use snow geometry group', () => {
		const result = generateTierSnowCap(makeTier(), createPrng(42));
		for (const tri of result.triangles) {
			expect(tri.group).toBe(GEOMETRY_GROUPS.snow);
		}
	});

	it('all triangle colors are valid hex in expected range', () => {
		const result = generateTierSnowCap(makeTier(), createPrng(42));
		for (const tri of result.triangles) {
			expect(tri.color).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it('is deterministic with same seed', () => {
		const result1 = generateTierSnowCap(makeTier(), createPrng(42));
		const result2 = generateTierSnowCap(makeTier(), createPrng(42));
		expect(result1).toEqual(result2);
	});

	it('snow triangles are bounded near the tier range', () => {
		const tier = makeTier();
		const tierHeight = (tier.baseLeftY + tier.baseRightY) / 2 - tier.tipY;
		const tolerance = tierHeight * 0.1;
		const result = generateTierSnowCap(tier, createPrng(42));
		for (const tri of result.triangles) {
			for (const pt of tri.points) {
				expect(pt.y).toBeGreaterThanOrEqual(tier.tipY - tolerance);
				expect(pt.y).toBeLessThanOrEqual(tier.baseLeftY + tolerance);
				expect(pt.x).toBeGreaterThanOrEqual(tier.baseLeftX - tolerance);
				expect(pt.x).toBeLessThanOrEqual(tier.baseRightX + tolerance);
			}
		}
	});

	it('snow covers upper portion of tier, not the base', () => {
		const tier = makeTier();
		const tierHeight = (tier.baseLeftY + tier.baseRightY) / 2 - tier.tipY;
		const cutoffY = tier.tipY + 0.85 * tierHeight;
		const result = generateTierSnowCap(tier, createPrng(42));
		const allPoints = result.triangles.flatMap((tri) => tri.points);
		const pointsAboveCutoff = allPoints.filter((pt) => pt.y <= cutoffY);
		expect(pointsAboveCutoff.length / allPoints.length).toBeGreaterThan(0.7);
	});

	it('returns empty for degenerate zero-height tier', () => {
		const result = generateTierSnowCap(
			makeTier({ baseLeftY: 100, baseRightY: 100 }),
			createPrng(42),
		);
		expect(result.triangles).toHaveLength(0);
	});

	it('works for an asymmetric tier', () => {
		const result = generateTierSnowCap(
			makeTier({
				tipX: 260,
				baseLeftX: 180,
				baseLeftY: 220,
				baseRightX: 320,
				baseRightY: 200,
			}),
			createPrng(42),
		);
		expect(result.triangles.length).toBeGreaterThan(0);
	});
});

describe('generateBlobSnowCap', () => {
	it('produces triangles for a circle blob', () => {
		const result = generateBlobSnowCap(makeCircleBlob(), createPrng(42));
		expect(result.triangles.length).toBeGreaterThan(0);
	});

	it('all triangles use snow geometry group', () => {
		const result = generateBlobSnowCap(makeCircleBlob(), createPrng(42));
		for (const tri of result.triangles) {
			expect(tri.group).toBe(GEOMETRY_GROUPS.snow);
		}
	});

	it('all triangle colors are valid hex', () => {
		const result = generateBlobSnowCap(makeCircleBlob(), createPrng(42));
		for (const tri of result.triangles) {
			expect(tri.color).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it('is deterministic with same seed', () => {
		expect(generateBlobSnowCap(makeCircleBlob(), createPrng(42))).toEqual(
			generateBlobSnowCap(makeCircleBlob(), createPrng(42)),
		);
	});

	it('works for a rotated blob', () => {
		const result = generateBlobSnowCap(makeCircleBlob({ rotationDeg: 30 }), createPrng(42));
		expect(result.triangles.length).toBeGreaterThan(0);
	});

	it('returns empty for degenerate blob', () => {
		expect(
			generateBlobSnowCap(makeCircleBlob({ rx: 0, ry: 0 }), createPrng(42)).triangles,
		).toHaveLength(0);
	});

	it('produces triangles for a teardrop blob', () => {
		const result = generateBlobSnowCap(makeTeardropBlob(), createPrng(42));
		expect(result.triangles.length).toBeGreaterThan(0);
	});

	it('snow covers upper portion of teardrop, not the base', () => {
		const blob = makeTeardropBlob();
		const result = generateBlobSnowCap(blob, createPrng(42));
		const allPoints = result.triangles.flatMap((tri) => tri.points);
		const blobTopY = blob.cy - blob.ry;
		const blobMidY = blob.cy;
		const pointsAboveMid = allPoints.filter((pt) => pt.y <= blobMidY);
		expect(pointsAboveMid.length).toBe(allPoints.length);
		const pointsNearTop = allPoints.filter((pt) => pt.y <= blobTopY + blob.ry * 0.5);
		expect(pointsNearTop.length / allPoints.length).toBeGreaterThanOrEqual(0.7);
	});

	it('teardrop snow cap is narrower than circle snow cap of same dimensions', () => {
		const dims = { cx: 250, cy: 150, rx: 40, ry: 50 };
		const teardropResult = generateBlobSnowCap(
			{ ...dims, boundary: 'teardrop' as const, rotationDeg: 0 },
			createPrng(42),
		);
		const circleResult = generateBlobSnowCap(
			{ ...dims, boundary: 'circle' as const },
			createPrng(42),
		);
		const maxX = (tris: typeof teardropResult.triangles) =>
			Math.max(...tris.flatMap((t) => t.points.map((p) => Math.abs(p.x - dims.cx))));
		expect(maxX(teardropResult.triangles)).toBeLessThan(maxX(circleResult.triangles));
	});
});
