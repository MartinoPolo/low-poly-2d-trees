import { describe, it, expect } from 'vitest';
import { buildTrunkPath, sampleTrunkCenterX, isPointInTrunkPath } from './shapes.js';
import { createPrng } from './prng.js';
import { VIEWBOX_WIDTH } from './types.js';

// ============================================================================
// REQ-T-11 / REQ-T-12: direct unit tests for buildTrunkPath
// ============================================================================

describe('buildTrunkPath', () => {
	const trunkBottomY = 285;
	const trunkTopY = 135;
	const trunkHeightPx = trunkBottomY - trunkTopY;
	const baseX = VIEWBOX_WIDTH / 2;

	it('returns base and top junctions with segments+1 points', () => {
		const rng = createPrng(42);
		const path = buildTrunkPath(rng, 0, 3, 0, trunkTopY, trunkBottomY);
		expect(path).toHaveLength(4);
		expect(path[0]).toEqual({ x: baseX, y: trunkBottomY });
		expect(path[3]!.y).toBeCloseTo(trunkTopY, 10);
	});

	it('lean=0, crookedness=0, N=1 is a perfectly vertical single segment', () => {
		const path = buildTrunkPath(createPrng(42), 0, 1, 0, trunkTopY, trunkBottomY);
		expect(path).toHaveLength(2);
		expect(path[0]!.x).toBe(baseX);
		expect(path[1]!.x).toBe(baseX);
	});

	it('lean=30, N=1 satisfies leanPx = tan(30°) × trunkHeight', () => {
		const path = buildTrunkPath(createPrng(42), 30, 1, 0, trunkTopY, trunkBottomY);
		const expectedDx = Math.tan((30 * Math.PI) / 180) * trunkHeightPx;
		expect(path[1]!.x - path[0]!.x).toBeCloseTo(expectedDx, 10);
	});

	it('REQ-T-12c: first segment angle equals lean regardless of crookedness', () => {
		// Build two paths: one with 1 segment, one with 5 segments, both
		// crookedness=0. Top X must match exactly since no jitter applies.
		const p1 = buildTrunkPath(createPrng(42), 25, 1, 0, trunkTopY, trunkBottomY);
		const p5 = buildTrunkPath(createPrng(42), 25, 5, 0, trunkTopY, trunkBottomY);
		expect(p5[5]!.x).toBeCloseTo(p1[1]!.x, 10);
	});

	it('REQ-T-12: N=1 ignores crookedness (straight trunk)', () => {
		const p = buildTrunkPath(createPrng(42), 0, 1, 100, trunkTopY, trunkBottomY);
		expect(p[1]!.x).toBe(baseX);
	});

	it('REQ-T-12: N>1 with crookedness=0 is straight (no jitter)', () => {
		const p = buildTrunkPath(createPrng(42), 0, 5, 0, trunkTopY, trunkBottomY);
		for (const j of p) {
			expect(j.x).toBeCloseTo(baseX, 10);
		}
	});

	it('REQ-T-12b: junction angle jitter stays within lerp(5°, 20°) per crookedness', () => {
		// With crookedness=100, maxJitter=20°. Measure the angle delta between
		// consecutive segments; each must be ≤ 20° in magnitude.
		const maxJitterDeg = 20;
		const rng = createPrng(42);
		const p = buildTrunkPath(rng, 0, 5, 100, trunkTopY, trunkBottomY);
		const segAngles: number[] = [];
		for (let i = 0; i < p.length - 1; i++) {
			const dx = p[i + 1]!.x - p[i]!.x;
			const dy = p[i + 1]!.y - p[i]!.y; // negative (going up)
			segAngles.push(Math.atan2(dx, -dy));
		}
		for (let i = 1; i < segAngles.length; i++) {
			const deltaDeg = ((segAngles[i]! - segAngles[i - 1]!) * 180) / Math.PI;
			expect(Math.abs(deltaDeg)).toBeLessThanOrEqual(maxJitterDeg + 1e-9);
		}
	});

	it('REQ-T-12b: crookedness=50 keeps per-junction jitter within 12.5°', () => {
		// maxJitter for 50 = lerp(5, 20, 0.5) = 12.5°
		const maxJitterDeg = 12.5;
		const p = buildTrunkPath(createPrng(42), 0, 5, 50, trunkTopY, trunkBottomY);
		const segAngles: number[] = [];
		for (let i = 0; i < p.length - 1; i++) {
			const dx = p[i + 1]!.x - p[i]!.x;
			const dy = p[i + 1]!.y - p[i]!.y;
			segAngles.push(Math.atan2(dx, -dy));
		}
		for (let i = 1; i < segAngles.length; i++) {
			const deltaDeg = ((segAngles[i]! - segAngles[i - 1]!) * 180) / Math.PI;
			expect(Math.abs(deltaDeg)).toBeLessThanOrEqual(maxJitterDeg + 1e-9);
		}
	});

	it('same seed + config produces identical trunk paths', () => {
		const p1 = buildTrunkPath(createPrng(42), 15, 5, 100, trunkTopY, trunkBottomY);
		const p2 = buildTrunkPath(createPrng(42), 15, 5, 100, trunkTopY, trunkBottomY);
		expect(p1).toEqual(p2);
	});

	it('trunkSegments is clamped to [1, 5]', () => {
		const p0 = buildTrunkPath(createPrng(42), 0, 0, 0, trunkTopY, trunkBottomY);
		expect(p0).toHaveLength(2);
		const p9 = buildTrunkPath(createPrng(42), 0, 9, 0, trunkTopY, trunkBottomY);
		expect(p9).toHaveLength(6);
	});
});

describe('sampleTrunkCenterX', () => {
	it('clamps to base junction x when y is at or below base', () => {
		const junctions = [
			{ x: 100, y: 285 },
			{ x: 120, y: 135 },
		];
		expect(sampleTrunkCenterX(junctions, 300)).toBe(100);
		expect(sampleTrunkCenterX(junctions, 285)).toBe(100);
	});

	it('clamps to top junction x when y is at or above top', () => {
		const junctions = [
			{ x: 100, y: 285 },
			{ x: 120, y: 135 },
		];
		expect(sampleTrunkCenterX(junctions, 100)).toBe(120);
		expect(sampleTrunkCenterX(junctions, 135)).toBe(120);
	});

	it('linearly interpolates within a segment', () => {
		const junctions = [
			{ x: 100, y: 285 },
			{ x: 200, y: 135 },
		];
		// Midpoint y = 210, expected x = 150
		expect(sampleTrunkCenterX(junctions, 210)).toBe(150);
	});

	it('selects the correct segment in a multi-segment polyline', () => {
		const junctions = [
			{ x: 100, y: 285 },
			{ x: 110, y: 235 },
			{ x: 90, y: 185 },
			{ x: 130, y: 135 },
		];
		expect(sampleTrunkCenterX(junctions, 260)).toBeCloseTo(105, 10);
		expect(sampleTrunkCenterX(junctions, 210)).toBeCloseTo(100, 10);
		expect(sampleTrunkCenterX(junctions, 160)).toBeCloseTo(110, 10);
	});
});

describe('isPointInTrunkPath', () => {
	const junctions = [
		{ x: 100, y: 285 },
		{ x: 100, y: 135 },
	];

	it('returns true for a point inside the trunk', () => {
		expect(isPointInTrunkPath(100, 200, junctions, 10, 20)).toBe(true);
	});

	it('returns false for a point above the trunk top', () => {
		expect(isPointInTrunkPath(100, 100, junctions, 10, 20)).toBe(false);
	});

	it('returns false for a point below the trunk base', () => {
		expect(isPointInTrunkPath(100, 300, junctions, 10, 20)).toBe(false);
	});

	it('uses linearly interpolated width by y', () => {
		// At midpoint: width = (10 + 20) / 2 = 15, so halfWidth = 7.5
		expect(isPointInTrunkPath(107, 210, junctions, 10, 20)).toBe(true);
		expect(isPointInTrunkPath(108, 210, junctions, 10, 20)).toBe(false);
	});
});
