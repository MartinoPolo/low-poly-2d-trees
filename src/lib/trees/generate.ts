import Delaunator from 'delaunator';
import type {
	TreeConfig,
	TreeGeometry,
	Triangle,
	Quad,
	Point2D,
	TreeAnchors,
	BlobGeometry,
	BranchGeometry,
	Tier,
	TreeShape,
} from './types.js';
import {
	GEOMETRY_GROUPS,
	VIEWBOX_WIDTH,
	VIEWBOX_HEIGHT,
	TREE_SHAPES,
	FRUIT_TYPES,
} from './types.js';
import { applyStageModifiers, generateStakeTriangles } from './stages/index.js';
import { createPrng, poissonSample } from './prng.js';
import {
	getShapeDefinition,
	computeEffectiveTrunkTop,
	isPointInBlobs,
	generateBranches,
	getBlobsBounds,
	sampleTierBoundary,
	assignBlobDepths,
	applyBlobSizeVariance,
	applyBlobCloseness,
	applyCanopySize,
	validateNoFloatingBlobs,
	generateTiers,
	isPointInTier,
	getTiersBounds,
	buildTrunkPath,
	sampleTrunkCenterX,
	generateCustomBlobs,
	generateFruitAtSlots,
	CUSTOM_BLOB_CANOPY_CENTER_X,
	CUSTOM_BLOB_CANOPY_CENTER_Y,
	CUSTOM_BLOB_SPREAD_RADIUS,
	TRUNK_ENTRY_MIN_PX,
	type Blob,
	type BranchSegment,
} from './shapes.js';
import { BOUNDARIES, BOUNDARY_KINDS, smoothAcuteBoundaryAngles } from './boundaries.js';
import { computeCanopyColor, computeTwoToneColors, isLeftSideLight } from './lighting.js';

// REQ-C-12: shapes whose circle-boundary blobs should have acute concavities
// pulled back to the ellipse ring for a rounder silhouette.
const SHAPES_WITH_ACUTE_SMOOTHING = new Set<TreeShape>([
	TREE_SHAPES.oak,
	TREE_SHAPES.birch,
	TREE_SHAPES.maple,
	TREE_SHAPES.willow,
]);

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

const ROOTS_DEPTH_PX = 15;
const FRUIT_SLOTS_SEED_OFFSET = 54321;
const FRUIT_COUNT_CAP = 7;
const FRUIT_CONTAINMENT_INSET_FACTOR = 0.85;

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

function computeAnchors(
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
	const boundsArea =
		(canopyBounds.maxX - canopyBounds.minX) * (canopyBounds.maxY - canopyBounds.minY);
	const minDistance = Math.max(3, Math.sqrt(boundsArea / fruitCount) * 0.6);

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

// ---------------------------------------------------------------------------
// Trunk quad generation (BR-1: stacked trapezoids with centerline)
// ---------------------------------------------------------------------------

function generateTrunkQuads(
	trunkJunctions: readonly Point2D[],
	shapeDef: { readonly trunkBaseWidth: number; readonly trunkTopWidth: number },
	config: TreeConfig,
): Quad[] {
	const thicknessScale = config.trunkThickness / 100;
	const effectiveBaseWidth = shapeDef.trunkBaseWidth * thicknessScale;
	const effectiveTopWidth = shapeDef.trunkTopWidth * thicknessScale;

	const trunkTop = trunkJunctions[trunkJunctions.length - 1]!.y;
	const trunkBottom = trunkJunctions[0]!.y;
	const trunkHeight = trunkBottom - trunkTop;
	if (trunkHeight <= 0) {
		return [];
	}

	const { lightColor, darkColor } = computeTwoToneColors(config);
	// For trunk (vertical direction), angle is ~-PI/2 (pointing up)
	const trunkDirectionAngle = Math.atan2(
		trunkJunctions[trunkJunctions.length - 1]!.y - trunkJunctions[0]!.y,
		trunkJunctions[trunkJunctions.length - 1]!.x - trunkJunctions[0]!.x,
	);
	const leftIsLight = isLeftSideLight(config.lightAngle, trunkDirectionAngle);

	const quads: Quad[] = [];

	// Build one quad per trunk segment (between adjacent junctions)
	for (let i = 0; i < trunkJunctions.length - 1; i++) {
		const bottom = trunkJunctions[i]!;
		const top = trunkJunctions[i + 1]!;

		const tBottom = (bottom.y - trunkTop) / trunkHeight;
		const tTop = (top.y - trunkTop) / trunkHeight;
		const widthBottom = effectiveTopWidth + tBottom * (effectiveBaseWidth - effectiveTopWidth);
		const widthTop = effectiveTopWidth + tTop * (effectiveBaseWidth - effectiveTopWidth);

		// Left half quad (from left edge to centerline)
		const leftColor = leftIsLight ? lightColor : darkColor;
		quads.push({
			points: [
				{ x: top.x - widthTop / 2, y: top.y },
				{ x: top.x, y: top.y },
				{ x: bottom.x, y: bottom.y },
				{ x: bottom.x - widthBottom / 2, y: bottom.y },
			],
			color: leftColor,
			group: GEOMETRY_GROUPS.trunk,
		});

		// Right half quad (from centerline to right edge)
		const rightColor = leftIsLight ? darkColor : lightColor;
		quads.push({
			points: [
				{ x: top.x, y: top.y },
				{ x: top.x + widthTop / 2, y: top.y },
				{ x: bottom.x + widthBottom / 2, y: bottom.y },
				{ x: bottom.x, y: bottom.y },
			],
			color: rightColor,
			group: GEOMETRY_GROUPS.trunk,
		});
	}

	return quads;
}

// ---------------------------------------------------------------------------
// Branch quad generation (BR-3: same quad + centerline system as trunk)
// ---------------------------------------------------------------------------

function generateBranchQuadGroup(
	branch: BranchSegment,
	config: TreeConfig,
	depth: number,
): BranchGeometry {
	const { lightColor, darkColor } = computeTwoToneColors(config);

	const dirX = branch.x2 - branch.x1;
	const dirY = branch.y2 - branch.y1;
	const length = Math.sqrt(dirX * dirX + dirY * dirY);
	if (length === 0) {
		return { quads: [], junctionFills: [], origin: { x: branch.x1, y: branch.y1 }, depth };
	}

	// Unit direction and perpendicular
	const ux = dirX / length;
	const uy = dirY / length;
	const perpX = -uy;
	const perpY = ux;

	const branchAngle = Math.atan2(dirY, dirX);
	const leftIsLight = isLeftSideLight(config.lightAngle, branchAngle);
	const leftColor = leftIsLight ? lightColor : darkColor;
	const rightColor = leftIsLight ? darkColor : lightColor;

	// Single segment: one quad pair (left half + right half)
	const halfStart = branch.widthStart / 2;
	const halfEnd = branch.widthEnd / 2;

	const startLeft: Point2D = {
		x: branch.x1 + perpX * halfStart,
		y: branch.y1 + perpY * halfStart,
	};
	const startCenter: Point2D = { x: branch.x1, y: branch.y1 };
	const startRight: Point2D = {
		x: branch.x1 - perpX * halfStart,
		y: branch.y1 - perpY * halfStart,
	};
	const endLeft: Point2D = { x: branch.x2 + perpX * halfEnd, y: branch.y2 + perpY * halfEnd };
	const endCenter: Point2D = { x: branch.x2, y: branch.y2 };
	const endRight: Point2D = { x: branch.x2 - perpX * halfEnd, y: branch.y2 - perpY * halfEnd };

	const quads: Quad[] = [
		// Left half
		{
			points: [startLeft, startCenter, endCenter, endLeft],
			color: leftColor,
			group: GEOMETRY_GROUPS.branch,
		},
		// Right half
		{
			points: [startCenter, startRight, endRight, endCenter],
			color: rightColor,
			group: GEOMETRY_GROUPS.branch,
		},
	];

	return {
		quads,
		junctionFills: [],
		origin: { x: branch.x1, y: branch.y1 },
		depth,
	};
}

function generateAllBranchQuads(
	branches: readonly BranchSegment[],
	config: TreeConfig,
): BranchGeometry[] {
	return branches.map((branch) => generateBranchQuadGroup(branch, config, 1));
}

// ---------------------------------------------------------------------------
// Per-blob canopy triangulation (unchanged — still uses Delaunay)
// ---------------------------------------------------------------------------

function generateBlobCanopy(
	rng: () => number,
	blobs: readonly Blob[],
	canopyBudget: number,
	smoothAcuteAnglesForCircles: boolean,
	config: TreeConfig,
): BlobGeometry[] {
	const totalArea = blobs.reduce((sum, b) => sum + b.rx * b.ry, 0);
	const averageArea = blobs.length > 0 ? totalArea / blobs.length : 1;
	const depths = assignBlobDepths(blobs, rng);

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

		const coloredTris: Triangle[] = filtered.map((tri) => ({
			points: tri,
			color: computeCanopyColor(tri, blobBounds, config),
			group: GEOMETRY_GROUPS.canopy,
		}));

		const depth = depths[i]!;
		blobGeos.push({
			geo: { triangles: coloredTris, center: { x: blob.cx, y: blob.cy }, depth },
			depth,
		});
	}

	blobGeos.sort((a, b) => a.depth - b.depth);
	return blobGeos.map((bg) => bg.geo);
}

// ---------------------------------------------------------------------------
// Per-tier canopy triangulation (pine — unchanged)
// ---------------------------------------------------------------------------

function generateTierCanopy(
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

		const coloredTris: Triangle[] = filtered.map((tri) => ({
			points: tri,
			color: computeCanopyColor(tri, tierBounds, config),
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

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function generateTree(config: TreeConfig): TreeGeometry {
	if (config.shape !== TREE_SHAPES.custom) {
		const stageResult = applyStageModifiers(config);
		if (stageResult.kind === 'directGeometry') {
			return stageResult.geometry;
		}
		return generateTreeCore(stageResult.config, stageResult.addStakes, stageResult.addFruit);
	}
	return generateTreeCore(config, false, false);
}

function generateTreeCore(config: TreeConfig, addStakes: boolean, addFruit: boolean): TreeGeometry {
	const rng = createPrng(config.seed);
	const shapeDef = getShapeDefinition(config.shape);
	const isPine = config.shape === TREE_SHAPES.pine;
	const isCustom = config.shape === TREE_SHAPES.custom;

	const effectiveTrunkTop = computeEffectiveTrunkTop(shapeDef, config.trunkHeight);
	const canopyDelta = effectiveTrunkTop - shapeDef.defaultTrunkTop;
	const trunkBottom = shapeDef.trunkBottom;

	let trunkJunctions = buildTrunkPath(
		rng,
		config.trunkLean,
		config.trunkSegments,
		config.trunkCrookedness,
		effectiveTrunkTop,
		trunkBottom,
	);
	const topJunctionInitial = trunkJunctions[trunkJunctions.length - 1]!;
	const horizontalCanopyShift = topJunctionInitial.x - VIEWBOX_WIDTH / 2;

	let blobs: Blob[];
	if (isPine) {
		blobs = [];
	} else if (isCustom) {
		blobs = generateCustomBlobs(
			config.customBlobs ?? [],
			config.blobCount,
			CUSTOM_BLOB_CANOPY_CENTER_X,
			CUSTOM_BLOB_CANOPY_CENTER_Y,
			CUSTOM_BLOB_SPREAD_RADIUS,
		);
		for (const blob of blobs) {
			blob.cy += canopyDelta;
			blob.cx += horizontalCanopyShift;
		}
	} else {
		blobs = shapeDef.generateBlobs(rng, config.blobCount);
		applyBlobSizeVariance(blobs, config.blobSizeVariance);
		if (blobs.length > 1) {
			const spreadRadius = VIEWBOX_WIDTH * 0.22;
			applyBlobCloseness(blobs, config.blobCloseness, spreadRadius);
		}
		applyCanopySize(blobs, config.canopySize);
		for (const blob of blobs) {
			blob.cy += canopyDelta;
			blob.cx += horizontalCanopyShift;
		}
	}

	const tiers = isPine
		? generateTiers(
				rng,
				config.blobCount,
				trunkJunctions,
				config.blobCloseness,
				config.blobSizeVariance,
				config.canopySize,
				canopyDelta,
			)
		: [];

	const canopyBounds = isPine
		? getTiersBounds(tiers)
		: blobs.length > 0
			? getBlobsBounds(blobs)
			: {
					minX: VIEWBOX_WIDTH / 2,
					minY: effectiveTrunkTop,
					maxX: VIEWBOX_WIDTH / 2,
					maxY: effectiveTrunkTop + TRUNK_ENTRY_MIN_PX,
				};

	const clampedTrunkTop = Math.min(effectiveTrunkTop, canopyBounds.maxY - TRUNK_ENTRY_MIN_PX);
	if (clampedTrunkTop !== effectiveTrunkTop) {
		const clamped = [...trunkJunctions];
		const top = clamped[clamped.length - 1]!;
		clamped[clamped.length - 1] = { x: top.x, y: clampedTrunkTop };
		trunkJunctions = clamped;
	}
	const trunkTop = trunkJunctions[trunkJunctions.length - 1]!.y;

	// Branch generation: all shapes (including maple) use the generic system (BR-13)
	let branches: BranchSegment[];
	if (isPine) {
		branches = [];
	} else {
		branches = generateBranches(
			createPrng(config.seed + 7777),
			trunkTop,
			trunkBottom,
			shapeDef.trunkTopWidth * (config.trunkThickness / 100),
			config,
			trunkJunctions,
			blobs,
		);
	}

	const extraBranches = isPine ? [] : validateNoFloatingBlobs(blobs, branches);
	const allBranches = [...branches, ...extraBranches];

	// Generate trunk quads (BR-1: stacked trapezoids with centerline)
	const trunkQuads = generateTrunkQuads(trunkJunctions, shapeDef, config);

	// Generate branch quads (BR-3: same quad + centerline system)
	const branchGroups = generateAllBranchQuads(allBranches, config);

	const smoothAcuteAngles = SHAPES_WITH_ACUTE_SMOOTHING.has(config.shape);
	const canopyBlobs = isPine
		? generateTierCanopy(rng, tiers, config.polygonsPerBlob, config)
		: generateBlobCanopy(rng, blobs, config.polygonsPerBlob, smoothAcuteAngles, config);

	const anchors = computeAnchors(
		trunkJunctions,
		canopyBounds,
		allBranches,
		canopyBlobs,
		blobs,
		tiers,
		config.seed,
	);

	const effectiveFruitType = config.fruitType;
	const effectiveFruitCount = Math.min(config.fruitCount, FRUIT_COUNT_CAP);
	let fruitTriangles: Triangle[] = [];

	if (effectiveFruitType !== FRUIT_TYPES.none && effectiveFruitCount > 0) {
		const fruitSlots = [...anchors.fruitSlots];
		const fruitRng = createPrng(config.seed + FRUIT_SLOTS_SEED_OFFSET + 2000);
		fruitTriangles = generateFruitAtSlots(
			effectiveFruitType,
			fruitSlots.slice(0, effectiveFruitCount),
			fruitRng,
		);
	}

	const stakeTriangles = addStakes ? generateStakeTriangles(anchors) : [];
	const fruitSlotsResult = addFruit ? anchors.fruitSlots : [];

	return {
		trunkQuads,
		trunkTriangles: [],
		branchGroups,
		canopyBlobs,
		fruitTriangles,
		stakeTriangles,
		fruitSlots: fruitSlotsResult,
		anchors,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
	};
}
