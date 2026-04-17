import { describe, it, expect } from 'vitest';
import { trimBranchTipsToBlobs, type GeneratedBranch } from './branch_generation.js';
import { BOUNDARY_KINDS } from '../boundaries.js';
import type { Blob } from './shape_types.js';

function makeBlob(cx: number, cy: number, rx: number, ry: number): Blob {
	return { cx, cy, rx, ry, boundary: BOUNDARY_KINDS.circle };
}

function makeBranch(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	depth: number = 1,
): GeneratedBranch {
	return {
		segment: { x1, y1, x2, y2, widthStart: 5, widthEnd: 2 },
		path: [
			{ x: x1, y: y1 },
			{ x: x2, y: y2 },
		],
		depth,
		parentIndex: null,
	};
}

describe('trimBranchTipsToBlobs (issue #110)', () => {
	it('trims a branch tip that extends past its closest blob', () => {
		const blob = makeBlob(150, 50, 30, 30);
		const branch = makeBranch(150, 100, 200, 50); // tip at (200,50), outside blob

		trimBranchTipsToBlobs([branch], [blob]);

		// After trimming, the tip should be on or inside the blob ellipse
		const dx = (branch.segment.x2 - blob.cx) / blob.rx;
		const dy = (branch.segment.y2 - blob.cy) / blob.ry;
		const normalizedDist = dx * dx + dy * dy;
		expect(normalizedDist).toBeLessThanOrEqual(1.05); // Allow small tolerance
	});

	it('does not modify a branch tip already inside the blob', () => {
		const blob = makeBlob(150, 50, 40, 40);
		const branch = makeBranch(150, 100, 155, 55); // tip inside blob

		const originalX2 = branch.segment.x2;
		const originalY2 = branch.segment.y2;

		trimBranchTipsToBlobs([branch], [blob]);

		expect(branch.segment.x2).toBe(originalX2);
		expect(branch.segment.y2).toBe(originalY2);
	});

	it('handles empty branches array', () => {
		const blob = makeBlob(150, 50, 30, 30);
		expect(() => trimBranchTipsToBlobs([], [blob])).not.toThrow();
	});

	it('handles empty blobs array — no trimming', () => {
		const branch = makeBranch(150, 100, 200, 50);
		const originalX2 = branch.segment.x2;
		trimBranchTipsToBlobs([branch], []);
		expect(branch.segment.x2).toBe(originalX2);
	});
});
