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
	computeZoneSplit,
	generateCustomBlobs,
	CUSTOM_BLOB_CANOPY_CENTER_X,
	CUSTOM_BLOB_CANOPY_CENTER_Y,
	CUSTOM_BLOB_SPREAD_RADIUS,
	TRUNK_ENTRY_MIN_PX,
	type Blob,
	type BranchSegment,
	type GeneratedBranch,
	type ForkReduction,
} from './shapes.js';
import { BOUNDARIES, BOUNDARY_KINDS, smoothAcuteBoundaryAngles } from './boundaries.js';
import { computeCanopyColor, computeStripColors } from './lighting.js';

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

/** Gentle conical taper: trunk narrows by this fraction from base to tip (REQ-EV2-T-01). */
const CONICAL_TAPER_FRACTION = 0.25;

/** Seed offset for junction strip ratio computation. */
const JUNCTION_STRIP_SEED_OFFSET = 900;

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
			rawWidths.push(Math.max(0, projectedWidth));
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

	for (let j = 0; j < junctionCount; j++) {
		const t = junctionCount > 1 ? j / (junctionCount - 1) : 0;
		let width = baseWidth * (1 - CONICAL_TAPER_FRACTION * t);

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
	forkReductions: readonly { readonly junctionIndex: number; readonly reduction: number }[] = [],
): {
	quads: Quad[];
	junctionEdgePoints: Point2D[][];
	junctionWidths: number[];
	stripRatios: number[][];
	bisectors: readonly { perpX: number; perpY: number }[];
} {
	const thicknessScale = config.trunkThickness / 100;
	const effectiveBaseWidth = shapeDef.trunkBaseWidth * thicknessScale;
	const effectiveTopWidth = shapeDef.trunkTopWidth * thicknessScale;

	if (trunkJunctions.length < 2) {
		return {
			quads: [],
			junctionEdgePoints: [],
			junctionWidths: [],
			stripRatios: [],
			bisectors: [],
		};
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
		forkReductions,
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

	return { quads, junctionEdgePoints, junctionWidths, stripRatios, bisectors };
}

// ---------------------------------------------------------------------------
// Branch quad generation — Engine v2: variable strip count (REQ-EV2-B-01/02/03/04)
// ---------------------------------------------------------------------------

/** Twist attenuation per depth: L1=full, L2=50%, L3+=0% (REQ-EV2-B-03). */
const TWIST_ATTENUATION_BY_DEPTH: Record<number, number> = { 1: 1.0, 2: 0.5 };

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

	const perpX = -dirY / length;
	const perpY = dirX / length;

	// Per-branch PRNG seeded from position to ensure determinism
	const branchRng = createPrng(
		config.seed +
			Math.round(branch.x1 * 100) +
			Math.round(branch.y1 * 100) +
			BRANCH_SEED_OFFSET,
	);

	const centerPerturbX = (branchRng() - 0.5) * CENTER_NORMAL_PERTURBATION_RANGE;
	const centerPerturbY = (branchRng() - 0.5) * CENTER_NORMAL_PERTURBATION_RANGE;

	// REQ-EV2-B-02: L3+ uses single plain quad (no strip system)
	if (depth >= 3) {
		const halfStart = branch.widthStart / 2;
		const halfEnd = branch.widthEnd / 2;
		const colors = computeStripColors({
			segmentDirectionX: dirX,
			segmentDirectionY: dirY,
			lightAngle: config.lightAngle,
			trunkHue: config.trunkHue,
			trunkSaturation: config.trunkSaturation,
			trunkLightness: config.trunkLightness,
			centerPerturbationX: centerPerturbX,
			centerPerturbationY: centerPerturbY,
			stripCount: 1,
		});
		const quads: Quad[] = [
			{
				points: [
					{ x: branch.x1 + perpX * halfStart, y: branch.y1 + perpY * halfStart },
					{ x: branch.x1 - perpX * halfStart, y: branch.y1 - perpY * halfStart },
					{ x: branch.x2 - perpX * halfEnd, y: branch.y2 - perpY * halfEnd },
					{ x: branch.x2 + perpX * halfEnd, y: branch.y2 + perpY * halfEnd },
				],
				color: colors[0]!,
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

	// REQ-EV2-B-01: L1/L2 use variable strip count with junction continuity
	const stripCount = config.trunkStripCount;
	const twistAttenuation = TWIST_ATTENUATION_BY_DEPTH[depth] ?? 0;
	const effectiveTwist = config.trunkTwist * twistAttenuation;

	// Compute strip ratios for branch (2 junctions: start + end)
	const branchStripRatios = computeJunctionStripRatios(
		config.seed + Math.round(branch.x1 * 100) + Math.round(branch.y1 * 100),
		2,
		stripCount,
		effectiveTwist,
	);

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

	// Compute edge points at start and end using strip ratios
	function computeEdgePoints(cx: number, cy: number, half: number, ratios: number[]): Point2D[] {
		const points: Point2D[] = [];
		points.push({ x: cx + perpX * half, y: cy + perpY * half });
		let accRatio = 0;
		for (let s = 0; s < stripCount - 1; s++) {
			accRatio += ratios[s]!;
			const offset = half - accRatio * half * 2;
			points.push({ x: cx + perpX * offset, y: cy + perpY * offset });
		}
		points.push({ x: cx - perpX * half, y: cy - perpY * half });
		return points;
	}

	const halfStart = branch.widthStart / 2;
	const halfEnd = branch.widthEnd / 2;
	const startPoints = computeEdgePoints(branch.x1, branch.y1, halfStart, branchStripRatios[0]!);
	const endPoints = computeEdgePoints(branch.x2, branch.y2, halfEnd, branchStripRatios[1]!);

	const quads: Quad[] = [];
	for (let s = 0; s < stripCount; s++) {
		quads.push({
			points: [startPoints[s]!, startPoints[s + 1]!, endPoints[s + 1]!, endPoints[s]!],
			color: stripColors[s]!,
			group: GEOMETRY_GROUPS.branch,
		});
	}

	// REQ-EV2-F-02: junction collar quad at fork point
	// The collar bridges between the trunk edge and branch start, colored with the
	// outermost strip color from the branch side (peel-off continuity).
	const junctionFills: Quad[] = [];
	const collarLength = Math.min(3, length * 0.15);
	if (collarLength > 0.5) {
		const collarColor = stripColors[0]!;
		// Collar extends from branch origin slightly along the branch direction
		const collarEndX = branch.x1 + (dirX / length) * collarLength;
		const collarEndY = branch.y1 + (dirY / length) * collarLength;
		const collarHalfEnd = halfStart * 0.85;
		junctionFills.push({
			points: [
				{ x: branch.x1 + perpX * halfStart * 1.1, y: branch.y1 + perpY * halfStart * 1.1 },
				{ x: branch.x1 - perpX * halfStart * 1.1, y: branch.y1 - perpY * halfStart * 1.1 },
				{ x: collarEndX - perpX * collarHalfEnd, y: collarEndY - perpY * collarHalfEnd },
				{ x: collarEndX + perpX * collarHalfEnd, y: collarEndY + perpY * collarHalfEnd },
			],
			color: collarColor,
			group: GEOMETRY_GROUPS.branch,
		});
	}

	return {
		quads,
		junctionFills,
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

	// REQ-EV2-TZ-02: enforce minimum trunk segments when branches are enabled
	const maxL1 = config.branchesLevel1Range[1];
	const hasBranches = config.branchDepth > 0 && maxL1 > 0;
	const { lowerZoneSegments, upperZoneSegments } = computeZoneSplit(
		config.trunkSegments,
		hasBranches ? maxL1 : 0,
	);
	const effectiveTrunkSegments = hasBranches
		? lowerZoneSegments + upperZoneSegments
		: config.trunkSegments;

	let trunkJunctions = buildTrunkPath(
		rng,
		config.trunkLean,
		effectiveTrunkSegments,
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
	let forkReductions: ForkReduction[] = [];
	if (isTiered) {
		branches = [];
	} else {
		const thicknessScale = config.trunkThickness / 100;
		const branchResult = generateBranches(
			createPrng(config.seed + 7777),
			trunkTop,
			trunkBottom,
			shapeDef.trunkTopWidth * thicknessScale,
			config,
			trunkJunctions,
			blobs,
			shapeDef.trunkBaseWidth * thicknessScale,
		);
		branches = branchResult.branches;
		forkReductions = branchResult.forkReductions;

		// REQ-EV2-G-02: Trunk centerline displacement opposite to branch at fork junctions.
		// For each L1 branch, shift all trunk junctions above the fork away from the branch.
		if (branches.length > 0) {
			const displaced = [...trunkJunctions];
			for (const branch of branches) {
				if (branch.depth !== 1) {
					continue;
				}
				// Find the closest junction to the branch origin
				let closestIdx = 0;
				let closestDist = Infinity;
				for (let j = 0; j < displaced.length; j++) {
					const dist = Math.abs(displaced[j]!.y - branch.segment.y1);
					if (dist < closestDist) {
						closestDist = dist;
						closestIdx = j;
					}
				}
				// Branch direction: origin to tip
				const branchDirX = branch.segment.x2 - branch.segment.x1;
				// Displacement opposite to branch X direction, 2-5px proportional to width fraction
				const thicknessScale = config.trunkThickness / 100;
				const trunkWidthAtFork = shapeDef.trunkBaseWidth * thicknessScale;
				const widthFraction =
					trunkWidthAtFork > 0 ? branch.segment.widthStart / trunkWidthAtFork : 0;
				const displacementPx = 2 + widthFraction * 3; // 2-5px range
				const displacementDir = branchDirX > 0 ? -1 : 1;
				// Shift all junctions above the fork point
				for (let j = closestIdx; j < displaced.length; j++) {
					const attenuation = j === closestIdx ? 0.5 : 1.0;
					displaced[j] = {
						x: displaced[j]!.x + displacementDir * displacementPx * attenuation,
						y: displaced[j]!.y,
					};
				}
			}
			trunkJunctions = displaced;
		}
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
	}

	// Generate trunk quads — Engine v2: junction-based continuous strips
	const trunkResult = generateTrunkQuads(trunkJunctions, shapeDef, config, forkReductions);
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
	// Reuse bisectors computed in generateTrunkQuads (item #8: avoid duplicate call)
	const junctionData: JunctionData[] = trunkJunctions.map((pos, i) => ({
		position: pos,
		width: trunkResult.junctionWidths[i] ?? 0,
		stripRatios: trunkResult.stripRatios[i] ?? [],
		bisectorAngle: Math.atan2(trunkResult.bisectors[i]!.perpY, trunkResult.bisectors[i]!.perpX),
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
