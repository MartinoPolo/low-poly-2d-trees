import Delaunator from 'delaunator';
import type {
	TreeConfig,
	TreeGeometry,
	Triangle,
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
import { createPrng, poissonSample, randomInRange } from './prng.js';
import {
	getShapeDefinition,
	computeEffectiveTrunkTop,
	isPointInTrunkPath,
	isPointInBranch,
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
	TRUNK_BRANCH_WIDTH_START_MIN,
	TRUNK_BRANCH_WIDTH_START_MAX,
	TRUNK_BRANCH_WIDTH_END_MIN,
	TRUNK_BRANCH_WIDTH_END_MAX,
	type Blob,
	type BranchSegment,
} from './shapes.js';
import { BOUNDARIES, BOUNDARY_KINDS, smoothAcuteBoundaryAngles } from './boundaries.js';
import { computeCanopyColor, computeTrunkColor } from './lighting.js';

// REQ-C-12: shapes whose circle-boundary blobs should have acute concavities
// pulled back to the ellipse ring for a rounder silhouette. Teardrop blobs are
// gated out per-blob below so fir can be listed here safely if ever needed;
// currently fir relies on its teardrop tip and has no circle smoothing.
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

/**
 * Horizontal bounds of the trunk mesh cover the full polyline plus the base
 * width on each side, so cylinder color mapping keys off the entire visible
 * trunk x-range. Reused by trunk and branch mesh generation.
 */
function computeTrunkXBounds(
	trunkJunctions: readonly Point2D[],
	effectiveBaseWidth: number,
): { minX: number; maxX: number } {
	let minJunctionX = Infinity;
	let maxJunctionX = -Infinity;
	for (const j of trunkJunctions) {
		if (j.x < minJunctionX) {
			minJunctionX = j.x;
		}
		if (j.x > maxJunctionX) {
			maxJunctionX = j.x;
		}
	}
	return {
		minX: minJunctionX - effectiveBaseWidth / 2,
		maxX: maxJunctionX + effectiveBaseWidth / 2,
	};
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
	// trunkMiddle lies on the trunk polyline (not on a straight base→top line)
	// so it remains visually meaningful for multi-segment crooked trunks.
	const midY = (baseJunction.y + topJunction.y) / 2;

	const crownCenter: Point2D = {
		x: (canopyBounds.minX + canopyBounds.maxX) / 2,
		y: (canopyBounds.minY + canopyBounds.maxY) / 2,
	};

	// crownTop: vertex with minimum y across all canopy triangles
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

	// branchTips: endpoint of each branch
	const branchTips: Point2D[] = allBranches.map((b) => ({ x: b.x2, y: b.y2 }));

	// fruitSlots: 5-7 Poisson-sampled points within canopy
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
// Trunk silhouette path (VQ-1: smooth outline for clip-path)
// ---------------------------------------------------------------------------

function generateTrunkSilhouettePath(
	trunkJunctions: readonly Point2D[],
	effectiveBaseWidth: number,
	effectiveTopWidth: number,
): string {
	const points = trunkJunctions;
	if (points.length < 2) {
		return '';
	}
	const trunkTop = points[points.length - 1]!.y;
	const trunkBottom = points[0]!.y;
	const trunkHeight = trunkBottom - trunkTop;
	if (trunkHeight <= 0) {
		return '';
	}

	// Build left and right edge points tracing the trunk outline
	const leftEdge: Point2D[] = [];
	const rightEdge: Point2D[] = [];

	for (let i = points.length - 1; i >= 0; i--) {
		const junction = points[i]!;
		const t = (junction.y - trunkTop) / trunkHeight;
		const width = effectiveTopWidth + t * (effectiveBaseWidth - effectiveTopWidth);
		leftEdge.push({ x: junction.x - width / 2, y: junction.y });
		rightEdge.push({ x: junction.x + width / 2, y: junction.y });
	}

	// Trace: top-left -> bottom-left -> bottom-right -> top-right -> close
	const pathParts: string[] = [];
	pathParts.push(`M ${leftEdge[0]!.x} ${leftEdge[0]!.y}`);
	for (let i = 1; i < leftEdge.length; i++) {
		pathParts.push(`L ${leftEdge[i]!.x} ${leftEdge[i]!.y}`);
	}
	// Bottom edge (left to right)
	const lastRight = rightEdge[rightEdge.length - 1]!;
	pathParts.push(`L ${lastRight.x} ${lastRight.y}`);
	// Right edge (bottom to top)
	for (let i = rightEdge.length - 2; i >= 0; i--) {
		pathParts.push(`L ${rightEdge[i]!.x} ${rightEdge[i]!.y}`);
	}
	pathParts.push('Z');
	return pathParts.join(' ');
}

// ---------------------------------------------------------------------------
// Trunk mesh generation
// ---------------------------------------------------------------------------

function generateTrunkMesh(
	rng: () => number,
	colorRng: () => number,
	shapeDef: { readonly trunkBaseWidth: number; readonly trunkTopWidth: number },
	trunkJunctions: readonly Point2D[],
	trunkBudget: number,
	config: TreeConfig,
): Triangle[] {
	const thicknessScale = config.trunkThickness / 100;
	const effectiveBaseWidth = shapeDef.trunkBaseWidth * thicknessScale;
	const effectiveTopWidth = shapeDef.trunkTopWidth * thicknessScale;

	const trunkTop = trunkJunctions[trunkJunctions.length - 1]!.y;
	const trunkBottom = trunkJunctions[0]!.y;
	const trunkHeight = trunkBottom - trunkTop;

	const trunkPoints: { x: number; y: number }[] = [];
	const trunkSteps = Math.max(3, Math.floor(trunkBudget / 4));

	for (let i = 0; i <= trunkSteps; i++) {
		const t = i / trunkSteps;
		const y = trunkTop + t * trunkHeight;
		const width = effectiveTopWidth + t * (effectiveBaseWidth - effectiveTopWidth);
		const centerX = sampleTrunkCenterX(trunkJunctions, y);
		trunkPoints.push({ x: centerX - width / 2, y });
		trunkPoints.push({ x: centerX + width / 2, y });
		if (i > 0 && i < trunkSteps) {
			trunkPoints.push({
				x: centerX + randomInRange(rng, -width / 4, width / 4),
				y: y + randomInRange(rng, -2, 2),
			});
		}
	}

	// Seed explicit left/right points at each interior junction so kinks in a
	// crooked trunk are accurately triangulated (REQ-T-12).
	for (let i = 1; i < trunkJunctions.length - 1; i++) {
		const junc = trunkJunctions[i]!;
		const tj = (junc.y - trunkTop) / trunkHeight;
		const widthJ = effectiveTopWidth + tj * (effectiveBaseWidth - effectiveTopWidth);
		trunkPoints.push({ x: junc.x - widthJ / 2, y: junc.y });
		trunkPoints.push({ x: junc.x + widthJ / 2, y: junc.y });
	}

	const rawTris = triangulatePoints(trunkPoints);
	const filtered = rawTris.filter((tri) =>
		isTriangleInsideRegion(tri, (x, y) =>
			isPointInTrunkPath(x, y, trunkJunctions, effectiveTopWidth, effectiveBaseWidth),
		),
	);

	const trunkXBounds = computeTrunkXBounds(trunkJunctions, effectiveBaseWidth);

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
	trunkXBounds: { minX: number; maxX: number },
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

	return filtered.map((tri) => ({
		points: tri,
		color: computeTrunkColor(tri, trunkXBounds, config, colorRng),
		group: GEOMETRY_GROUPS.branch,
	}));
}

function generateBranchMesh(
	rng: () => number,
	colorRng: () => number,
	branches: readonly BranchSegment[],
	trunkJunctions: readonly Point2D[],
	shapeDef: { readonly trunkBaseWidth: number },
	config: TreeConfig,
): BranchGeometry[] {
	if (branches.length === 0) {
		return [];
	}

	const effectiveBaseWidth = shapeDef.trunkBaseWidth * (config.trunkThickness / 100);
	const trunkXBounds = computeTrunkXBounds(trunkJunctions, effectiveBaseWidth);

	const groups: BranchGeometry[] = [];

	for (const branch of branches) {
		const branchTris = generateSingleBranchMesh(rng, colorRng, branch, trunkXBounds, config);
		if (branchTris.length > 0) {
			groups.push({
				triangles: branchTris,
				origin: { x: branch.x1, y: branch.y1 },
			});
		}
	}

	return groups;
}

// ---------------------------------------------------------------------------
// Per-blob canopy triangulation
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
		// Teardrop blobs must never be acute-angle smoothed: the smoother would
		// round off the pointy top, destroying the teardrop silhouette. Gate the
		// smoothing per-blob on the boundary kind so shapes containing a mix of
		// boundary types (fir: teardrop + circles) can opt in at shape level
		// without affecting the teardrop.
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
// Per-tier canopy triangulation (pine)
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
// Maple per-blob branches (issue #8)
// ---------------------------------------------------------------------------
//
// Maple emits exactly one branch per canopy blob, originating from the trunk
// just below the canopy bottom and terminating at the blob center. This
// replaces the generic trunk/sub-branch algorithm for maple because the
// blob-per-branch correspondence is intrinsic to the shape. The user-visible
// branchCount slider stays on the UI but is ignored for maple — one branch
// per blob is the intentional spec.

function generateMapleBranches(
	rng: () => number,
	trunkJunctions: readonly Point2D[],
	blobs: readonly Blob[],
	config: TreeConfig,
	canopyBottom: number,
): BranchSegment[] {
	const branchThicknessScale = config.branchThickness / 100;
	const segments: BranchSegment[] = [];
	for (const blob of blobs) {
		const originY = canopyBottom - randomInRange(rng, 5, 15);
		const originX = sampleTrunkCenterX(trunkJunctions, originY);
		const widthStart =
			randomInRange(rng, TRUNK_BRANCH_WIDTH_START_MIN, TRUNK_BRANCH_WIDTH_START_MAX) *
			branchThicknessScale;
		const widthEnd =
			randomInRange(rng, TRUNK_BRANCH_WIDTH_END_MIN, TRUNK_BRANCH_WIDTH_END_MAX) *
			branchThicknessScale;
		segments.push({
			x1: originX,
			y1: originY,
			x2: blob.cx,
			y2: blob.cy,
			widthStart,
			widthEnd,
		});
	}
	return segments;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function generateTree(config: TreeConfig): TreeGeometry {
	// Stage dispatch: custom shape ignores stage entirely.
	if (config.shape !== TREE_SHAPES.custom) {
		const stageResult = applyStageModifiers(config);
		if (stageResult.kind === 'directGeometry') {
			return stageResult.geometry;
		}
		// Use modified config for the rest of the pipeline
		return generateTreeCore(stageResult.config, stageResult.addStakes, stageResult.addFruit);
	}
	return generateTreeCore(config, false, false);
}

function generateTreeCore(config: TreeConfig, addStakes: boolean, addFruit: boolean): TreeGeometry {
	const rng = createPrng(config.seed);
	const shapeDef = getShapeDefinition(config.shape);
	const tieredShapes = new Set<TreeShape>([TREE_SHAPES.pine, TREE_SHAPES.fir]);
	const isTiered = tieredShapes.has(config.shape);
	const isCustom = config.shape === TREE_SHAPES.custom;

	const effectiveTrunkTop = computeEffectiveTrunkTop(shapeDef, config.trunkHeight);
	// Canopy must follow trunk top so that raising/lowering the trunk shifts the
	// whole canopy in lock-step. Delta is the per-axis offset applied to every
	// blob cy (and tier y) after shape-specific positioning runs at defaults.
	const canopyDelta = effectiveTrunkTop - shapeDef.defaultTrunkTop;
	const trunkBottom = shapeDef.trunkBottom;

	// Build the trunk path first (driven by the trunkLean/trunkSegments/
	// trunkCrookedness params — REQ-T-11, REQ-T-12). This replaces the old
	// random jitter. trunkTop here is the pre-clamp effective top; we may
	// tighten it after canopy bounds are known.
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
	if (isTiered) {
		blobs = [];
	} else if (isCustom) {
		// Custom tree: user-placed blobs from `config.customBlobs`. The spread
		// radius, canopy center, and trunkDelta follow the trunk top so the
		// custom layout rises/falls with the trunkHeight slider exactly like
		// the other shapes — but we skip size-variance, closeness, and
		// canopy-size scaling because those are the user's job per blob.
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
			// REQ-T-12d: canopy follows the topmost trunk segment horizontally.
			blob.cx += horizontalCanopyShift;
		}
	}

	const tiers = isTiered
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

	// Custom trees may legitimately have zero blobs (user dragged blobCount to
	// 0 with no overrides yet). Fall back to trivial bounds anchored on the
	// current trunk top so `computeAnchors` and the trunk-penetration clamp
	// below stay well-defined.
	const canopyBounds = isTiered
		? getTiersBounds(tiers)
		: blobs.length > 0
			? getBlobsBounds(blobs)
			: {
					minX: VIEWBOX_WIDTH / 2,
					minY: effectiveTrunkTop,
					maxX: VIEWBOX_WIDTH / 2,
					maxY: effectiveTrunkTop + TRUNK_ENTRY_MIN_PX,
				};

	// Enforce the trunk-penetration invariant: trunk top must enter the lowest
	// canopy edge by at least TRUNK_ENTRY_MIN_PX. If the user's chosen trunk
	// height would leave the trunk dangling below the canopy, clamp upward.
	// When clamping is needed we substitute the topmost junction with the
	// clamped y while preserving its x (so the lean/crookedness choices remain
	// visible).
	const clampedTrunkTop = Math.min(effectiveTrunkTop, canopyBounds.maxY - TRUNK_ENTRY_MIN_PX);
	if (clampedTrunkTop !== effectiveTrunkTop) {
		const clamped = [...trunkJunctions];
		const top = clamped[clamped.length - 1]!;
		clamped[clamped.length - 1] = { x: top.x, y: clampedTrunkTop };
		trunkJunctions = clamped;
	}
	const trunkTop = trunkJunctions[trunkJunctions.length - 1]!.y;

	// Branch generation dispatch:
	//   - pine has no branches
	//   - maple emits one branch per canopy blob (issue #8) using
	//     generateMapleBranches — this replaces the generic algorithm because
	//     every blob needs a dedicated branch from the trunk. The user-visible
	//     branchCount slider is intentionally ignored for maple (spec).
	//   - all other shapes use the generic generateBranches entry point.
	// The maple branch rng uses the same seed offset (+7777) as the generic
	// branch path so determinism holds across shape switches.
	let branches: BranchSegment[];
	if (isTiered) {
		branches = [];
	} else if (config.shape === TREE_SHAPES.maple) {
		const mapleRng = createPrng(config.seed + 7777);
		// Reuse the already-computed canopyBounds (getBlobsBounds result from
		// above) rather than recomputing. For maple this is always the blob
		// bounds path (pine is excluded by the outer branch).
		const canopyBottomY = blobs.length > 0 ? canopyBounds.maxY : trunkTop;
		branches = generateMapleBranches(mapleRng, trunkJunctions, blobs, config, canopyBottomY);
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

	const extraBranches = isTiered ? [] : validateNoFloatingBlobs(blobs, branches);
	const allBranches = [...branches, ...extraBranches];

	const trunkTriangles = generateTrunkMesh(
		rng,
		createPrng(config.seed + 9999),
		shapeDef,
		trunkJunctions,
		config.trunkPolygons,
		config,
	);

	const thicknessScale = config.trunkThickness / 100;
	const trunkSilhouettePath = generateTrunkSilhouettePath(
		trunkJunctions,
		shapeDef.trunkBaseWidth * thicknessScale,
		shapeDef.trunkTopWidth * thicknessScale,
	);

	const branchGroups = generateBranchMesh(
		rng,
		createPrng(config.seed + 9999),
		allBranches,
		trunkJunctions,
		shapeDef,
		config,
	);
	const branchTriangles = branchGroups.flatMap((g) => g.triangles);

	const smoothAcuteAngles = SHAPES_WITH_ACUTE_SMOOTHING.has(config.shape);
	const canopyBlobs = isTiered
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

	// Fruit generation: produce triangulated fruit shapes at anchor slots
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
		trunkTriangles,
		trunkSilhouettePath,
		branchTriangles,
		branchGroups,
		canopyBlobs,
		fruitTriangles,
		stakeTriangles,
		fruitSlots: fruitSlotsResult,
		anchors,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
	};
}
