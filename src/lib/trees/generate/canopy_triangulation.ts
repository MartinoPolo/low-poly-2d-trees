import type { BlobGeometry, Triangle, TreeConfig } from '../types.js';
import { GEOMETRY_GROUPS } from '../types.js';
import { createPrng, poissonSample } from '../prng.js';
import { BOUNDARIES, BOUNDARY_KINDS, smoothAcuteBoundaryAngles } from '../boundaries.js';
import { computeCanopyColor } from '../lighting.js';
import { assignBlobDepths, sampleTierBoundary, isPointInTier } from '../shapes.js';
import type { Blob } from '../shapes.js';
import type { Tier } from '../types.js';
import { triangulatePoints, isTriangleInsideRegion } from './triangulation.js';
import { computeDepthDarkeningFactor } from './shape_constants.js';

const BLOB_FACET_NOISE_SEED_MULTIPLIER = 3333;
const TIER_FACET_NOISE_SEED_MULTIPLIER = 4444;

// ---------------------------------------------------------------------------
// Per-blob canopy triangulation (Delaunay-based)
// ---------------------------------------------------------------------------

export function generateBlobCanopy(
	rng: () => number,
	blobs: readonly Blob[],
	canopyBudget: number,
	smoothAcuteAnglesForCircles: boolean,
	config: TreeConfig,
): BlobGeometry[] {
	const totalArea = blobs.reduce((sum, b) => sum + b.rx * b.ry, 0);
	const averageArea = blobs.length > 0 ? totalArea / blobs.length : 1;
	const depths = assignBlobDepths(blobs, rng);
	const maxDepth = Math.max(...depths);

	const blobGeos: { geo: BlobGeometry; depth: number }[] = [];

	for (let i = 0; i < blobs.length; i++) {
		const blob = blobs[i]!;
		const blobArea = blob.rx * blob.ry;
		const areaRatio = averageArea > 0 ? blobArea / averageArea : 1;
		const blobBudget = Math.max(4, Math.round(canopyBudget * areaRatio));

		const boundaryCount = Math.max(6, Math.floor(blobBudget * 0.15));
		const rawBoundaryPoints = BOUNDARIES[blob.boundary].sample(
			blob.cx,
			blob.cy,
			blob.rx,
			blob.ry,
			boundaryCount,
			rng,
			blob.rotationDeg ?? 0,
		);
		const shouldSmooth = smoothAcuteAnglesForCircles && blob.boundary === BOUNDARY_KINDS.circle;
		const boundaryPoints = shouldSmooth
			? smoothAcuteBoundaryAngles(rawBoundaryPoints, blob.cx, blob.cy, blob.rx, blob.ry)
			: rawBoundaryPoints;

		const interiorCount = Math.max(3, blobBudget - boundaryCount);
		const blobBounds = {
			minX: blob.cx - blob.rx,
			minY: blob.cy - blob.ry,
			maxX: blob.cx + blob.rx,
			maxY: blob.cy + blob.ry,
		};
		const blobBoxArea =
			(blobBounds.maxX - blobBounds.minX) * (blobBounds.maxY - blobBounds.minY);
		const minDist = Math.max(2, Math.sqrt(blobBoxArea / interiorCount) * 0.5);

		const boundaryShape = BOUNDARIES[blob.boundary];
		const interiorPoints = poissonSample(
			rng,
			interiorCount,
			blobBounds,
			(x, y) =>
				boundaryShape.contains(
					x,
					y,
					blob.cx,
					blob.cy,
					blob.rx,
					blob.ry,
					blob.rotationDeg ?? 0,
				),
			minDist,
		);

		const allPoints = [...boundaryPoints, ...interiorPoints];
		const rawTris = triangulatePoints(allPoints);
		const filtered = rawTris.filter((tri) =>
			isTriangleInsideRegion(tri, (x, y) =>
				boundaryShape.contains(
					x,
					y,
					blob.cx,
					blob.cy,
					blob.rx,
					blob.ry,
					blob.rotationDeg ?? 0,
				),
			),
		);

		const depth = depths[i]!;
		const depthDarkeningFactor =
			maxDepth > 0 ? computeDepthDarkeningFactor(depth / maxDepth) : 1;
		const blobRng = createPrng(config.seed + i * BLOB_FACET_NOISE_SEED_MULTIPLIER);
		const coloredTris: Triangle[] = filtered.map((tri) => ({
			points: tri,
			color: computeCanopyColor(tri, blobBounds, config, blobRng, depthDarkeningFactor),
			group: GEOMETRY_GROUPS.canopy,
		}));
		blobGeos.push({
			geo: { triangles: coloredTris, center: { x: blob.cx, y: blob.cy }, depth },
			depth,
		});
	}

	blobGeos.sort((a, b) => a.depth - b.depth);
	return blobGeos.map((bg) => bg.geo);
}

// ---------------------------------------------------------------------------
// Per-tier canopy triangulation (pine/fir)
// ---------------------------------------------------------------------------

export function generateTierCanopy(
	rng: () => number,
	tiers: readonly Tier[],
	canopyBudget: number,
	config: TreeConfig,
): BlobGeometry[] {
	const tierAreas: number[] = tiers.map((t) => {
		const base = Math.sqrt(
			(t.baseRightX - t.baseLeftX) ** 2 + (t.baseRightY - t.baseLeftY) ** 2,
		);
		const height = Math.sqrt(
			((t.baseLeftX + t.baseRightX) / 2 - t.tipX) ** 2 +
				((t.baseLeftY + t.baseRightY) / 2 - t.tipY) ** 2,
		);
		return (base * height) / 2;
	});
	const totalArea = tierAreas.reduce((sum, a) => sum + a, 0);
	const averageArea = tiers.length > 0 ? totalArea / tiers.length : 1;
	const count = tiers.length;

	const blobGeos: BlobGeometry[] = [];

	for (let i = 0; i < count; i++) {
		const tier = tiers[i]!;
		const areaRatio = averageArea > 0 ? tierAreas[i]! / averageArea : 1;
		const tierBudget = Math.max(4, Math.round(canopyBudget * areaRatio));

		const boundaryCount = Math.max(6, Math.floor(tierBudget * 0.15));
		const boundaryPoints = sampleTierBoundary(tier, boundaryCount, rng);

		const interiorCount = Math.max(3, tierBudget - boundaryCount);
		const tierBounds = {
			minX: Math.min(tier.tipX, tier.baseLeftX, tier.baseRightX),
			minY: Math.min(tier.tipY, tier.baseLeftY, tier.baseRightY),
			maxX: Math.max(tier.tipX, tier.baseLeftX, tier.baseRightX),
			maxY: Math.max(tier.tipY, tier.baseLeftY, tier.baseRightY),
		};
		const tierBoxArea =
			(tierBounds.maxX - tierBounds.minX) * (tierBounds.maxY - tierBounds.minY);
		const minDist = Math.max(2, Math.sqrt(tierBoxArea / interiorCount) * 0.5);

		const interiorPoints = poissonSample(
			rng,
			interiorCount,
			tierBounds,
			(x, y) => isPointInTier(x, y, tier),
			minDist,
		);

		const allPoints = [...boundaryPoints, ...interiorPoints];
		const rawTris = triangulatePoints(allPoints);
		const filtered = rawTris.filter((tri) =>
			isTriangleInsideRegion(tri, (x, y) => isPointInTier(x, y, tier)),
		);

		const depthDarkeningFactor =
			count <= 1 ? 1 : computeDepthDarkeningFactor((count - 1 - i) / (count - 1));
		const tierRng = createPrng(config.seed + i * TIER_FACET_NOISE_SEED_MULTIPLIER);
		const coloredTris: Triangle[] = filtered.map((tri) => ({
			points: tri,
			color: computeCanopyColor(tri, tierBounds, config, tierRng, depthDarkeningFactor),
			group: GEOMETRY_GROUPS.canopy,
		}));

		const depth = count - 1 - i;
		const tierCenterX = (tier.tipX + tier.baseLeftX + tier.baseRightX) / 3;
		const tierCenterY = (tier.tipY + tier.baseLeftY + tier.baseRightY) / 3;
		blobGeos.push({
			triangles: coloredTris,
			center: { x: tierCenterX, y: tierCenterY },
			depth,
		});
	}

	blobGeos.sort((a, b) => a.depth - b.depth);
	return blobGeos;
}
