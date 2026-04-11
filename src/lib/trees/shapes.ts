import type { TreeShape, Tier, TreeConfig, Point2D } from './types.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from './types.js';
import { randomInRange } from './prng.js';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface Blob {
	cx: number;
	cy: number;
	rx: number;
	ry: number;
}

export interface BranchSegment {
	readonly x1: number;
	readonly y1: number;
	readonly x2: number;
	readonly y2: number;
	readonly widthStart: number;
	readonly widthEnd: number;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const W = VIEWBOX_WIDTH;
const H = VIEWBOX_HEIGHT;

export const TRUNK_ENTRY_MIN_PX = 15;
const RADIAL_JITTER_FACTOR = 0.15;
const ACUTE_ANGLE_THRESHOLD_RAD = Math.PI / 2;
// Sub-branch widths pre-scaled by 1.75 (issue #4 base rescale).
const SUB_BRANCH_WIDTH_MIN = 3.5;
const SUB_BRANCH_WIDTH_MAX = 7;
const BRANCH_ANGLE_MIN_RAD = (30 * Math.PI) / 180;
const BRANCH_ANGLE_MAX_ATTEMPTS = 20;

// ---------------------------------------------------------------------------
// Shape definitions
// ---------------------------------------------------------------------------

interface ShapeDefinition {
	readonly trunkBaseWidth: number;
	readonly trunkTopWidth: number;
	readonly trunkBottom: number;
	readonly defaultTrunkTop: number;
	generateBlobs(rng: () => number, blobCount: number): Blob[];
}

function ensureLargestBlobInBottomHalf(blobs: Blob[]): void {
	if (blobs.length < 2) {
		return;
	}

	let largestIdx = 0;
	let largestArea = 0;
	for (let i = 0; i < blobs.length; i++) {
		const area = blobs[i]!.rx * blobs[i]!.ry;
		if (area > largestArea) {
			largestArea = area;
			largestIdx = i;
		}
	}

	let bottomIdx = 0;
	let maxCy = -Infinity;
	for (let i = 0; i < blobs.length; i++) {
		if (blobs[i]!.cy > maxCy) {
			maxCy = blobs[i]!.cy;
			bottomIdx = i;
		}
	}

	const blobsCenterY = blobs.reduce((sum, b) => sum + b.cy, 0) / blobs.length;

	if (blobs[largestIdx]!.cy < blobsCenterY && largestIdx !== bottomIdx) {
		const tmp = blobs[largestIdx]!;
		blobs[largestIdx] = blobs[bottomIdx]!;
		blobs[bottomIdx] = tmp;
	}
}

function generateOakBlobs(rng: () => number, blobCount: number): Blob[] {
	const blobs: Blob[] = [];
	const centerX = W / 2;
	const canopyCenterY = H * 0.3;
	const spreadRadius = W * 0.22;

	// D9: blob 0 on trunk axis
	if (blobCount >= 1) {
		const rx = randomInRange(rng, W * 0.2275, W * 0.385);
		const ry = randomInRange(rng, H * 0.14, H * 0.2625);
		blobs.push({ cx: centerX, cy: canopyCenterY, rx, ry });
	}

	// D9: remaining blobs balanced left/right
	for (let i = 1; i < blobCount; i++) {
		const side = i % 2 === 0 ? 1 : -1;
		const dist = randomInRange(rng, spreadRadius * 0.3, spreadRadius * 0.9);
		const angleJitter = randomInRange(rng, -0.5, 0.5);
		const angle = (Math.PI / 4) * Math.ceil(i / 2) + angleJitter;
		const cx = centerX + Math.cos(angle) * dist * side;
		const cy = canopyCenterY + Math.sin(angle) * dist * 0.5 * (rng() > 0.5 ? -1 : 1);
		const rx = randomInRange(rng, W * 0.2275, W * 0.385);
		const ry = randomInRange(rng, H * 0.14, H * 0.2625);
		blobs.push({ cx, cy, rx, ry });
	}
	ensureLargestBlobInBottomHalf(blobs);
	return blobs;
}

const shapeDefinitions: Record<TreeShape, ShapeDefinition> = {
	oak: {
		trunkBaseWidth: 28,
		trunkTopWidth: 17.5,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateOakBlobs,
	},
	pine: {
		trunkBaseWidth: 21,
		trunkTopWidth: 12.25,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.55,
		generateBlobs() {
			return [];
		},
	},
	birch: {
		trunkBaseWidth: 17.5,
		trunkTopWidth: 10.5,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs(rng, blobCount) {
			const blobs: Blob[] = [];
			const centerX = W / 2;
			const canopyCenterY = H * 0.25;

			// D9: blob 0 on trunk axis
			if (blobCount >= 1) {
				const rx = randomInRange(rng, W * 0.105, W * 0.21);
				const ry = randomInRange(rng, H * 0.21, H * 0.385);
				blobs.push({ cx: centerX, cy: canopyCenterY, rx, ry });
			}

			// Birch blobs are tall and narrow, stacked more vertically
			for (let i = 1; i < blobCount; i++) {
				const side = i % 2 === 0 ? 1 : -1;
				const verticalOffset = randomInRange(rng, -H * 0.08, H * 0.08);
				const horizontalOffset = randomInRange(rng, W * 0.02, W * 0.08) * side;
				const cx = centerX + horizontalOffset;
				const cy = canopyCenterY + verticalOffset;
				const rx = randomInRange(rng, W * 0.105, W * 0.21);
				const ry = randomInRange(rng, H * 0.21, H * 0.385);
				blobs.push({ cx, cy, rx, ry });
			}
			ensureLargestBlobInBottomHalf(blobs);
			return blobs;
		},
	},
	// Placeholder definitions for shapes whose real generators arrive in issue #8.
	// Trunk widths rescaled by 1.75 per issue #4. Blob generators reuse oak's
	// radial distribution until dedicated generators land.
	fir: {
		trunkBaseWidth: 21,
		trunkTopWidth: 12.25,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.55,
		generateBlobs: generateOakBlobs,
	},
	maple: {
		trunkBaseWidth: 28,
		trunkTopWidth: 17.5,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateOakBlobs,
	},
	willow: {
		trunkBaseWidth: 28,
		trunkTopWidth: 17.5,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateOakBlobs,
	},
	custom: {
		trunkBaseWidth: 28,
		trunkTopWidth: 17.5,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs: generateOakBlobs,
	},
};

// ---------------------------------------------------------------------------
// Shape definition accessor
// ---------------------------------------------------------------------------

export function getShapeDefinition(shape: TreeShape): ShapeDefinition {
	return shapeDefinitions[shape];
}

// ---------------------------------------------------------------------------
// Trunk helpers
// ---------------------------------------------------------------------------

export function computeEffectiveTrunkTop(shapeDef: ShapeDefinition, trunkHeight: number): number {
	const trunkBottom = shapeDef.trunkBottom;
	const defaultTop = shapeDef.defaultTrunkTop;
	return trunkBottom - (trunkBottom - defaultTop) * (trunkHeight / 100);
}

/**
 * Build the trunk centerline as a polyline of junctions from base to top.
 *
 * Conventions:
 *   - `junctions[0]` is always the base at `{ x: VIEWBOX_WIDTH/2, y: trunkBottom }`.
 *   - `junctions[trunkSegments]` is the topmost junction (canopy attachment).
 *   - Junctions are in descending-y order (base has highest y, top has lowest).
 *   - Y-coordinates are uniformly spaced so `segmentLenY = trunkHeight / N`.
 *
 * Angle model (REQ-T-11, REQ-T-12):
 *   - `trunkLean` is measured in degrees from vertical, positive = leans right.
 *   - First segment angle = trunkLean (pure lean, no jitter — REQ-T-12c).
 *   - Subsequent junctions add a random delta drawn from
 *     `[-maxJitter, +maxJitter]` where
 *     `maxJitter = lerp(5°, 20°, trunkCrookedness/100)`.
 *   - With `trunkCrookedness === 0` OR `trunkSegments === 1`, no jitter.
 */
export function buildTrunkPath(
	rng: () => number,
	trunkLean: number,
	trunkSegments: number,
	trunkCrookedness: number,
	trunkTop: number,
	trunkBottom: number,
): Point2D[] {
	const segments = Math.max(1, Math.min(5, Math.round(trunkSegments)));
	const clampedCrookedness = Math.max(0, Math.min(100, trunkCrookedness));
	const baseX = VIEWBOX_WIDTH / 2;
	const totalHeight = trunkBottom - trunkTop;
	const segmentLenY = totalHeight / segments;

	const junctions: Point2D[] = [{ x: baseX, y: trunkBottom }];

	const leanRad = (trunkLean * Math.PI) / 180;
	const maxJitterDeg = lerp(5, 20, clampedCrookedness / 100);

	let currentAngleRad = leanRad;
	let currentX = baseX;

	for (let i = 1; i <= segments; i++) {
		if (i > 1 && clampedCrookedness > 0) {
			const jitterDeg = randomInRange(rng, -maxJitterDeg, maxJitterDeg);
			currentAngleRad += (jitterDeg * Math.PI) / 180;
		}
		currentX += segmentLenY * Math.tan(currentAngleRad);
		// Pin final y to trunkTop to avoid FP accumulation drift.
		const newY = i === segments ? trunkTop : trunkBottom - i * segmentLenY;
		junctions.push({ x: currentX, y: newY });
	}

	return junctions;
}

/**
 * Sample the trunk centerline x-coordinate at a given y by finding the
 * segment containing y and linearly interpolating. Clamps to the base/top
 * junction x when y falls outside the trunk range.
 */
export function sampleTrunkCenterX(junctions: readonly Point2D[], y: number): number {
	const base = junctions[0]!;
	const top = junctions[junctions.length - 1]!;
	if (y >= base.y) {
		return base.x;
	}
	if (y <= top.y) {
		return top.x;
	}
	for (let i = 0; i < junctions.length - 1; i++) {
		const a = junctions[i]!;
		const b = junctions[i + 1]!;
		// a.y > b.y (descending y)
		if (y <= a.y && y >= b.y) {
			const t = (a.y - y) / (a.y - b.y);
			return a.x + t * (b.x - a.x);
		}
	}
	return base.x;
}

export function isPointInTrunkPath(
	x: number,
	y: number,
	junctions: readonly Point2D[],
	trunkTopWidth: number,
	trunkBaseWidth: number,
): boolean {
	const trunkBottom = junctions[0]!.y;
	const trunkTop = junctions[junctions.length - 1]!.y;
	const t = (y - trunkTop) / (trunkBottom - trunkTop);
	if (t < 0 || t > 1) {
		return false;
	}
	const width = trunkTopWidth + t * (trunkBaseWidth - trunkTopWidth);
	const centerX = sampleTrunkCenterX(junctions, y);
	return Math.abs(x - centerX) <= width / 2;
}

// ---------------------------------------------------------------------------
// Blob point-testing
// ---------------------------------------------------------------------------

function isPointInBlobs(x: number, y: number, blobs: readonly Blob[]): boolean {
	return blobs.some((b) => {
		const dx = (x - b.cx) / b.rx;
		const dy = (y - b.cy) / b.ry;
		return dx * dx + dy * dy <= 1;
	});
}

function isPointInSingleBlob(x: number, y: number, b: Blob): boolean {
	const dx = (x - b.cx) / b.rx;
	const dy = (y - b.cy) / b.ry;
	return dx * dx + dy * dy <= 1;
}

// ---------------------------------------------------------------------------
// Tier (pine) — triangular shapes
// ---------------------------------------------------------------------------

export function generateTiers(
	rng: () => number,
	blobCount: number,
	trunkJunctions: readonly Point2D[],
	blobCloseness: number,
	blobSizeVariance: number,
	canopySize: number,
	verticalShift: number,
): Tier[] {
	const tiers: Tier[] = [];
	const count = Math.max(1, blobCount);
	const centerX = W / 2;
	const tipY = H * 0.05 + verticalShift;
	const baseY = H * 0.6 + verticalShift;
	const totalHeight = baseY - tipY;

	const canopyScale = canopySize / 100;
	const overlapFraction = blobCloseness / 100;

	for (let i = 0; i < count; i++) {
		const t0 = i / count;
		const t1 = (i + 1) / count;

		const tierTipY = tipY + t0 * totalHeight;
		const tierBaseY = tipY + t1 * totalHeight;

		// D8: blobSizeVariance controls ratio of top to bottom tier width
		const widthT = count > 1 ? i / (count - 1) : 0;
		const topScale = 1 / blobSizeVariance;
		const widthScale = lerp(topScale, 1.0, widthT);

		const baseHalfWidth = (W * 0.105 + t1 * W * 0.385) * widthScale * canopyScale;

		// D10: tiers follow trunk path (sampled from junctions). For y values
		// above the topmost junction, sampling clamps to topJunction.x so tiers
		// stop leaning once they rise above the trunk.
		const leanOffset = sampleTrunkCenterX(trunkJunctions, tierTipY) - centerX;
		const baseLeanOffset = sampleTrunkCenterX(trunkJunctions, tierBaseY) - centerX;

		const jitterX = randomInRange(rng, -2, 2);

		// D7: blobCloseness controls overlap
		const overlapOffset = i > 0 ? (totalHeight / count) * overlapFraction : 0;

		tiers.push({
			tipX: centerX + jitterX + leanOffset,
			tipY: tierTipY - overlapOffset,
			baseLeftX: centerX - baseHalfWidth + randomInRange(rng, -3, 3) + baseLeanOffset,
			baseLeftY: tierBaseY,
			baseRightX: centerX + baseHalfWidth + randomInRange(rng, -3, 3) + baseLeanOffset,
			baseRightY: tierBaseY,
		});
	}

	return tiers;
}

export function isPointInTier(x: number, y: number, tier: Tier): boolean {
	const x0 = tier.tipX;
	const y0 = tier.tipY;
	const x1 = tier.baseLeftX;
	const y1 = tier.baseLeftY;
	const x2 = tier.baseRightX;
	const y2 = tier.baseRightY;

	const denom = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
	if (denom === 0) {
		return false;
	}

	const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / denom;
	const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / denom;
	const c = 1 - a - b;

	return a >= 0 && b >= 0 && c >= 0;
}

export function getTiersBounds(tiers: readonly Tier[]): {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
} {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for (const t of tiers) {
		minX = Math.min(minX, t.tipX, t.baseLeftX, t.baseRightX);
		minY = Math.min(minY, t.tipY, t.baseLeftY, t.baseRightY);
		maxX = Math.max(maxX, t.tipX, t.baseLeftX, t.baseRightX);
		maxY = Math.max(maxY, t.tipY, t.baseLeftY, t.baseRightY);
	}

	return {
		minX: Math.max(0, minX),
		minY: Math.max(0, minY),
		maxX: Math.min(VIEWBOX_WIDTH, maxX),
		maxY: Math.min(VIEWBOX_HEIGHT, maxY),
	};
}

// ---------------------------------------------------------------------------
// Blob depth ordering
// ---------------------------------------------------------------------------

function blobContains(outer: Blob, inner: Blob): boolean {
	const testPoints: readonly [number, number][] = [
		[inner.cx, inner.cy],
		[inner.cx - inner.rx, inner.cy],
		[inner.cx + inner.rx, inner.cy],
		[inner.cx, inner.cy - inner.ry],
		[inner.cx, inner.cy + inner.ry],
	];

	return testPoints.every(([px, py]) => isPointInSingleBlob(px, py, outer));
}

export function assignBlobDepths(blobs: readonly Blob[], rng: () => number): number[] {
	const count = blobs.length;
	const depths = Array.from({ length: count }, () => rng());

	for (let outer = 0; outer < count; outer++) {
		for (let inner = 0; inner < count; inner++) {
			if (outer === inner) {
				continue;
			}
			if (blobContains(blobs[outer]!, blobs[inner]!)) {
				if (depths[inner]! <= depths[outer]!) {
					depths[inner] = depths[outer]! + 0.001;
				}
			}
		}
	}

	return depths;
}

// ---------------------------------------------------------------------------
// Blob size variance (ratio-based: D8)
// ---------------------------------------------------------------------------

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

export function applyBlobSizeVariance(blobs: Blob[], blobSizeVariance: number): void {
	if (blobs.length <= 1) {
		return;
	}

	const minScale = 1 / blobSizeVariance;

	for (let i = 1; i < blobs.length; i++) {
		const scale = lerp(1.0, minScale, i / (blobs.length - 1));
		blobs[i]!.rx *= scale;
		blobs[i]!.ry *= scale;
	}
}

// ---------------------------------------------------------------------------
// Blob closeness (D7)
// ---------------------------------------------------------------------------

export function applyBlobCloseness(
	blobs: Blob[],
	blobCloseness: number,
	spreadRadius: number,
): void {
	if (blobs.length <= 1) {
		return;
	}

	const maxSpread = lerp(spreadRadius * 0.9, spreadRadius * 0.3, (blobCloseness - 20) / 60);
	const trunkCenterX = W / 2;

	for (let i = 1; i < blobs.length; i++) {
		const dx = blobs[i]!.cx - trunkCenterX;
		const currentDist = Math.abs(dx);
		if (currentDist > maxSpread) {
			const scale = maxSpread / currentDist;
			blobs[i]!.cx = trunkCenterX + dx * scale;
		}
	}

	// Main blob affected at 1/10th magnitude
	if (blobs.length > 0) {
		const dx = blobs[0]!.cx - trunkCenterX;
		const currentDist = Math.abs(dx);
		if (currentDist > maxSpread * 0.1) {
			const targetDist = maxSpread * 0.1;
			blobs[0]!.cx = trunkCenterX + (dx > 0 ? targetDist : -targetDist);
		}
	}
}

// ---------------------------------------------------------------------------
// Canopy size scaling (D5)
// ---------------------------------------------------------------------------

export function applyCanopySize(blobs: Blob[], canopySize: number): void {
	const scale = canopySize / 100;
	for (const blob of blobs) {
		blob.rx *= scale;
		blob.ry *= scale;
	}
}

// ---------------------------------------------------------------------------
// Per-blob boundary sampling
// ---------------------------------------------------------------------------

function angleBetween(
	ax: number,
	ay: number,
	bx: number,
	by: number,
	cx: number,
	cy: number,
): number {
	const bax = ax - bx;
	const bay = ay - by;
	const bcx = cx - bx;
	const bcy = cy - by;
	const dot = bax * bcx + bay * bcy;
	const magBA = Math.sqrt(bax * bax + bay * bay);
	const magBC = Math.sqrt(bcx * bcx + bcy * bcy);
	if (magBA === 0 || magBC === 0) {
		return Math.PI;
	}
	return Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC))));
}

export function sampleBlobBoundary(
	blob: Blob,
	sampleCount: number,
	rng: () => number,
	smoothAcuteAngles: boolean,
): { x: number; y: number }[] {
	const points: { x: number; y: number }[] = [];

	for (let i = 0; i < sampleCount; i++) {
		const baseAngle = (i / sampleCount) * Math.PI * 2;
		const jitter = (rng() - 0.5) * ((40 * Math.PI) / 180);
		const angle = baseAngle + jitter;

		const radialJitter = 1.0 + (rng() - 0.5) * 2 * RADIAL_JITTER_FACTOR;
		const px = blob.cx + Math.cos(angle) * blob.rx * radialJitter;
		const py = blob.cy + Math.sin(angle) * blob.ry * radialJitter;
		points.push({ x: px, y: py });
	}

	if (smoothAcuteAngles && points.length >= 3) {
		let changed = true;
		let passes = 0;
		const maxPasses = 3;

		while (changed && passes < maxPasses) {
			changed = false;
			passes++;

			for (let i = points.length - 1; i >= 0; i--) {
				if (points.length < 3) {
					break;
				}
				const prev = points[(i - 1 + points.length) % points.length]!;
				const curr = points[i]!;
				const next = points[(i + 1) % points.length]!;

				const ang = angleBetween(prev.x, prev.y, curr.x, curr.y, next.x, next.y);
				if (ang < ACUTE_ANGLE_THRESHOLD_RAD) {
					const mx = (prev.x + next.x) / 2;
					const my = (prev.y + next.y) / 2;
					const ddx = mx - blob.cx;
					const ddy = my - blob.cy;
					const dist = Math.sqrt(ddx * ddx + ddy * ddy);
					if (dist > 0) {
						const avgR = (blob.rx + blob.ry) / 2;
						curr.x = blob.cx + (ddx / dist) * avgR;
						curr.y = blob.cy + (ddy / dist) * avgR;
						changed = true;
					}
				}
			}
		}
	}

	return points;
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
// Segment/shape intersection helpers (issue #7 — branch visibility)
// ---------------------------------------------------------------------------

/**
 * Intersect a line segment (x1,y1)-(x2,y2) with an axis-aligned ellipse
 * centered at (cx,cy) with radii (rx,ry). Returns the parametric entry/exit
 * values clipped to [0,1], or null if the segment misses the ellipse.
 *
 * Parameterization: point on segment = (x1,y1) + t * (x2-x1, y2-y1) for t∈[0,1].
 */
export function raySegmentEllipseIntersection(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	cx: number,
	cy: number,
	rx: number,
	ry: number,
): [number, number] | null {
	if (rx <= 0 || ry <= 0) {
		return null;
	}
	// Transform segment into unit-circle space (divide by rx, ry, translate to origin).
	const ax = (x1 - cx) / rx;
	const ay = (y1 - cy) / ry;
	const dx = (x2 - x1) / rx;
	const dy = (y2 - y1) / ry;
	// |a + t*d|^2 = 1 → A t^2 + 2 B t + C = 0 where
	//   A = d·d, B = a·d, C = a·a - 1
	const A = dx * dx + dy * dy;
	const B = ax * dx + ay * dy;
	const C = ax * ax + ay * ay - 1;
	if (A === 0) {
		return C <= 0 ? [0, 1] : null;
	}
	const disc = B * B - A * C;
	if (disc < 0) {
		return null;
	}
	const sqrtDisc = Math.sqrt(Math.max(0, disc));
	let tEnter = (-B - sqrtDisc) / A;
	let tExit = (-B + sqrtDisc) / A;
	if (tEnter > tExit) {
		const tmp = tEnter;
		tEnter = tExit;
		tExit = tmp;
	}
	if (tExit < 0 || tEnter > 1) {
		return null;
	}
	tEnter = Math.max(0, tEnter);
	tExit = Math.min(1, tExit);
	return [tEnter, tExit];
}

/**
 * Intersect a segment with a triangle (Tier) using Liang–Barsky clipping
 * against the three half-planes defined by its edges. Returns the parametric
 * entry/exit values clipped to [0,1], or null if the segment misses.
 */
export function raySegmentTriangleIntersection(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	triangle: Tier,
): [number, number] | null {
	const vertices: readonly [number, number][] = [
		[triangle.tipX, triangle.tipY],
		[triangle.baseRightX, triangle.baseRightY],
		[triangle.baseLeftX, triangle.baseLeftY],
	];

	// Signed-area (cross product) for the triangle — used to pick the inward
	// orientation of each edge normal so we can clip consistently.
	const cross = (
		x0: number,
		y0: number,
		xa: number,
		ya: number,
		xb: number,
		yb: number,
	): number => (xa - x0) * (yb - y0) - (ya - y0) * (xb - x0);

	const [v0x, v0y] = vertices[0]!;
	const [v1x, v1y] = vertices[1]!;
	const [v2x, v2y] = vertices[2]!;
	const orient = cross(v0x, v0y, v1x, v1y, v2x, v2y);
	if (orient === 0) {
		return null;
	}
	const sign = orient > 0 ? 1 : -1;

	const dx = x2 - x1;
	const dy = y2 - y1;
	let tEnter = 0;
	let tExit = 1;

	for (let i = 0; i < 3; i++) {
		const [ax, ay] = vertices[i]!;
		const [bx, by] = vertices[(i + 1) % 3]!;
		// Inward normal for this edge (rotate edge vector 90° depending on orientation).
		const ex = bx - ax;
		const ey = by - ay;
		const nx = -ey * sign;
		const ny = ex * sign;
		// Half-plane: n · (p - a) >= 0 inside.
		// n · (start - a) + t * (n · dir) >= 0
		const startDot = nx * (x1 - ax) + ny * (y1 - ay);
		const dirDot = nx * dx + ny * dy;
		if (dirDot === 0) {
			if (startDot < 0) {
				return null;
			}
			continue;
		}
		const t = -startDot / dirDot;
		if (dirDot > 0) {
			// Entering the half-plane at t.
			if (t > tEnter) {
				tEnter = t;
			}
		} else {
			// Leaving the half-plane at t.
			if (t < tExit) {
				tExit = t;
			}
		}
		if (tEnter > tExit) {
			return null;
		}
	}

	return [tEnter, tExit];
}

/**
 * Compute the portion of a branch segment that is NOT covered by any canopy
 * blob or tier. Intervals from all shapes are merged before measuring so
 * overlapping coverage is not double-counted.
 */
export function computeVisibleBranchLength(
	branch: BranchSegment,
	blobs: readonly Blob[],
	tiers: readonly Tier[],
): number {
	const dx = branch.x2 - branch.x1;
	const dy = branch.y2 - branch.y1;
	const segmentLength = Math.sqrt(dx * dx + dy * dy);
	if (segmentLength === 0) {
		return 0;
	}

	const intervals: [number, number][] = [];
	for (const b of blobs) {
		const hit = raySegmentEllipseIntersection(
			branch.x1,
			branch.y1,
			branch.x2,
			branch.y2,
			b.cx,
			b.cy,
			b.rx,
			b.ry,
		);
		if (hit) {
			intervals.push(hit);
		}
	}
	for (const t of tiers) {
		const hit = raySegmentTriangleIntersection(branch.x1, branch.y1, branch.x2, branch.y2, t);
		if (hit) {
			intervals.push(hit);
		}
	}

	if (intervals.length === 0) {
		return segmentLength;
	}

	// Merge overlapping intervals.
	intervals.sort((a, b) => a[0] - b[0]);
	let covered = 0;
	let curStart = intervals[0]![0];
	let curEnd = intervals[0]![1];
	for (let i = 1; i < intervals.length; i++) {
		const [s, e] = intervals[i]!;
		if (s <= curEnd) {
			if (e > curEnd) {
				curEnd = e;
			}
		} else {
			covered += curEnd - curStart;
			curStart = s;
			curEnd = e;
		}
	}
	covered += curEnd - curStart;

	const coveredFraction = Math.min(1, Math.max(0, covered));
	return segmentLength * (1 - coveredFraction);
}

/**
 * Returns true if two segments (p1->p2 and p3->p4) intersect as thin lines.
 */
function segmentsIntersect(
	p1x: number,
	p1y: number,
	p2x: number,
	p2y: number,
	p3x: number,
	p3y: number,
	p4x: number,
	p4y: number,
): boolean {
	const d1x = p2x - p1x;
	const d1y = p2y - p1y;
	const d2x = p4x - p3x;
	const d2y = p4y - p3y;
	const denom = d1x * d2y - d1y * d2x;
	if (denom === 0) {
		// Parallel — treat collinear overlap as intersection.
		const cross1 = (p3x - p1x) * d1y - (p3y - p1y) * d1x;
		if (cross1 !== 0) {
			return false;
		}
		// Collinear: project onto the longer axis and check overlap.
		const useX = Math.abs(d1x) >= Math.abs(d1y);
		const a0 = useX ? p1x : p1y;
		const a1 = useX ? p2x : p2y;
		const b0 = useX ? p3x : p3y;
		const b1 = useX ? p4x : p4y;
		const aMin = Math.min(a0, a1);
		const aMax = Math.max(a0, a1);
		const bMin = Math.min(b0, b1);
		const bMax = Math.max(b0, b1);
		return aMax >= bMin && bMax >= aMin;
	}
	const tNum = (p3x - p1x) * d2y - (p3y - p1y) * d2x;
	const uNum = (p3x - p1x) * d1y - (p3y - p1y) * d1x;
	const t = tNum / denom;
	const u = uNum / denom;
	return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/**
 * Thick-segment overlap test. First does an AABB reject, then checks a
 * centerline intersection, then falls back to sampling points of each branch
 * against the other's thick body to catch near-coincident but non-crossing
 * cases.
 */
export function branchesOverlap(a: BranchSegment, b: BranchSegment): boolean {
	const halfA = Math.max(a.widthStart, a.widthEnd) / 2;
	const halfB = Math.max(b.widthStart, b.widthEnd) / 2;

	const aMinX = Math.min(a.x1, a.x2) - halfA;
	const aMaxX = Math.max(a.x1, a.x2) + halfA;
	const aMinY = Math.min(a.y1, a.y2) - halfA;
	const aMaxY = Math.max(a.y1, a.y2) + halfA;
	const bMinX = Math.min(b.x1, b.x2) - halfB;
	const bMaxX = Math.max(b.x1, b.x2) + halfB;
	const bMinY = Math.min(b.y1, b.y2) - halfB;
	const bMaxY = Math.max(b.y1, b.y2) + halfB;

	if (aMaxX < bMinX || bMaxX < aMinX || aMaxY < bMinY || bMaxY < aMinY) {
		return false;
	}

	// Analytic centerline intersection catches crossing branches regardless of
	// sample density.
	if (segmentsIntersect(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1, b.x2, b.y2)) {
		return true;
	}

	// Fallback: sample each branch at dense points and check thick inclusion
	// against the other. Catches near-coincident cases the analytic test missed.
	const SAMPLES = 21;
	for (let i = 0; i <= SAMPLES; i++) {
		const t = i / SAMPLES;
		const px = a.x1 + t * (a.x2 - a.x1);
		const py = a.y1 + t * (a.y2 - a.y1);
		if (isPointInBranch(px, py, [b])) {
			return true;
		}
	}
	for (let i = 0; i <= SAMPLES; i++) {
		const t = i / SAMPLES;
		const px = b.x1 + t * (b.x2 - b.x1);
		const py = b.y1 + t * (b.y2 - b.y1);
		if (isPointInBranch(px, py, [a])) {
			return true;
		}
	}
	return false;
}

/**
 * Resolve the effective branch length range for a given base range, taking
 * branchLength scaling and branchLengthVariance spread into account.
 *
 * Trunk-origin branches draw from the upper half of the variance window,
 * sub-branches from the lower half (REQ-T-15).
 */
export function resolveBranchLengthRange(
	baseMin: number,
	baseMax: number,
	branchLength: number,
	branchLengthVariance: number,
	isTrunkOrigin: boolean,
): { min: number; max: number } {
	const scale = branchLength / 100;
	const mid = ((baseMin + baseMax) / 2) * scale;
	const half = (((baseMax - baseMin) / 2) * scale * branchLengthVariance) / 100;
	if (isTrunkOrigin) {
		return { min: mid, max: mid + half };
	}
	return { min: mid - half, max: mid };
}

// ---------------------------------------------------------------------------
// Hierarchical branching (D1, D2, D3)
// ---------------------------------------------------------------------------

function blobsOverlap(a: Blob, b: Blob): boolean {
	const dx = (a.cx - b.cx) / (a.rx + b.rx);
	const dy = (a.cy - b.cy) / (a.ry + b.ry);
	return dx * dx + dy * dy < 1;
}

function findIsolatedBlobs(blobs: readonly Blob[]): number[] {
	const isolated: number[] = [];
	for (let i = 0; i < blobs.length; i++) {
		let hasOverlap = false;
		for (let j = 0; j < blobs.length; j++) {
			if (i === j) {
				continue;
			}
			if (blobsOverlap(blobs[i]!, blobs[j]!)) {
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

function computeAxisAngle(x1: number, y1: number, x2: number, y2: number): number {
	return Math.atan2(y2 - y1, x2 - x1);
}

function angleDivergence(a: number, b: number): number {
	let diff = Math.abs(a - b) % (Math.PI * 2);
	if (diff > Math.PI) {
		diff = Math.PI * 2 - diff;
	}
	return diff;
}

// Base length ranges for branches at branchLength=100. The effective min/max
// is derived by resolveBranchLengthRange using config.branchLength and
// branchLengthVariance. These bases were rescaled ~1.6x to track the canopy
// rescale in #4 (commit 85c067e), which previously left branches too short to
// clear the enlarged canopy under the new visibility check.
const TRUNK_BRANCH_BASE_MIN = 40;
const TRUNK_BRANCH_BASE_MAX = 80;
const SUB_BRANCH_BASE_MIN = 25;
const SUB_BRANCH_BASE_MAX = 55;

const BRANCH_RETRY_ATTEMPTS = 3;
const TRUNK_BRANCH_MIN_VISIBLE = 15;
const SUB_BRANCH_MIN_VISIBLE = 10;

interface BranchCandidateContext {
	readonly rng: () => number;
	readonly config: TreeConfig;
	readonly trunkJunctions: readonly Point2D[];
	readonly blobs: readonly Blob[];
	readonly trunkTop: number;
	readonly trunkHeight: number;
	readonly canopyBottom: number;
	readonly trunkAxisAngle: number;
}

/**
 * Snap an endpoint to the same side of the trunk center as the start point so
 * the branch cannot cross the trunk axis. If the endpoint is already on the
 * correct side, returns it unchanged.
 */
function reflectEndpointIfCrossing(startX: number, endX: number, centerX: number): number {
	const startSide = Math.sign(startX - centerX);
	const endSide = Math.sign(endX - centerX);
	if (startSide === 0 || endSide === 0 || startSide === endSide) {
		return endX;
	}
	// Reflect endX about centerX.
	return centerX + (centerX - endX);
}

/**
 * Progressive branchT window per retry attempt. Later attempts push the
 * origin lower on the trunk (away from the dense canopy core) so the branch
 * has more unobstructed length below the canopy.
 */
const TRUNK_BRANCH_T_WINDOWS: readonly [number, number][] = [
	[0.05, 0.35],
	[0.2, 0.5],
	[0.35, 0.6],
];

/**
 * If a branch's endpoint is above the canopy bottom and NOT inside any blob,
 * walk forward along the branch direction (both x and y) until the point
 * lands inside a blob. Returns the adjusted endpoint, or the original if no
 * blob is reached within the extension cap. This satisfies REQ-T-09 while
 * preserving the branch direction (unlike the buggy original code that only
 * updated endY and warped the branch).
 */
function extendTipIntoCanopy(
	startX: number,
	startY: number,
	endX: number,
	endY: number,
	blobs: readonly Blob[],
	canopyBottom: number,
	maxExtension: number,
): { endX: number; endY: number } {
	if (endY >= canopyBottom || isPointInBlobs(endX, endY, blobs)) {
		return { endX, endY };
	}
	const dirX = endX - startX;
	const dirY = endY - startY;
	const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
	if (dirLen === 0) {
		return { endX, endY };
	}
	const ux = dirX / dirLen;
	const uy = dirY / dirLen;
	for (let ext = 1; ext <= maxExtension; ext++) {
		const px = endX + ux * ext;
		const py = endY + uy * ext;
		if (isPointInBlobs(px, py, blobs)) {
			return { endX: px, endY: py };
		}
	}
	return { endX, endY };
}

function rollTrunkBranchCandidate(
	ctx: BranchCandidateContext,
	side: 1 | -1,
	branchThicknessScale: number,
	attempt: number,
): BranchSegment {
	const {
		rng,
		config,
		trunkJunctions,
		blobs,
		trunkTop,
		trunkHeight,
		canopyBottom,
		trunkAxisAngle,
	} = ctx;
	const tWindow = TRUNK_BRANCH_T_WINDOWS[Math.min(attempt, TRUNK_BRANCH_T_WINDOWS.length - 1)]!;
	const branchT = randomInRange(rng, tWindow[0], tWindow[1]);
	const startY = trunkTop + trunkHeight * branchT;
	const startX = sampleTrunkCenterX(trunkJunctions, startY);
	const { min: lenMin, max: lenMax } = resolveBranchLengthRange(
		TRUNK_BRANCH_BASE_MIN,
		TRUNK_BRANCH_BASE_MAX,
		config.branchLength,
		config.branchLengthVariance,
		true,
	);
	const length = randomInRange(rng, lenMin, lenMax);

	let upAngle = 0;
	for (let angleAttempt = 0; angleAttempt < BRANCH_ANGLE_MAX_ATTEMPTS; angleAttempt++) {
		upAngle = randomInRange(rng, 0.3, 1.2);
		const candidateAngle = Math.atan2(
			-Math.sin(upAngle) * length,
			Math.cos(upAngle) * length * side,
		);
		if (angleDivergence(candidateAngle, trunkAxisAngle) >= BRANCH_ANGLE_MIN_RAD) {
			break;
		}
	}

	const rawEndX = startX + Math.cos(upAngle) * length * side;
	const rawEndY = startY - Math.sin(upAngle) * length;
	const reflectedEndX = reflectEndpointIfCrossing(startX, rawEndX, startX);
	const extended = extendTipIntoCanopy(
		startX,
		startY,
		reflectedEndX,
		rawEndY,
		blobs,
		canopyBottom,
		40,
	);
	const widthStart = randomInRange(rng, 7, 12.25) * branchThicknessScale;
	const widthEnd = randomInRange(rng, 1.75, 5.25) * branchThicknessScale;

	return {
		x1: startX,
		y1: startY,
		x2: extended.endX,
		y2: extended.endY,
		widthStart,
		widthEnd,
	};
}

function rollSubBranchCandidate(
	ctx: BranchCandidateContext,
	parent: BranchSegment,
	side: 1 | -1,
	branchThicknessScale: number,
): BranchSegment {
	const { rng, config, trunkJunctions, blobs, canopyBottom } = ctx;
	const parentAngle = computeAxisAngle(parent.x1, parent.y1, parent.x2, parent.y2);
	const startT = randomInRange(rng, 0.3, 0.7);
	const startX = parent.x1 + startT * (parent.x2 - parent.x1);
	const startY = parent.y1 + startT * (parent.y2 - parent.y1);

	const { min: lenMin, max: lenMax } = resolveBranchLengthRange(
		SUB_BRANCH_BASE_MIN,
		SUB_BRANCH_BASE_MAX,
		config.branchLength,
		config.branchLengthVariance,
		false,
	);
	const length = randomInRange(rng, lenMin, lenMax);

	let upAngle = 0;
	for (let angleAttempt = 0; angleAttempt < BRANCH_ANGLE_MAX_ATTEMPTS; angleAttempt++) {
		upAngle = randomInRange(rng, 0.2, 1.0);
		const candidateAngle = Math.atan2(
			-Math.sin(upAngle) * length,
			Math.cos(upAngle) * length * side,
		);
		if (angleDivergence(candidateAngle, parentAngle) >= BRANCH_ANGLE_MIN_RAD) {
			break;
		}
	}

	const rawEndX = startX + Math.cos(upAngle) * length * side;
	// Keep sub-branch on the same side of the trunk axis as its origin.
	const centerX = sampleTrunkCenterX(trunkJunctions, startY);
	const reflectedEndX = reflectEndpointIfCrossing(startX, rawEndX, centerX);
	const rawEndY = startY - Math.sin(upAngle) * length;
	const extended = extendTipIntoCanopy(
		startX,
		startY,
		reflectedEndX,
		rawEndY,
		blobs,
		canopyBottom,
		30,
	);
	const widthStart =
		randomInRange(rng, SUB_BRANCH_WIDTH_MIN, SUB_BRANCH_WIDTH_MAX) * branchThicknessScale;
	const widthEnd = randomInRange(rng, 1.75, 3.5) * branchThicknessScale;

	return {
		x1: startX,
		y1: startY,
		x2: extended.endX,
		y2: extended.endY,
		widthStart,
		widthEnd,
	};
}

function overlapsAny(candidate: BranchSegment, existing: readonly BranchSegment[]): boolean {
	for (const other of existing) {
		if (branchesOverlap(candidate, other)) {
			return true;
		}
	}
	return false;
}

export function generateBranches(
	rng: () => number,
	trunkTop: number,
	trunkBottom: number,
	_trunkTopWidth: number,
	config: TreeConfig,
	trunkJunctions: readonly Point2D[],
	blobs: readonly Blob[],
): BranchSegment[] {
	const branchCount = config.branchCount;
	if (branchCount <= 0) {
		return [];
	}

	const branchThicknessScale = config.branchThickness / 100;
	const trunkBranchRatio = config.trunkBranchRatio / 100;

	const branches: BranchSegment[] = [];
	const trunkHeight = trunkBottom - trunkTop;
	const canopyBottom = blobs.length > 0 ? getBlobsBounds(blobs).maxY : trunkTop;

	const baseJunction = trunkJunctions[0]!;
	const topJunction = trunkJunctions[trunkJunctions.length - 1]!;
	const trunkAxisAngle = computeAxisAngle(
		baseJunction.x,
		baseJunction.y,
		topJunction.x,
		topJunction.y,
	);

	const ctx: BranchCandidateContext = {
		rng,
		config,
		trunkJunctions,
		blobs,
		trunkTop,
		trunkHeight,
		canopyBottom,
		trunkAxisAngle,
	};

	const trunkBranchCount = Math.max(1, Math.round(branchCount * trunkBranchRatio));
	const subBranchCount = branchCount - trunkBranchCount;

	// --- Trunk-origin branches ---
	for (let i = 0; i < trunkBranchCount; i++) {
		const side: 1 | -1 = i % 2 === 0 ? 1 : -1;
		let accepted: BranchSegment | null = null;
		for (let attempt = 0; attempt < BRANCH_RETRY_ATTEMPTS; attempt++) {
			const candidate = rollTrunkBranchCandidate(ctx, side, branchThicknessScale, attempt);
			if (overlapsAny(candidate, branches)) {
				continue;
			}
			const visible = computeVisibleBranchLength(candidate, blobs, []);
			if (visible < TRUNK_BRANCH_MIN_VISIBLE) {
				continue;
			}
			accepted = candidate;
			break;
		}
		if (accepted !== null) {
			branches.push(accepted);
		}
	}

	// --- Sub-branches ---
	const isolatedBlobIndices = findIsolatedBlobs(blobs);
	const isolatedReached = new Set<number>();

	for (let i = 0; i < subBranchCount; i++) {
		if (branches.length === 0) {
			break;
		}
		const side: 1 | -1 = i % 2 === 0 ? 1 : -1;
		let accepted: BranchSegment | null = null;
		for (let attempt = 0; attempt < BRANCH_RETRY_ATTEMPTS; attempt++) {
			const parent = branches[Math.floor(rng() * branches.length)]!;
			const candidate = rollSubBranchCandidate(ctx, parent, side, branchThicknessScale);
			if (overlapsAny(candidate, branches)) {
				continue;
			}
			const visible = computeVisibleBranchLength(candidate, blobs, []);
			if (visible < SUB_BRANCH_MIN_VISIBLE) {
				continue;
			}
			accepted = candidate;
			break;
		}
		if (accepted !== null) {
			for (const idx of isolatedBlobIndices) {
				if (isPointInSingleBlob(accepted.x2, accepted.y2, blobs[idx]!)) {
					isolatedReached.add(idx);
				}
			}
			branches.push(accepted);
		}
	}

	// --- Floating-blob fallback (exempt from visibility/crossing checks) ---
	for (const idx of isolatedBlobIndices) {
		if (isolatedReached.has(idx)) {
			continue;
		}
		const blob = blobs[idx]!;
		const branchT = randomInRange(rng, 0.1, 0.3);
		const originY = trunkTop + trunkHeight * branchT;
		const originX = sampleTrunkCenterX(trunkJunctions, originY);

		branches.push({
			x1: originX,
			y1: originY,
			x2: blob.cx,
			y2: blob.cy,
			widthStart: randomInRange(rng, 5.25, 8.75) * branchThicknessScale,
			widthEnd: randomInRange(rng, 1.75, 3.5) * branchThicknessScale,
		});
	}

	return branches;
}

// ---------------------------------------------------------------------------
// Branch point-testing
// ---------------------------------------------------------------------------

export function isPointInBranch(x: number, y: number, branches: readonly BranchSegment[]): boolean {
	return branches.some((b) => {
		const dx = b.x2 - b.x1;
		const dy = b.y2 - b.y1;
		const lenSq = dx * dx + dy * dy;
		if (lenSq === 0) {
			return false;
		}
		const t = Math.max(0, Math.min(1, ((x - b.x1) * dx + (y - b.y1) * dy) / lenSq));
		const projX = b.x1 + t * dx;
		const projY = b.y1 + t * dy;
		const distSq = (x - projX) ** 2 + (y - projY) ** 2;
		const localWidth = b.widthStart + t * (b.widthEnd - b.widthStart);
		const halfW = localWidth / 2;
		return distSq <= halfW * halfW;
	});
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
