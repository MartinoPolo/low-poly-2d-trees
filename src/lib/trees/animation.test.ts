import { describe, it, expect } from 'vitest';
import { computeAnimationDelay, computeBranchDuration, computeBranchDelay } from './animation.js';

describe('Animation helpers', () => {
	describe('computeAnimationDelay', () => {
		it('returns a value in [0, 3]', () => {
			const delay = computeAnimationDelay(42);
			expect(delay).toBeGreaterThanOrEqual(0);
			expect(delay).toBeLessThanOrEqual(3);
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
});
