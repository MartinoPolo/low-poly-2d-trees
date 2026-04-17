import { describe, it, expect } from 'vitest';
import { repositionIsolatedBlobs } from './shape_bounds.js';
import { BOUNDARY_KINDS } from '../boundaries.js';
import type { Blob } from './shape_types.js';

function makeBlob(cx: number, cy: number, rx: number, ry: number): Blob {
	return { cx, cy, rx, ry, boundary: BOUNDARY_KINDS.circle };
}

describe('repositionIsolatedBlobs (issue #110)', () => {
	it('moves an isolated blob closer to its nearest neighbor', () => {
		const blobs: Blob[] = [
			makeBlob(150, 90, 30, 30), // center blob
			makeBlob(170, 90, 25, 25), // overlapping neighbor
			makeBlob(300, 90, 20, 20), // isolated — far away
		];
		const isolatedBefore = { cx: blobs[2]!.cx, cy: blobs[2]!.cy };
		repositionIsolatedBlobs(blobs);

		// The isolated blob should have moved closer to the cluster
		const distBefore = Math.sqrt(
			(isolatedBefore.cx - blobs[0]!.cx) ** 2 + (isolatedBefore.cy - blobs[0]!.cy) ** 2,
		);
		const distAfter = Math.sqrt(
			(blobs[2]!.cx - blobs[0]!.cx) ** 2 + (blobs[2]!.cy - blobs[0]!.cy) ** 2,
		);
		expect(distAfter).toBeLessThan(distBefore);
	});

	it('does not move blobs that overlap with neighbors', () => {
		const blobs: Blob[] = [
			makeBlob(150, 90, 30, 30),
			makeBlob(160, 90, 30, 30), // overlapping
		];
		const before = { cx: blobs[1]!.cx, cy: blobs[1]!.cy };
		repositionIsolatedBlobs(blobs);
		expect(blobs[1]!.cx).toBe(before.cx);
		expect(blobs[1]!.cy).toBe(before.cy);
	});

	it('handles empty array without error', () => {
		const blobs: Blob[] = [];
		repositionIsolatedBlobs(blobs);
		expect(blobs).toHaveLength(0);
	});

	it('handles single blob without error', () => {
		const blobs: Blob[] = [makeBlob(150, 90, 30, 30)];
		const before = { cx: blobs[0]!.cx, cy: blobs[0]!.cy };
		repositionIsolatedBlobs(blobs);
		// Single blob has no neighbor — stays in place
		expect(blobs[0]!.cx).toBe(before.cx);
		expect(blobs[0]!.cy).toBe(before.cy);
	});
});
