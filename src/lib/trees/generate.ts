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
	JunctionData,
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
	computeJunctionBisectors,
	generateCustomBlobs,
	CUSTOM_BLOB_CANOPY_CENTER_X,
	CUSTOM_BLOB_CANOPY_CENTER_Y,
	CUSTOM_BLOB_SPREAD_RADIUS,
	TRUNK_ENTRY_MIN_PX,
	type Blob,
	type BranchSegment,
	type GeneratedBranch,
} from './shapes.js';
import { BOUNDARIES, BOUNDARY_KINDS, smoothAcuteBoundaryAngles } from './boundaries.js';
import { computeCanopyColor, computeTriSplitColors, computeStripColors } from './lighting.js';

// REQ-C-12: shapes whose circle-boundary blobs should have acute concavities
// pulled back to the ellipse ring for a rounder silhouette.
const SHAPES_WITH_ACUTE_SMOOTHING = new Set<TreeShape>([
	TREE_SHAPES.oak,
	TREE_SHAPES.birch,
	TREE_SHAPES.maple,
	TREE_SHAPES.willow,
	TREE_SHAPES.apple,
	TREE_SHAPES.cherry,
	TREE_SHAPES.bush,
	TREE_SHAPES.baobab,
	TREE_SHAPES.acacia,
]);

// Shapes that use tier-based canopy rendering instead of blob-based.
const TIERED_SHAPES = new Set<TreeShape>([TREE_SHAPES.pine, TREE_SHAPES.fir]);

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
// Tri-split constants and face width computation
// ---------------------------------------------------------------------------

const TRUNK_SEGMENT_SEED_OFFSET = 500;
const BRANCH_SEED_OFFSET = 700;
/** Center normal xy-perturbation: (rng - 0.5) * this = ±0.15 range. */
const CENTER_NORMAL_PERTURBATION_RANGE = 0.3;

/** Base randomness magnitude for junction strip ratios (REQ-EV2-S-02). */
const BASE_RANDOMNESS_MAGNITUDE = 0.15;

/** Seed offset for junction strip ratio computation. */
const JUNCTION_STRIP_SEED_OFFSET = 900;

// ---------------------------------------------------------------------------

function computeTriSplitFaceWidths(
	rng: () => number,
	trunkTwist: number,
): { leftWidth: number; centerWidth: number; rightWidth: number } {
	const twistFraction = trunkTwist / 100;
	const maxTwistDeg = twistFraction * 30;
	const twistRad = ((rng() * 2 - 1) * maxTwistDeg * Math.PI) / 180;

	// Hex-projection base widths
	let leftWidth = Math.abs(Math.cos(twistRad - Math.PI / 3));
	let centerWidth = Math.abs(Math.cos(twistRad));
	let rightWidth = Math.abs(Math.cos(twistRad + Math.PI / 3));

	// Per-face random scale (range interpolated by twist fraction)
	leftWidth *= 1 + (rng() - 0.5) * twistFraction;
	centerWidth *= 1 + (rng() - 0.5) * twistFraction;
	rightWidth *= 1 + (rng() - 0.5) * twistFraction;

	// Normalize to sum = 1
	const total = leftWidth + centerWidth + rightWidth;
	if (total > 0) {
		leftWidth /= total;
		centerWidth /= total;
		rightWidth /= total;
	} else {
		leftWidth = 0.25;
		centerWidth = 0.5;
		rightWidth = 0.25;
	}

	return { leftWidth, centerWidth, rightWidth };
}

// ---------------------------------------------------------------------------
// Engine v2: Junction-Based Strip Ratios (REQ-EV2-S-01, S-02, S-03)
// ---------------------------------------------------------------------------

/**
 * Compute strip width ratios at each trunk junction. The regular polygon
 * cross-section (2×stripCount faces) is projected at each junction's twist
 * angle. Front-facing faces become visible strips. Base randomness adds
 * organic variation even at twist=0.
 *
 * @returns Array of ratio arrays, one per junction. Each ratio array sums to 1.
 */
export function computeJunctionStripRatios(
	seed: number,
	junctionCount: number,
	stripCount: number,
	trunkTwist: number,
): number[][] {
	const rng = createPrng(seed + JUNCTION_STRIP_SEED_OFFSET);
	const twistFraction = trunkTwist / 100;
	const totalFaces = 2 * stripCount;
	const faceAngleStep = Math.PI / totalFaces;

	// Hybrid cumulative twist: base angle starts seeded, drifts per junction
	let cumulativeTwistAngle = rng() * Math.PI * 2;
	const driftRate = twistFraction * 0.4; // radians per junction at max twist

	const result: number[][] = [];

	for (let j = 0; j < junctionCount; j++) {
		// Per-junction twist perturbation (REQ-EV2-S-03)
		if (j > 0) {
			cumulativeTwistAngle += driftRate * (rng() * 2 - 1);
			cumulativeTwistAngle += twistFraction * 0.15 * (rng() * 2 - 1);
		}

		// Project front-facing faces
		const rawWidths: number[] = [];
		for (let f = 0; f < stripCount; f++) {
			// Face normal angle relative to viewer (front = 0)
			const faceAngle = cumulativeTwistAngle + (f - (stripCount - 1) / 2) * faceAngleStep;
			const projectedWidth = Math.abs(Math.cos(faceAngle));
			rawWidths.push(Math.max(0.01, projectedWidth));
		}

		// Base randomness — organic variation even at twist=0 (REQ-EV2-S-02)
		for (let f = 0; f < stripCount; f++) {
			const perturbation = 1 + (rng() * 2 - 1) * BASE_RANDOMNESS_MAGNITUDE;
			rawWidths[f]! *= perturbation;
		}

		// Normalize to sum = 1
		const total = rawWidths.reduce((a, b) => a + b, 0);
		const ratios = rawWidths.map((w) => (total > 0 ? w / total : 1 / stripCount));
		result.push(ratios);
	}

	return result;
}

// ---------------------------------------------------------------------------
// Engine v2: Hybrid Taper (REQ-EV2-T-01, T-02, T-03)
// ---------------------------------------------------------------------------

/**
 * Compute trunk width at each junction using hybrid taper model.
 * Gentle conical base taper + discrete fork reductions, clamped to floor.
 */
export function computeHybridTaper(
	junctionCount: number,
	baseWidth: number,
	topWidthFloor: number,
	forkReductions: readonly { readonly junctionIndex: number; readonly reduction: number }[],
): number[] {
	const widths: number[] = [];
	// Gentle conical taper: ~25% narrowing from base to tip
	const conicalTaperFraction = 0.25;

	for (let j = 0; j < junctionCount; j++) {
		const t = junctionCount > 1 ? j / (junctionCount - 1) : 0;
		let width = baseWidth * (1 - conicalTaperFraction * t);

		// Apply discrete fork reductions
		for (const fork of forkReductions) {
			if (j >= fork.junctionIndex) {
				width -= fork.reduction;
			}
		}

		widths.push(Math.max(topWidthFloor, width));
	}

	return widths;
}

// ---------------------------------------------------------------------------
// Trunk quad generation — Engine v2: junction-based continuous strips
// ---------------------------------------------------------------------------

/**
 * Compute junction edge points (outer edges + internal strip splits) using
 * bisector perpendicular directions and strip ratios. Returns one point array
 * per junction with stripCount+1 points (left edge, split points, right edge).
 */
function computeJunctionEdgePoints(
	junctions: readonly Point2D[],
	bisectors: readonly { perpX: number; perpY: number }[],
	widths: readonly number[],
	stripRatios: readonly number[][],
	stripCount: number,
): Point2D[][] {
	const allJunctionPoints: Point2D[][] = [];

	for (let j = 0; j < junctions.length; j++) {
		const center = junctions[j]!;
		const bisector = bisectors[j]!;
		const halfWidth = widths[j]! / 2;
		const ratios = stripRatios[j]!;

		// Points from left edge to right edge along bisector perpendicular
		const points: Point2D[] = [];

		// Left edge
		points.push({
			x: center.x + bisector.perpX * halfWidth,
			y: center.y + bisector.perpY * halfWidth,
		});

		// Internal split points
		let accumulatedRatio = 0;
		for (let s = 0; s < stripCount - 1; s++) {
			accumulatedRatio += ratios[s]!;
			const offset = halfWidth - accumulatedRatio * widths[j]!;
			points.push({
				x: center.x + bisector.perpX * offset,
				y: center.y + bisector.perpY * offset,
			});
		}

		// Right edge
		points.push({
			x: center.x - bisector.perpX * halfWidth,
			y: center.y - bisector.perpY * halfWidth,
		});

		allJunctionPoints.push(points);
	}

	return allJunctionPoints;
}

function generateTrunkQuads(
	trunkJunctions: readonly Point2D[],
	shapeDef: { readonly trunkBaseWidth: number; readonly trunkTopWidth: number },
	config: TreeConfig,
): {
	quads: Quad[];
	junctionEdgePoints: Point2D[][];
	junctionWidths: number[];
	stripRatios: number[][];
} {
	const thicknessScale = config.trunkThickness / 100;
	const effectiveBaseWidth = shapeDef.trunkBaseWidth * thicknessScale;
	const effectiveTopWidth = shapeDef.trunkTopWidth * thicknessScale;

	if (trunkJunctions.length < 2) {
		return { quads: [], junctionEdgePoints: [], junctionWidths: [], stripRatios: [] };
	}

	const stripCount = config.trunkStripCount;
	const junctionCount = trunkJunctions.length;

	// Compute junction bisector perpendicular directions (REQ-EV2-J-01)
	const bisectors = computeJunctionBisectors(trunkJunctions);

	// Compute hybrid taper widths at each junction (REQ-EV2-T-01)
	const junctionWidths = computeHybridTaper(
		junctionCount,
		effectiveBaseWidth,
		effectiveTopWidth,
		[],
	);

	// Compute junction strip ratios (REQ-EV2-S-01)
	const stripRatios = computeJunctionStripRatios(
		config.seed,
		junctionCount,
		stripCount,
		config.trunkTwist,
	);

	// Compute shared junction edge points (REQ-EV2-J-02)
	const junctionEdgePoints = computeJunctionEdgePoints(
		trunkJunctions,
		bisectors,
		junctionWidths,
		stripRatios,
		stripCount,
	);

	const quads: Quad[] = [];

	for (let i = 0; i < junctionCount - 1; i++) {
		const bottomPoints = junctionEdgePoints[i]!;
		const topPoints = junctionEdgePoints[i + 1]!;

		const bottom = trunkJunctions[i]!;
		const top = trunkJunctions[i + 1]!;

		// Per-segment PRNG for center perturbation
		const segmentRng = createPrng(config.seed + i * 1000 + TRUNK_SEGMENT_SEED_OFFSET);
		// Consume same number of RNG calls as old computeTriSplitFaceWidths for stability
		segmentRng();
		segmentRng();
		segmentRng();
		segmentRng();

		const centerPerturbX = (segmentRng() - 0.5) * CENTER_NORMAL_PERTURBATION_RANGE;
		const centerPerturbY = (segmentRng() - 0.5) * CENTER_NORMAL_PERTURBATION_RANGE;

		const dirX = top.x - bottom.x;
		const dirY = top.y - bottom.y;

		// Compute per-strip colors using polygonal cross-section model (REQ-EV2-LT-01)
		const stripColors = computeStripColors({
			segmentDirectionX: dirX,
			segmentDirectionY: dirY,
			lightAngle: config.lightAngle,
			trunkHue: config.trunkHue,
			trunkSaturation: config.trunkSaturation,
			trunkLightness: config.trunkLightness,
			centerPerturbationX: centerPerturbX,
			centerPerturbationY: centerPerturbY,
			stripCount,
		});

		// Build quads for each strip using shared junction points
		for (let s = 0; s < stripCount; s++) {
			quads.push({
				points: [topPoints[s]!, topPoints[s + 1]!, bottomPoints[s + 1]!, bottomPoints[s]!],
				color: stripColors[s]!,
				group: GEOMETRY_GROUPS.trunk,
			});
		}
	}

	return { quads, junctionEdgePoints, junctionWidths, stripRatios };
}

// ---------------------------------------------------------------------------
// Branch quad generation (tri-split: 3 quads per segment)
// ---------------------------------------------------------------------------

function generateBranchQuadGroup(
	branch: BranchSegment,
	config: TreeConfig,
	depth: number,
	parentIndex: number | null = null,
): BranchGeometry {
	const dirX = branch.x2 - branch.x1;
	const dirY = branch.y2 - branch.y1;
	const length = Math.sqrt(dirX * dirX + dirY * dirY);
	if (length === 0) {
		return {
			quads: [],
			junctionFills: [],
			origin: { x: branch.x1, y: branch.y1 },
			depth,
			parentIndex,
		};
	}

	// Unit direction and perpendicular (screen-left = (uy, -ux) convention)
	const ux = dirX / length;
	const uy = dirY / length;
	const perpX = -uy;
	const perpY = ux;

	// Per-branch PRNG seeded from position to ensure determinism
	const branchRng = createPrng(
		config.seed +
			Math.round(branch.x1 * 100) +
			Math.round(branch.y1 * 100) +
			BRANCH_SEED_OFFSET,
	);

	const { leftWidth, centerWidth } = computeTriSplitFaceWidths(branchRng, config.trunkTwist);

	const centerPerturbX = (branchRng() - 0.5) * CENTER_NORMAL_PERTURBATION_RANGE;
	const centerPerturbY = (branchRng() - 0.5) * CENTER_NORMAL_PERTURBATION_RANGE;

	const { leftColor, centerColor, rightColor } = computeTriSplitColors({
		segmentDirectionX: dirX,
		segmentDirectionY: dirY,
		lightAngle: config.lightAngle,
		trunkHue: config.trunkHue,
		trunkSaturation: config.trunkSaturation,
		trunkLightness: config.trunkLightness,
		centerPerturbationX: centerPerturbX,
		centerPerturbationY: centerPerturbY,
	});

	// Split offsets along perpendicular (positive = left, negative = right)
	const halfStart = branch.widthStart / 2;
	const halfEnd = branch.widthEnd / 2;

	function splitPoints(
		cx: number,
		cy: number,
		half: number,
	): [Point2D, Point2D, Point2D, Point2D] {
		const leftEdgeOffset = half;
		const leftSplitOffset = half * (1 - 2 * leftWidth);
		const rightSplitOffset = half * (1 - 2 * (leftWidth + centerWidth));
		const rightEdgeOffset = -half;
		return [
			{ x: cx + perpX * leftEdgeOffset, y: cy + perpY * leftEdgeOffset },
			{ x: cx + perpX * leftSplitOffset, y: cy + perpY * leftSplitOffset },
			{ x: cx + perpX * rightSplitOffset, y: cy + perpY * rightSplitOffset },
			{ x: cx + perpX * rightEdgeOffset, y: cy + perpY * rightEdgeOffset },
		];
	}

	const [sLeftEdge, sLeftSplit, sRightSplit, sRightEdge] = splitPoints(
		branch.x1,
		branch.y1,
		halfStart,
	);
	const [eLeftEdge, eLeftSplit, eRightSplit, eRightEdge] = splitPoints(
		branch.x2,
		branch.y2,
		halfEnd,
	);

	const quads: Quad[] = [
		// Left face
		{
			points: [sLeftEdge, sLeftSplit, eLeftSplit, eLeftEdge],
			color: leftColor,
			group: GEOMETRY_GROUPS.branch,
		},
		// Center face
		{
			points: [sLeftSplit, sRightSplit, eRightSplit, eLeftSplit],
			color: centerColor,
			group: GEOMETRY_GROUPS.branch,
		},
		// Right face
		{
			points: [sRightSplit, sRightEdge, eRightEdge, eRightSplit],
			color: rightColor,
			group: GEOMETRY_GROUPS.branch,
		},
	];

	return {
		quads,
		junctionFills: [],
		origin: { x: branch.x1, y: branch.y1 },
		depth,
		parentIndex,
	};
}

function generateAllBranchQuads(
	branches: readonly GeneratedBranch[],
	config: TreeConfig,
): BranchGeometry[] {
	return branches.map((branch) =>
		generateBranchQuadGroup(branch.segment, config, branch.depth, branch.parentIndex),
	);
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

interface StageFlags {
	readonly addStakes: boolean;
	readonly addFruit: boolean;
	readonly addFlowers: boolean;
	readonly addFallingLeaves: boolean;
}

const DEFAULT_STAGE_FLAGS: StageFlags = {
	addStakes: false,
	addFruit: false,
	addFlowers: false,
	addFallingLeaves: false,
};

export function generateTree(config: TreeConfig): TreeGeometry {
	if (config.shape !== TREE_SHAPES.custom) {
		const stageResult = applyStageModifiers(config);
		if (stageResult.kind === 'directGeometry') {
			return stageResult.geometry;
		}
		return generateTreeCore(stageResult.config, {
			addStakes: stageResult.addStakes,
			addFruit: stageResult.addFruit,
			addFlowers: stageResult.addFlowers,
			addFallingLeaves: stageResult.addFallingLeaves,
		});
	}
	// Custom shapes: derive addFruit from config (fruitType and fruitCount)
	const customFlags: StageFlags = {
		...DEFAULT_STAGE_FLAGS,
		addFruit: config.fruitType !== FRUIT_TYPES.none && config.fruitCount > 0,
	};
	return generateTreeCore(config, customFlags);
}

function generateTreeCore(config: TreeConfig, flags: StageFlags): TreeGeometry {
	const rng = createPrng(config.seed);
	const shapeDef = getShapeDefinition(config.shape);
	const isTiered = TIERED_SHAPES.has(config.shape);
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
		config.crookednessMode,
	);
	const topJunctionInitial = trunkJunctions[trunkJunctions.length - 1]!;
	const horizontalCanopyShift = topJunctionInitial.x - VIEWBOX_WIDTH / 2;

	let blobs: Blob[];
	if (isTiered) {
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

	const clampedTrunkTop = Math.min(effectiveTrunkTop, canopyBounds.maxY - TRUNK_ENTRY_MIN_PX);
	if (clampedTrunkTop !== effectiveTrunkTop) {
		const clamped = [...trunkJunctions];
		const top = clamped[clamped.length - 1]!;
		clamped[clamped.length - 1] = { x: top.x, y: clampedTrunkTop };
		trunkJunctions = clamped;
	}
	const trunkTop = trunkJunctions[trunkJunctions.length - 1]!.y;

	// Branch generation: all shapes (including maple) use the generic system (BR-13)
	let branches: GeneratedBranch[];
	if (isTiered) {
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

	const extraSegments = isTiered
		? []
		: validateNoFloatingBlobs(
				blobs,
				branches.map((b) => b.segment),
			);
	const extraBranches: GeneratedBranch[] = extraSegments.map((seg) => ({
		segment: seg,
		depth: 1,
		parentIndex: null,
	}));
	const allBranches = [...branches, ...extraBranches];

	// Rule L validation (REQ-EV2-L-01): trunk tip must connect to branch or canopy
	const topJunction = trunkJunctions[trunkJunctions.length - 1]!;
	const tipInsideCanopy =
		isPointInBlobs(topJunction.x, topJunction.y, blobs) ||
		tiers.some((t) => isPointInTier(topJunction.x, topJunction.y, t));
	const tipHasBranch = allBranches.some(
		(b) =>
			Math.abs(b.segment.x1 - topJunction.x) < 5 &&
			Math.abs(b.segment.y1 - topJunction.y) < 5,
	);
	if (!tipInsideCanopy && !tipHasBranch && allBranches.length > 0) {
		// Emergency: connect trunk tip to nearest canopy blob
		const emergencyRng = createPrng(config.seed + 99999);
		const targetX = blobs.length > 0 ? blobs[0]!.cx : topJunction.x;
		const targetY = blobs.length > 0 ? blobs[0]!.cy : topJunction.y - 20;
		allBranches.push({
			segment: {
				x1: topJunction.x,
				y1: topJunction.y,
				x2: targetX,
				y2: targetY,
				widthStart: 3 * (config.branchThickness / 100),
				widthEnd: 1,
			},
			depth: 1,
			parentIndex: null,
		});
		// Consume RNG for determinism
		emergencyRng();
	}

	// Generate trunk quads — Engine v2: junction-based continuous strips
	const trunkResult = generateTrunkQuads(trunkJunctions, shapeDef, config);
	const trunkQuads = trunkResult.quads;

	// Generate branch quads (BR-3: same quad + centerline system)
	const branchGroups = generateAllBranchQuads(allBranches, config);

	const smoothAcuteAngles = SHAPES_WITH_ACUTE_SMOOTHING.has(config.shape);
	const canopyBlobs = isTiered
		? generateTierCanopy(rng, tiers, config.polygonsPerBlob, config)
		: generateBlobCanopy(rng, blobs, config.polygonsPerBlob, smoothAcuteAngles, config);

	const anchors = computeAnchors(
		trunkJunctions,
		canopyBounds,
		allBranches.map((b) => b.segment),
		canopyBlobs,
		blobs,
		tiers,
		config.seed,
	);

	// Cross-phase contract: branch tip depths (REQ-EV2-C-02)
	const branchTipDepths = allBranches.map((b) => ({
		position: { x: b.segment.x2, y: b.segment.y2 },
		depth: b.depth,
	}));
	const anchorsWithTipDepths = { ...anchors, branchTipDepths };

	const effectiveFruitCount = Math.min(config.fruitCount, FRUIT_COUNT_CAP);
	const stakeTriangles = flags.addStakes ? generateStakeTriangles(anchorsWithTipDepths) : [];
	const fruitSlotsResult = flags.addFruit
		? anchorsWithTipDepths.fruitSlots.slice(0, effectiveFruitCount)
		: [];
	const flowerSlotsResult = flags.addFlowers ? anchorsWithTipDepths.fruitSlots : [];

	// Cross-phase contract: junction data (REQ-EV2-C-01)
	const contractBisectors = computeJunctionBisectors(trunkJunctions);
	const junctionData: JunctionData[] = trunkJunctions.map((pos, i) => ({
		position: pos,
		width: trunkResult.junctionWidths[i] ?? 0,
		stripRatios: trunkResult.stripRatios[i] ?? [],
		bisectorAngle: Math.atan2(contractBisectors[i]!.perpY, contractBisectors[i]!.perpX),
	}));

	return {
		trunkQuads,
		trunkTriangles: [],
		branchGroups,
		canopyBlobs,
		fruitTriangles: [],
		stakeTriangles,
		fruitSlots: fruitSlotsResult,
		flowerSlots: flowerSlotsResult,
		showFallingLeaves: flags.addFallingLeaves,
		anchors: anchorsWithTipDepths,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
		junctionData,
		envelopeBounds: canopyBounds,
	};
}
