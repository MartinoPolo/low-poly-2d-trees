import Delaunator from 'delaunator';
import type {
	TreeConfig,
	TreeGeometry,
	Triangle,
	Point2D,
	TreeAnchors,
	BlobGeometry,
	Tier,
} from './types.js';
import { GEOMETRY_GROUPS, VIEWBOX_WIDTH, VIEWBOX_HEIGHT, TREE_SHAPES } from './types.js';
import { createPrng, poissonSample, randomInRange } from './prng.js';
import {
	getShapeDefinition,
	computeEffectiveTrunkTop,
	isPointInTrunk,
	isPointInBranch,
	generateBranches,
	getBlobsBounds,
	sampleBlobBoundary,
	sampleTierBoundary,
	assignBlobDepths,
	applyBlobSizeVariance,
	applyBlobCloseness,
	applyCanopySize,
	validateNoFloatingBlobs,
	generateTiers,
	isPointInTier,
	getTiersBounds,
	TRUNK_ENTRY_MIN_PX,
	type Blob,
	type BranchSegment,
} from './shapes.js';
import { computeCanopyColor, computeTrunkColor } from './lighting.js';

function triangulatePoints(
	points: readonly { x: number; y: number }[],
): [Point2D, Point2D, Point2D][] {
	if (points.length < 3) {
		return [];
	}

	const coords = new Float64Array(points.length * 2);
	for (let i = 0; i < points.length; i++) {
		coords[i * 2] = points[i]!.x;
		coords[i * 2 + 1] = points[i]!.y;
	}

	const d = new Delaunator(coords);
	const triangles: [Point2D, Point2D, Point2D][] = [];

	for (let i = 0; i < d.triangles.length; i += 3) {
		const i0 = d.triangles[i]!;
		const i1 = d.triangles[i + 1]!;
		const i2 = d.triangles[i + 2]!;
		triangles.push([
			{ x: coords[i0 * 2]!, y: coords[i0 * 2 + 1]! },
			{ x: coords[i1 * 2]!, y: coords[i1 * 2 + 1]! },
			{ x: coords[i2 * 2]!, y: coords[i2 * 2 + 1]! },
		]);
	}

	return triangles;
}

function isTriangleInsideRegion(
	tri: readonly [Point2D, Point2D, Point2D],
	test: (x: number, y: number) => boolean,
): boolean {
	const cx = (tri[0].x + tri[1].x + tri[2].x) / 3;
	const cy = (tri[0].y + tri[1].y + tri[2].y) / 3;
	return test(cx, cy);
}

function computeAnchors(
	trunkTop: number,
	trunkBottom: number,
	trunkLean: number,
	canopyBounds: { minX: number; minY: number; maxX: number; maxY: number },
): TreeAnchors {
	const trunkCenterX = VIEWBOX_WIDTH / 2;
	const trunkHeight = trunkBottom - trunkTop;

	return {
		trunkTop: {
			x: trunkCenterX + trunkLean,
			y: trunkTop,
		},
		trunkMiddle: {
			x: trunkCenterX + trunkLean * 0.5,
			y: trunkTop + trunkHeight * 0.5,
		},
		trunkBottom: {
			x: trunkCenterX,
			y: trunkBottom,
		},
		canopyCenter: {
			x: (canopyBounds.minX + canopyBounds.maxX) / 2,
			y: (canopyBounds.minY + canopyBounds.maxY) / 2,
		},
	};
}

// ---------------------------------------------------------------------------
// Trunk mesh generation
// ---------------------------------------------------------------------------

function generateTrunkMesh(
	rng: () => number,
	colorRng: () => number,
	shapeDef: { readonly trunkBaseWidth: number; readonly trunkTopWidth: number },
	trunkTop: number,
	trunkBottom: number,
	trunkLean: number,
	trunkBudget: number,
	config: TreeConfig,
): Triangle[] {
	const thicknessScale = config.trunkThickness / 100;
	const effectiveBaseWidth = shapeDef.trunkBaseWidth * thicknessScale;
	const effectiveTopWidth = shapeDef.trunkTopWidth * thicknessScale;

	const trunkPoints: { x: number; y: number }[] = [];
	const trunkSteps = Math.max(3, Math.floor(trunkBudget / 4));

	for (let i = 0; i <= trunkSteps; i++) {
		const t = i / trunkSteps;
		const y = trunkTop + t * (trunkBottom - trunkTop);
		const width = effectiveTopWidth + t * (effectiveBaseWidth - effectiveTopWidth);
		const centerX = VIEWBOX_WIDTH / 2 + trunkLean * (1 - t);
		trunkPoints.push({ x: centerX - width / 2, y });
		trunkPoints.push({ x: centerX + width / 2, y });
		if (i > 0 && i < trunkSteps) {
			trunkPoints.push({
				x: centerX + randomInRange(rng, -width / 4, width / 4),
				y: y + randomInRange(rng, -2, 2),
			});
		}
	}

	const rawTris = triangulatePoints(trunkPoints);
	const filtered = rawTris.filter((tri) =>
		isTriangleInsideRegion(tri, (x, y) =>
			isPointInTrunk(
				x,
				y,
				trunkTop,
				trunkBottom,
				effectiveTopWidth,
				effectiveBaseWidth,
				trunkLean,
			),
		),
	);

	const trunkXBounds = {
		minX: VIEWBOX_WIDTH / 2 - effectiveBaseWidth / 2 + Math.min(0, trunkLean),
		maxX: VIEWBOX_WIDTH / 2 + effectiveBaseWidth / 2 + Math.max(0, trunkLean),
	};

	return filtered.map((tri) => ({
		points: tri,
		color: computeTrunkColor(tri, trunkXBounds, config, colorRng),
		group: GEOMETRY_GROUPS.trunk,
	}));
}

// ---------------------------------------------------------------------------
// Per-branch mesh generation (D1: each branch triangulated independently)
// ---------------------------------------------------------------------------

function generateSingleBranchMesh(
	rng: () => number,
	colorRng: () => number,
	branch: BranchSegment,
	trunkLean: number,
	trunkBaseWidth: number,
	config: TreeConfig,
): Triangle[] {
	const branchPoints: { x: number; y: number }[] = [];
	const segSteps = 3;

	for (let i = 0; i <= segSteps; i++) {
		const t = i / segSteps;
		const px = branch.x1 + t * (branch.x2 - branch.x1);
		const py = branch.y1 + t * (branch.y2 - branch.y1);
		const localWidth = branch.widthStart + t * (branch.widthEnd - branch.widthStart);
		const halfW = localWidth / 2;
		const nx = -(branch.y2 - branch.y1);
		const ny = branch.x2 - branch.x1;
		const len = Math.sqrt(nx * nx + ny * ny);
		if (len > 0) {
			branchPoints.push({ x: px + (nx / len) * halfW, y: py + (ny / len) * halfW });
			branchPoints.push({ x: px - (nx / len) * halfW, y: py - (ny / len) * halfW });
		}
	}

	if (branchPoints.length < 3) {
		return [];
	}

	const rawTris = triangulatePoints(branchPoints);
	const filtered = rawTris.filter((tri) =>
		isTriangleInsideRegion(tri, (x, y) => isPointInBranch(x, y, [branch])),
	);

	const branchXBounds = {
		minX: VIEWBOX_WIDTH / 2 - trunkBaseWidth / 2 + Math.min(0, trunkLean),
		maxX: VIEWBOX_WIDTH / 2 + trunkBaseWidth / 2 + Math.max(0, trunkLean),
	};

	return filtered.map((tri) => ({
		points: tri,
		color: computeTrunkColor(tri, branchXBounds, config, colorRng),
		group: GEOMETRY_GROUPS.branch,
	}));
}

function generateBranchMesh(
	rng: () => number,
	colorRng: () => number,
	branches: readonly BranchSegment[],
	trunkLean: number,
	shapeDef: { readonly trunkBaseWidth: number },
	config: TreeConfig,
): Triangle[] {
	if (branches.length === 0) {
		return [];
	}

	const allTriangles: Triangle[] = [];

	for (const branch of branches) {
		const branchTris = generateSingleBranchMesh(
			rng,
			colorRng,
			branch,
			trunkLean,
			shapeDef.trunkBaseWidth * (config.trunkThickness / 100),
			config,
		);
		allTriangles.push(...branchTris);
	}

	return allTriangles;
}

// ---------------------------------------------------------------------------
// Per-blob canopy triangulation
// ---------------------------------------------------------------------------

function generateBlobCanopy(
	rng: () => number,
	colorRng: () => number,
	blobs: readonly Blob[],
	canopyBudget: number,
	smoothAcuteAngles: boolean,
	config: TreeConfig,
): BlobGeometry[] {
	const totalArea = blobs.reduce((sum, b) => sum + b.rx * b.ry, 0);
	const depths = assignBlobDepths(blobs, rng);

	const blobGeos: { geo: BlobGeometry; depth: number }[] = [];

	for (let i = 0; i < blobs.length; i++) {
		const blob = blobs[i]!;
		const blobArea = blob.rx * blob.ry;
		const polygonShare = totalArea > 0 ? blobArea / totalArea : 1 / blobs.length;
		const blobBudget = Math.max(4, Math.round(canopyBudget * polygonShare));

		const boundaryCount = Math.max(6, Math.floor(blobBudget * 0.15));
		const boundaryPoints = sampleBlobBoundary(blob, boundaryCount, rng, smoothAcuteAngles);

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

		const interiorPoints = poissonSample(
			rng,
			interiorCount,
			blobBounds,
			(x, y) => {
				const dx = (x - blob.cx) / blob.rx;
				const dy = (y - blob.cy) / blob.ry;
				return dx * dx + dy * dy <= 1;
			},
			minDist,
		);

		const allPoints = [...boundaryPoints, ...interiorPoints];
		const rawTris = triangulatePoints(allPoints);
		const filtered = rawTris.filter((tri) =>
			isTriangleInsideRegion(tri, (x, y) => {
				const dx = (x - blob.cx) / blob.rx;
				const dy = (y - blob.cy) / blob.ry;
				return dx * dx + dy * dy <= 1;
			}),
		);

		const coloredTris: Triangle[] = filtered.map((tri) => ({
			points: tri,
			color: computeCanopyColor(tri, blobBounds, config, colorRng),
			group: GEOMETRY_GROUPS.canopy,
		}));

		const depth = depths[i]!;
		blobGeos.push({
			geo: { triangles: coloredTris, depth },
			depth,
		});
	}

	blobGeos.sort((a, b) => a.depth - b.depth);
	return blobGeos.map((bg) => bg.geo);
}

// ---------------------------------------------------------------------------
// Per-tier canopy triangulation (pine)
// ---------------------------------------------------------------------------

function generateTierCanopy(
	rng: () => number,
	colorRng: () => number,
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
	const count = tiers.length;

	const blobGeos: BlobGeometry[] = [];

	for (let i = 0; i < count; i++) {
		const tier = tiers[i]!;
		const areaShare = totalArea > 0 ? tierAreas[i]! / totalArea : 1 / count;
		const tierBudget = Math.max(4, Math.round(canopyBudget * areaShare));

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

		const coloredTris: Triangle[] = filtered.map((tri) => ({
			points: tri,
			color: computeCanopyColor(tri, tierBounds, config, colorRng),
			group: GEOMETRY_GROUPS.canopy,
		}));

		const depth = count - 1 - i;
		blobGeos.push({ triangles: coloredTris, depth });
	}

	blobGeos.sort((a, b) => a.depth - b.depth);
	return blobGeos;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function generateTree(config: TreeConfig): TreeGeometry {
	const rng = createPrng(config.seed);
	const shapeDef = getShapeDefinition(config.shape);
	const isPine = config.shape === TREE_SHAPES.pine;

	const effectiveTrunkTop = computeEffectiveTrunkTop(shapeDef, config.trunkHeight);
	// Canopy must follow trunk top so that raising/lowering the trunk shifts the
	// whole canopy in lock-step. Delta is the per-axis offset applied to every
	// blob cy (and tier y) after shape-specific positioning runs at defaults.
	const canopyDelta = effectiveTrunkTop - shapeDef.defaultTrunkTop;

	const trunkLean = randomInRange(rng, -8, 8);

	const blobs = isPine ? [] : shapeDef.generateBlobs(rng, config.blobCount);

	if (!isPine) {
		applyBlobSizeVariance(blobs, config.blobSizeVariance);
	}

	if (!isPine && blobs.length > 1) {
		const spreadRadius = VIEWBOX_WIDTH * 0.22;
		applyBlobCloseness(blobs, config.blobCloseness, spreadRadius);
	}

	if (!isPine) {
		applyCanopySize(blobs, config.canopySize);
		for (const blob of blobs) {
			blob.cy += canopyDelta;
		}
	}

	const tiers = isPine
		? generateTiers(
				rng,
				config.blobCount,
				trunkLean,
				effectiveTrunkTop,
				shapeDef.trunkBottom,
				config.blobCloseness,
				config.blobSizeVariance,
				config.canopySize,
				canopyDelta,
			)
		: [];

	const canopyBounds = isPine ? getTiersBounds(tiers) : getBlobsBounds(blobs);

	// Enforce the trunk-penetration invariant: trunk top must enter the lowest
	// canopy edge by at least TRUNK_ENTRY_MIN_PX. If the user's chosen trunk
	// height would leave the trunk dangling below the canopy, clamp upward.
	const trunkTop = Math.min(effectiveTrunkTop, canopyBounds.maxY - TRUNK_ENTRY_MIN_PX);
	const trunkBottom = shapeDef.trunkBottom;

	const branches = isPine
		? []
		: generateBranches(
				rng,
				trunkTop,
				trunkBottom,
				shapeDef.trunkTopWidth * (config.trunkThickness / 100),
				config,
				trunkLean,
				blobs,
			);

	const extraBranches = isPine ? [] : validateNoFloatingBlobs(blobs, branches);
	const allBranches = [...branches, ...extraBranches];

	const trunkTriangles = generateTrunkMesh(
		rng,
		createPrng(config.seed + 9999),
		shapeDef,
		trunkTop,
		trunkBottom,
		trunkLean,
		config.trunkPolygons,
		config,
	);

	const branchTriangles = generateBranchMesh(
		rng,
		createPrng(config.seed + 9999),
		allBranches,
		trunkLean,
		shapeDef,
		config,
	);

	const smoothAcuteAngles =
		config.shape === TREE_SHAPES.oak || config.shape === TREE_SHAPES.birch;
	const canopyBlobs = isPine
		? generateTierCanopy(
				rng,
				createPrng(config.seed + 9999),
				tiers,
				config.canopyPolygons,
				config,
			)
		: generateBlobCanopy(
				rng,
				createPrng(config.seed + 9999),
				blobs,
				config.canopyPolygons,
				smoothAcuteAngles,
				config,
			);

	const anchors = computeAnchors(trunkTop, trunkBottom, trunkLean, canopyBounds);

	return {
		trunkTriangles,
		branchTriangles,
		canopyBlobs,
		anchors,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
	};
}
