import { describe, it, expect } from 'vitest';
import {
	classifyBranchZOrder,
	classifyChildBranchZOrder,
	classifyCanopyBlobZOrder,
	branchZOrderToLayer,
	canopyZOrderToLayer,
} from './z_ordering.js';
import { Z_ORDER_LAYERS } from './types/core.js';

// ---------------------------------------------------------------------------
// REQ-EV2-Z-01: Light-angle-biased front/back classification
// ---------------------------------------------------------------------------

describe('classifyBranchZOrder', () => {
	it('is deterministic — same inputs produce same result', () => {
		const result1 = classifyBranchZOrder(160, 150, 130, 42, 0);
		const result2 = classifyBranchZOrder(160, 150, 130, 42, 0);
		expect(result1).toBe(result2);
	});

	it('lit-side branches are ~70% front across many seeds', () => {
		// lightAngle=130 → light comes from upper-left, lightDirX = cos(130°) < 0
		// So branches on the LEFT (branchOriginX < trunkCenterX) are on the lit side
		let frontCount = 0;
		const trials = 500;
		for (let i = 0; i < trials; i++) {
			const result = classifyBranchZOrder(140, 150, 130, i, 0);
			if (result === 'front') {
				frontCount++;
			}
		}
		const frontRate = frontCount / trials;
		// Should be ~70% with some tolerance
		expect(frontRate).toBeGreaterThan(0.6);
		expect(frontRate).toBeLessThan(0.8);
	});

	it('shadow-side branches are ~30% front across many seeds', () => {
		// lightAngle=130 → lightDirX < 0 → lit side is left
		// Branch on RIGHT (branchOriginX > trunkCenterX) = shadow side
		let frontCount = 0;
		const trials = 500;
		for (let i = 0; i < trials; i++) {
			const result = classifyBranchZOrder(160, 150, 130, i, 0);
			if (result === 'front') {
				frontCount++;
			}
		}
		const frontRate = frontCount / trials;
		expect(frontRate).toBeGreaterThan(0.2);
		expect(frontRate).toBeLessThan(0.4);
	});

	it('different branchIndex values produce different results for same seed', () => {
		const results = new Set<string>();
		for (let i = 0; i < 20; i++) {
			results.add(classifyBranchZOrder(160, 150, 130, 42, i));
		}
		// With 20 branches, we should see both front and back
		expect(results.size).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// REQ-EV2-Z-03: L2 inherits parent with ~20% flip
// ---------------------------------------------------------------------------

describe('classifyChildBranchZOrder', () => {
	it('inherits parent ~80% of the time', () => {
		let inheritCount = 0;
		const trials = 500;
		for (let i = 0; i < trials; i++) {
			const result = classifyChildBranchZOrder('front', i, 0);
			if (result === 'front') {
				inheritCount++;
			}
		}
		const inheritRate = inheritCount / trials;
		expect(inheritRate).toBeGreaterThan(0.7);
		expect(inheritRate).toBeLessThan(0.9);
	});

	it('flips back parent to front ~20% of the time', () => {
		let flipCount = 0;
		const trials = 500;
		for (let i = 0; i < trials; i++) {
			const result = classifyChildBranchZOrder('back', i, 0);
			if (result === 'front') {
				flipCount++;
			}
		}
		const flipRate = flipCount / trials;
		expect(flipRate).toBeGreaterThan(0.1);
		expect(flipRate).toBeLessThan(0.3);
	});

	it('is deterministic', () => {
		const r1 = classifyChildBranchZOrder('front', 42, 3);
		const r2 = classifyChildBranchZOrder('front', 42, 3);
		expect(r1).toBe(r2);
	});
});

// ---------------------------------------------------------------------------
// REQ-EV2-CZ-01: Canopy blob z-order from cluster branches
// ---------------------------------------------------------------------------

describe('classifyCanopyBlobZOrder', () => {
	it('single front branch → front blob', () => {
		expect(classifyCanopyBlobZOrder(['front'], false)).toBe('front');
	});

	it('single back branch → back blob', () => {
		expect(classifyCanopyBlobZOrder(['back'], false)).toBe('back');
	});

	it('mixed front/back → defaults to front', () => {
		expect(classifyCanopyBlobZOrder(['front', 'back'], false)).toBe('front');
	});

	it('all back → back blob', () => {
		expect(classifyCanopyBlobZOrder(['back', 'back', 'back'], false)).toBe('back');
	});

	it('trunk-tip-only cluster → always front', () => {
		expect(classifyCanopyBlobZOrder([], true)).toBe('front');
	});

	it('empty non-trunk cluster → front (fallback)', () => {
		expect(classifyCanopyBlobZOrder([], false)).toBe('front');
	});
});

// ---------------------------------------------------------------------------
// Layer mapping
// ---------------------------------------------------------------------------

describe('z-order layer mapping', () => {
	it('branchZOrderToLayer maps correctly', () => {
		expect(branchZOrderToLayer('front')).toBe(Z_ORDER_LAYERS.frontBranches);
		expect(branchZOrderToLayer('back')).toBe(Z_ORDER_LAYERS.backBranches);
	});

	it('canopyZOrderToLayer maps correctly', () => {
		expect(canopyZOrderToLayer('front')).toBe(Z_ORDER_LAYERS.frontCanopy);
		expect(canopyZOrderToLayer('back')).toBe(Z_ORDER_LAYERS.backCanopy);
	});
});
