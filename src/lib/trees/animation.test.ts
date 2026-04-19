import { describe, it, expect } from 'vitest';
import {
	computeAnimationDelay,
	computeBranchDuration,
	computeBranchDelay,
	computeCanopyBottomY,
	computeGrowthScales,
} from './animation.js';
import type { BlobGeometry } from './types/core.js';

describe('Animation helpers', () => {
	describe('computeAnimationDelay', () => {
		it('returns a value in [0, 0.5]', () => {
			const delay = computeAnimationDelay(42);
			expect(delay).toBeGreaterThanOrEqual(0);
			expect(delay).toBeLessThanOrEqual(0.5);
		});

		it('is deterministic (same seed same result)', () => {
			expect(computeAnimationDelay(42)).toBe(computeAnimationDelay(42));
		});

		it('different seeds produce different values', () => {
			expect(computeAnimationDelay(1)).not.toBe(computeAnimationDelay(2));
		});
	});

	describe('computeBranchDuration', () => {
		it('returns a value in [1.5, 4.0]', () => {
			const duration = computeBranchDuration(42, 0);
			expect(duration).toBeGreaterThanOrEqual(1.5);
			expect(duration).toBeLessThanOrEqual(4.0);
		});

		it('is deterministic (same seed + index same result)', () => {
			expect(computeBranchDuration(42, 3)).toBe(computeBranchDuration(42, 3));
		});

		it('different branch indices produce different values', () => {
			expect(computeBranchDuration(42, 0)).not.toBe(computeBranchDuration(42, 1));
		});

		it('different seeds produce different values', () => {
			expect(computeBranchDuration(1, 0)).not.toBe(computeBranchDuration(2, 0));
		});
	});

	describe('computeBranchDelay', () => {
		it('returns a value in [0, 2]', () => {
			const delay = computeBranchDelay(42, 0);
			expect(delay).toBeGreaterThanOrEqual(0);
			expect(delay).toBeLessThanOrEqual(2);
		});

		it('is deterministic (same seed + index same result)', () => {
			expect(computeBranchDelay(42, 3)).toBe(computeBranchDelay(42, 3));
		});

		it('different branch indices produce different values', () => {
			expect(computeBranchDelay(42, 0)).not.toBe(computeBranchDelay(42, 1));
		});
	});

	describe('computeCanopyBottomY', () => {
		it('returns the max Y from all blob triangle points', () => {
			const blobs: BlobGeometry[] = [
				{
					triangles: [
						{
							points: [
								{ x: 0, y: 10 },
								{ x: 5, y: 20 },
								{ x: 10, y: 15 },
							],
							color: '#000',
							group: 'canopy',
						},
					],
					center: { x: 5, y: 15 },
					depth: 0,
				},
				{
					triangles: [
						{
							points: [
								{ x: 0, y: 5 },
								{ x: 5, y: 30 },
								{ x: 10, y: 25 },
							],
							color: '#000',
							group: 'canopy',
						},
					],
					center: { x: 5, y: 20 },
					depth: 0,
				},
			];
			expect(computeCanopyBottomY(blobs)).toBe(30);
		});

		it('returns 0 for empty blobs', () => {
			expect(computeCanopyBottomY([])).toBe(0);
		});
	});

	describe('computeGrowthScales', () => {
		it('returns scale 1.0 at 0% variance (no oscillation)', () => {
			const scales = computeGrowthScales(0);
			expect(scales.minScale).toBe(1);
			expect(scales.maxScale).toBe(1);
			expect(scales.canopyMinScale).toBe(1);
			expect(scales.canopyMaxScale).toBe(1);
		});

		it('returns ±0.5 branch amplitude at 100% variance', () => {
			const scales = computeGrowthScales(100);
			expect(scales.minScale).toBe(0.5);
			expect(scales.maxScale).toBe(1.5);
		});

		it('returns linear scaling at 50% variance', () => {
			const scales = computeGrowthScales(50);
			expect(scales.minScale).toBe(0.75);
			expect(scales.maxScale).toBe(1.25);
		});

		it('canopy amplitude is subtle (±8% at 100%)', () => {
			const scales = computeGrowthScales(100);
			expect(scales.canopyMinScale).toBeCloseTo(0.92, 2);
			expect(scales.canopyMaxScale).toBeCloseTo(1.08, 2);
		});

		it('effect clearly visible at 50%+ (amplitude ≥ 0.25)', () => {
			const scales = computeGrowthScales(50);
			expect(scales.maxScale - scales.minScale).toBeGreaterThanOrEqual(0.5);
		});
	});
});
