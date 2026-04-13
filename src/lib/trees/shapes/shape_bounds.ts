import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';
import type { Tier } from '../types.js';
import { BOUNDARIES } from '../boundaries.js';
import { randomInRange } from '../prng.js';
import type { Blob, BranchSegment } from './shape_types.js';

// ---------------------------------------------------------------------------
// Blob point-testing
// ---------------------------------------------------------------------------

export function isPointInBlobs(
	x: number,
	y: number,
	blobs: readonly Blob[],
	insetFactor = 1,
): boolean {
	return blobs.some((b) =>
		BOUNDARIES[b.boundary].contains(
			x,
			y,
			b.cx,
			b.cy,
			b.rx * insetFactor,
			b.ry * insetFactor,
			b.rotationDeg ?? 0,
		),
	);
}

export function isPointInSingleBlob(x: number, y: number, b: Blob): boolean {
	return BOUNDARIES[b.boundary].contains(x, y, b.cx, b.cy, b.rx, b.ry, b.rotationDeg ?? 0);
}

// ---------------------------------------------------------------------------
// Bounding boxes
// ---------------------------------------------------------------------------

export function getBlobsBounds(blobs: readonly Blob[]): {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
} {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for (const b of blobs) {
		minX = Math.min(minX, b.cx - b.rx);
		minY = Math.min(minY, b.cy - b.ry);
		maxX = Math.max(maxX, b.cx + b.rx);
		maxY = Math.max(maxY, b.cy + b.ry);
	}

	return {
		minX: Math.max(0, minX),
		minY: Math.max(0, minY),
		maxX: Math.min(VIEWBOX_WIDTH, maxX),
		maxY: Math.min(VIEWBOX_HEIGHT, maxY),
	};
}

// ---------------------------------------------------------------------------
// Per-tier boundary sampling
// ---------------------------------------------------------------------------

export function sampleTierBoundary(
	tier: Tier,
	sampleCount: number,
	rng: () => number,
): { x: number; y: number }[] {
	const vertices = [
		{ x: tier.tipX, y: tier.tipY },
		{ x: tier.baseRightX, y: tier.baseRightY },
		{ x: tier.baseLeftX, y: tier.baseLeftY },
	];

	const edgeLengths: number[] = [];
	let totalPerimeter = 0;
	for (let i = 0; i < 3; i++) {
		const a = vertices[i]!;
		const b = vertices[(i + 1) % 3]!;
		const len = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
		edgeLengths.push(len);
		totalPerimeter += len;
	}

	const points: { x: number; y: number }[] = [];

	for (let edge = 0; edge < 3; edge++) {
		const samplesOnEdge = Math.max(
			1,
			Math.round((edgeLengths[edge]! / totalPerimeter) * sampleCount),
		);
		const a = vertices[edge]!;
		const b = vertices[(edge + 1) % 3]!;

		for (let j = 0; j < samplesOnEdge; j++) {
			const t = j / samplesOnEdge + randomInRange(rng, 0, 1 / samplesOnEdge);
			points.push({
				x: a.x + t * (b.x - a.x),
				y: a.y + t * (b.y - a.y),
			});
		}
	}

	return points;
}

// ---------------------------------------------------------------------------
// No-floating-blob validation
// ---------------------------------------------------------------------------

function branchReachesBlob(branches: readonly BranchSegment[], blob: Blob): boolean {
	return branches.some((b) => {
		for (let t = 0; t <= 1; t += 0.1) {
			const px = b.x1 + t * (b.x2 - b.x1);
			const py = b.y1 + t * (b.y2 - b.y1);
			if (isPointInSingleBlob(px, py, blob)) {
				return true;
			}
		}
		return false;
	});
}

function findIsolatedBlobs(blobs: readonly Blob[]): number[] {
	const isolated: number[] = [];
	for (let i = 0; i < blobs.length; i++) {
		let hasOverlap = false;
		for (let j = 0; j < blobs.length; j++) {
			if (i === j) {
				continue;
			}
			const dx = (blobs[i]!.cx - blobs[j]!.cx) / (blobs[i]!.rx + blobs[j]!.rx);
			const dy = (blobs[i]!.cy - blobs[j]!.cy) / (blobs[i]!.ry + blobs[j]!.ry);
			if (dx * dx + dy * dy < 1) {
				hasOverlap = true;
				break;
			}
		}
		if (!hasOverlap) {
			isolated.push(i);
		}
	}
	return isolated;
}

export function validateNoFloatingBlobs(
	blobs: readonly Blob[],
	branches: BranchSegment[],
): BranchSegment[] {
	const additional: BranchSegment[] = [];
	const isolated = findIsolatedBlobs(blobs);

	for (const idx of isolated) {
		const blob = blobs[idx]!;
		if (branchReachesBlob(branches, blob)) {
			continue;
		}

		const trunkX = VIEWBOX_WIDTH / 2;
		const trunkY = blob.cy + 20;

		additional.push({
			x1: trunkX,
			y1: Math.min(trunkY, VIEWBOX_HEIGHT * 0.9),
			x2: blob.cx,
			y2: blob.cy,
			widthStart: 7,
			widthEnd: 1.75,
		});
	}

	return additional;
}
