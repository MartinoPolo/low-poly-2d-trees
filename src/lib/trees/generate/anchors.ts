import type { Point2D, TreeAnchors, BlobGeometry } from '../types.js';
import { createPrng, poissonSample } from '../prng.js';
import { isPointInBlobs, isPointInTier, sampleTrunkCenterX } from '../shapes.js';
import type { Blob, BranchSegment } from '../shapes.js';
import type { Tier } from '../types.js';

const ROOTS_DEPTH_PX = 15;
const FRUIT_SLOTS_SEED_OFFSET = 54321;

/** Calibrated for 2× fruit render scale (FRUIT_RENDER_SCALE in TreeFruitAndFlowerLayer.svelte). */
const FRUIT_CONTAINMENT_INSET_FACTOR = 0.7;

function buildCanopyContainmentTest(
	blobs: readonly Blob[],
	tiers: readonly Tier[],
): (x: number, y: number) => boolean {
	if (blobs.length > 0) {
		return (x, y) => isPointInBlobs(x, y, blobs, FRUIT_CONTAINMENT_INSET_FACTOR);
	}
	if (tiers.length > 0) {
		return (x, y) => tiers.some((t) => isPointInTier(x, y, t));
	}
	return () => true;
}

export function computeAnchors(
	trunkJunctions: readonly Point2D[],
	canopyBounds: { minX: number; minY: number; maxX: number; maxY: number },
	allBranches: readonly BranchSegment[],
	canopyBlobs: readonly BlobGeometry[],
	blobs: readonly Blob[],
	tiers: readonly Tier[],
	seed: number,
): TreeAnchors {
	const baseJunction = trunkJunctions[0]!;
	const topJunction = trunkJunctions[trunkJunctions.length - 1]!;
	const midY = (baseJunction.y + topJunction.y) / 2;

	const crownCenter: Point2D = {
		x: (canopyBounds.minX + canopyBounds.maxX) / 2,
		y: (canopyBounds.minY + canopyBounds.maxY) / 2,
	};

	let crownTopY = Infinity;
	let crownTopX = crownCenter.x;
	for (const blob of canopyBlobs) {
		for (const tri of blob.triangles) {
			for (const p of tri.points) {
				if (p.y < crownTopY) {
					crownTopY = p.y;
					crownTopX = p.x;
				}
			}
		}
	}
	const crownTop: Point2D =
		crownTopY < Infinity
			? { x: crownTopX, y: crownTopY }
			: { x: crownCenter.x, y: canopyBounds.minY };

	const branchTips: Point2D[] = allBranches.map((b) => ({ x: b.x2, y: b.y2 }));

	const fruitRng = createPrng(seed + FRUIT_SLOTS_SEED_OFFSET);
	const fruitCount = 5 + Math.floor(fruitRng() * 3);
	// Base minDistance on actual blob-coverage area rather than canopyBounds, so
	// widely-spread clustered canopies (Engine v2) still fit the requested number
	// of fruit slots instead of letting bounds-area inflation push minDistance up.
	// Fall back to bounds area when no blobs (tiered shapes use their own path).
	const blobsCoverageArea = blobs.reduce((sum, b) => sum + Math.PI * b.rx * b.ry, 0);
	const coverageArea =
		blobsCoverageArea > 0
			? blobsCoverageArea
			: (canopyBounds.maxX - canopyBounds.minX) * (canopyBounds.maxY - canopyBounds.minY);
	const minDistance = Math.max(3, Math.sqrt(coverageArea / fruitCount) * 0.6);

	const containmentTest = buildCanopyContainmentTest(blobs, tiers);

	const fruitSlots = poissonSample(
		fruitRng,
		fruitCount,
		canopyBounds,
		containmentTest,
		minDistance,
	);

	return {
		trunkTop: topJunction,
		trunkMiddle: {
			x: sampleTrunkCenterX(trunkJunctions, midY),
			y: midY,
		},
		trunkBase: baseJunction,
		crownCenter,
		crownTop,
		roots: { x: baseJunction.x, y: baseJunction.y + ROOTS_DEPTH_PX },
		branchTips,
		fruitSlots,
	};
}
