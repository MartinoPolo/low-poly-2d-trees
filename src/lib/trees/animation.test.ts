import { describe, it, expect } from 'vitest';
import {
	computeAnimationDelay,
	computeBranchDuration,
	computeBranchDelay,
	computeCanopyBottomY,
	computeGrowthScales,
	GROWTH_DURATION_SECONDS,
	createFallingLeaf,
	advanceFallingLeaves,
	FALLING_LEAF_STATES,
	FALLING_LEAF_CONFIG,
	type FallingLeaf,
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

	describe('GROWTH_DURATION_SECONDS', () => {
		it('is a positive number used for synchronized growth', () => {
			expect(GROWTH_DURATION_SECONDS).toBeGreaterThan(0);
			expect(typeof GROWTH_DURATION_SECONDS).toBe('number');
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

	describe('createFallingLeaf', () => {
		const crownCenter = { x: 250, y: 200 };
		const canopyBottomY = 300;
		const groundLineY = 475;

		it('creates a leaf in falling state', () => {
			const leaf = createFallingLeaf(0, crownCenter, canopyBottomY, groundLineY, 42, 1000);
			expect(leaf.state).toBe(FALLING_LEAF_STATES.falling);
			expect(leaf.stateStartTime).toBe(1000);
		});

		it('sets landedY to groundLineY', () => {
			const leaf = createFallingLeaf(0, crownCenter, canopyBottomY, groundLineY, 42, 0);
			expect(leaf.landedY).toBe(groundLineY);
		});

		it('scatter is between 10-20px magnitude', () => {
			for (let id = 0; id < 20; id++) {
				const leaf = createFallingLeaf(id, crownCenter, canopyBottomY, groundLineY, 42, 0);
				const absScatter = Math.abs(leaf.scatterX);
				expect(absScatter).toBeGreaterThanOrEqual(FALLING_LEAF_CONFIG.scatterMinPx);
				expect(absScatter).toBeLessThanOrEqual(FALLING_LEAF_CONFIG.scatterMaxPx);
			}
		});

		it('is deterministic (same inputs produce same leaf)', () => {
			const a = createFallingLeaf(0, crownCenter, canopyBottomY, groundLineY, 42, 0);
			const b = createFallingLeaf(0, crownCenter, canopyBottomY, groundLineY, 42, 0);
			expect(a).toEqual(b);
		});
	});

	describe('advanceFallingLeaves', () => {
		function makeLeaf(overrides: Partial<FallingLeaf> = {}): FallingLeaf {
			return {
				id: 0,
				x: 250,
				y: 200,
				landedY: 475,
				scatterX: 15,
				fallDuration: 3,
				rotation: 45,
				color: '#E8A028',
				state: FALLING_LEAF_STATES.falling,
				stateStartTime: 0,
				...overrides,
			};
		}

		it('keeps falling leaves that have not reached ground', () => {
			const leaves = [makeLeaf({ fallDuration: 3, stateStartTime: 0 })];
			const result = advanceFallingLeaves(leaves, 2000);
			expect(result).toHaveLength(1);
			expect(result[0]!.state).toBe(FALLING_LEAF_STATES.falling);
		});

		it('transitions falling to landed after fallDuration', () => {
			const leaves = [makeLeaf({ fallDuration: 3, stateStartTime: 0 })];
			const result = advanceFallingLeaves(leaves, 3000);
			expect(result).toHaveLength(1);
			expect(result[0]!.state).toBe(FALLING_LEAF_STATES.landed);
		});

		it('keeps landed leaves for 10 seconds', () => {
			const leaves = [makeLeaf({ state: FALLING_LEAF_STATES.landed, stateStartTime: 0 })];
			const result = advanceFallingLeaves(leaves, 9000);
			expect(result).toHaveLength(1);
			expect(result[0]!.state).toBe(FALLING_LEAF_STATES.landed);
		});

		it('transitions landed to fading after 10 seconds', () => {
			const leaves = [makeLeaf({ state: FALLING_LEAF_STATES.landed, stateStartTime: 0 })];
			const result = advanceFallingLeaves(leaves, 10_000);
			expect(result).toHaveLength(1);
			expect(result[0]!.state).toBe(FALLING_LEAF_STATES.fading);
		});

		it('removes fading leaves after fade duration', () => {
			const leaves = [makeLeaf({ state: FALLING_LEAF_STATES.fading, stateStartTime: 0 })];
			const result = advanceFallingLeaves(leaves, FALLING_LEAF_CONFIG.fadeDurationMs);
			expect(result).toHaveLength(0);
		});

		it('keeps fading leaves before fade duration completes', () => {
			const leaves = [makeLeaf({ state: FALLING_LEAF_STATES.fading, stateStartTime: 0 })];
			const result = advanceFallingLeaves(leaves, FALLING_LEAF_CONFIG.fadeDurationMs - 100);
			expect(result).toHaveLength(1);
			expect(result[0]!.state).toBe(FALLING_LEAF_STATES.fading);
		});
	});
});
