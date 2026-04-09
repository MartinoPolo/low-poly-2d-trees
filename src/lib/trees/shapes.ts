import type { TreeShape, Tier } from './types.js';
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

interface BranchSegment {
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

const TRUNK_ENTRY_MIN_PX = 15;
const RADIAL_JITTER_FACTOR = 0.15;
const ACUTE_ANGLE_THRESHOLD_RAD = Math.PI / 2;
const TRUNK_BRANCH_RATIO = 0.7;
const SUB_BRANCH_WIDTH_MIN = 2;
const SUB_BRANCH_WIDTH_MAX = 4;

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

const shapeDefinitions: Record<TreeShape, ShapeDefinition> = {
	oak: {
		trunkBaseWidth: 16,
		trunkTopWidth: 10,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.45,
		generateBlobs(rng, blobCount) {
			const blobs: Blob[] = [];
			const centerX = W / 2;
			const canopyCenterY = H * 0.3;
			const spreadRadius = W * 0.22;

			for (let i = 0; i < blobCount; i++) {
				const angle = (i / blobCount) * Math.PI * 2 + randomInRange(rng, -0.4, 0.4);
				const dist = randomInRange(rng, spreadRadius * 0.2, spreadRadius * 0.9);
				const cx = centerX + Math.cos(angle) * dist;
				const cy = canopyCenterY + Math.sin(angle) * dist * 0.7;
				const rx = randomInRange(rng, W * 0.13, W * 0.22);
				const ry = randomInRange(rng, H * 0.08, H * 0.15);
				blobs.push({ cx, cy, rx, ry });
			}
			ensureLargestBlobInBottomHalf(blobs);
			return blobs;
		},
	},
	pine: {
		trunkBaseWidth: 12,
		trunkTopWidth: 7,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.55,
		generateBlobs(rng, blobCount) {
			const blobs: Blob[] = [];
			const centerX = W / 2;
			const tipY = H * 0.05;
			const baseY = H * 0.6;
			const totalHeight = baseY - tipY;

			blobs.push({
				cx: centerX + randomInRange(rng, -2, 2),
				cy: tipY + totalHeight * 0.05,
				rx: W * 0.06 * randomInRange(rng, 0.8, 1.2),
				ry: totalHeight * 0.12 * randomInRange(rng, 0.9, 1.1),
			});

			for (let i = 1; i < blobCount; i++) {
				const t = i / Math.max(1, blobCount - 1);
				const cy = tipY + t * totalHeight;
				const widthFactor = 0.06 + t * t * 0.38;
				const rx = W * widthFactor * randomInRange(rng, 0.8, 1.0);
				const ry = (totalHeight / blobCount) * randomInRange(rng, 0.8, 1.2);
				const cx = centerX + randomInRange(rng, -3, 3);
				blobs.push({ cx, cy, rx, ry });
			}
			ensureLargestBlobInBottomHalf(blobs);
			return blobs;
		},
	},
	bushy: {
		trunkBaseWidth: 12,
		trunkTopWidth: 7,
		trunkBottom: H * 0.95,
		defaultTrunkTop: H * 0.42,
		generateBlobs(rng, blobCount) {
			const blobs: Blob[] = [];
			const centerX = W / 2 + randomInRange(rng, -8, 8);
			const canopyCenterY = H * 0.28;
			const spreadRadius = W * 0.25;

			for (let i = 0; i < blobCount; i++) {
				const angle = (i / blobCount) * Math.PI * 2 + randomInRange(rng, -0.5, 0.5);
				const dist = randomInRange(rng, spreadRadius * 0.15, spreadRadius * 0.85);
				const cx = centerX + Math.cos(angle) * dist;
				const cy = canopyCenterY + Math.sin(angle) * dist * 0.5;
				const rx = randomInRange(rng, W * 0.15, W * 0.25);
				const ry = randomInRange(rng, H * 0.07, H * 0.13);
				blobs.push({ cx, cy, rx, ry });
			}
			ensureLargestBlobInBottomHalf(blobs);
			return blobs;
		},
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

export function computeTrunkTop(shapeDef: ShapeDefinition, blobs: readonly Blob[]): number {
	const blobsBounds = getBlobsBounds(blobs);
	return Math.min(shapeDef.defaultTrunkTop, blobsBounds.maxY - TRUNK_ENTRY_MIN_PX);
}

export function isPointInTrunk(
	x: number,
	y: number,
	trunkTop: number,
	trunkBottom: number,
	trunkTopWidth: number,
	trunkBaseWidth: number,
	trunkLean: number,
): boolean {
	const t = (y - trunkTop) / (trunkBottom - trunkTop);
	if (t < 0 || t > 1) {
		return false;
	}
	const width = trunkTopWidth + t * (trunkBaseWidth - trunkTopWidth);
	const centerX = VIEWBOX_WIDTH / 2 + trunkLean * (1 - t);
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

export function generateTiers(rng: () => number, blobCount: number): Tier[] {
	const tiers: Tier[] = [];
	const count = Math.max(1, blobCount);
	const centerX = W / 2;
	const tipY = H * 0.05;
	const baseY = H * 0.6;
	const totalHeight = baseY - tipY;

	for (let i = 0; i < count; i++) {
		const t0 = i / count;
		const t1 = (i + 1) / count;

		const tierTipY = tipY + t0 * totalHeight;
		const tierBaseY = tipY + t1 * totalHeight;

		const baseHalfWidth = W * 0.06 + t1 * W * 0.22;

		const jitterX = randomInRange(rng, -2, 2);

		tiers.push({
			tipX: centerX + jitterX,
			tipY: tierTipY - (i > 0 ? totalHeight * 0.04 : 0),
			baseLeftX: centerX - baseHalfWidth + randomInRange(rng, -3, 3),
			baseLeftY: tierBaseY,
			baseRightX: centerX + baseHalfWidth + randomInRange(rng, -3, 3),
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
// Blob size variance
// ---------------------------------------------------------------------------

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

export function applyBlobSizeVariance(blobs: Blob[], blobSizeVariance: number): void {
	if (blobs.length <= 1) {
		return;
	}

	const minScale = 1.0 - blobSizeVariance * 0.9;

	for (let i = 1; i < blobs.length; i++) {
		const scale = lerp(1.0, minScale, i / (blobs.length - 1));
		blobs[i]!.rx *= scale;
		blobs[i]!.ry *= scale;
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
// Hierarchical branching
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

export function generateBranches(
	rng: () => number,
	trunkTop: number,
	trunkBottom: number,
	trunkTopWidth: number,
	branchCount: number,
	trunkLean: number,
	blobs: readonly Blob[],
): BranchSegment[] {
	if (branchCount <= 0) {
		return [];
	}

	const branches: BranchSegment[] = [];
	const trunkCenterX = VIEWBOX_WIDTH / 2;
	const trunkHeight = trunkBottom - trunkTop;
	const canopyBottom = getBlobsBounds(blobs).maxY;

	const trunkBranchCount = Math.max(1, Math.round(branchCount * TRUNK_BRANCH_RATIO));
	const subBranchCount = branchCount - trunkBranchCount;

	for (let i = 0; i < trunkBranchCount; i++) {
		const side = i % 2 === 0 ? 1 : -1;
		const branchT = randomInRange(rng, 0.05, 0.35);
		const startY = trunkTop + trunkHeight * branchT;
		const t = branchT;
		const startX = trunkCenterX + trunkLean * (1 - t);
		const length = randomInRange(rng, 25, 50);
		const upAngle = randomInRange(rng, 0.3, 1.2);
		const endX = startX + Math.cos(upAngle) * length * side;
		let endY = startY - Math.sin(upAngle) * length;
		const widthStart = randomInRange(rng, 4, 7);
		const widthEnd = randomInRange(rng, 1, 3);

		if (endY < canopyBottom && !isPointInBlobs(endX, endY, blobs)) {
			const dirX = endX - startX;
			const dirY = endY - startY;
			const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
			if (dirLen > 0) {
				const ux = dirX / dirLen;
				const uy = dirY / dirLen;
				for (let ext = 1; ext <= 40; ext++) {
					const px = endX + ux * ext;
					const py = endY + uy * ext;
					if (isPointInBlobs(px, py, blobs)) {
						endY = py;
						break;
					}
				}
			}
		}

		branches.push({ x1: startX, y1: startY, x2: endX, y2: endY, widthStart, widthEnd });
	}

	const isolatedBlobIndices = findIsolatedBlobs(blobs);
	const isolatedReached = new Set<number>();

	for (let i = 0; i < subBranchCount; i++) {
		if (branches.length === 0) {
			break;
		}
		const parent = branches[Math.floor(rng() * branches.length)]!;
		const startT = randomInRange(rng, 0.3, 0.7);
		const startX = parent.x1 + startT * (parent.x2 - parent.x1);
		const startY = parent.y1 + startT * (parent.y2 - parent.y1);

		const side = i % 2 === 0 ? 1 : -1;
		const length = randomInRange(rng, 15, 35);
		const upAngle = randomInRange(rng, 0.2, 1.0);
		const endX = startX + Math.cos(upAngle) * length * side;
		let endY = startY - Math.sin(upAngle) * length;

		if (endY < canopyBottom && !isPointInBlobs(endX, endY, blobs)) {
			const dirX = endX - startX;
			const dirY = endY - startY;
			const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
			if (dirLen > 0) {
				const ux = dirX / dirLen;
				const uy = dirY / dirLen;
				for (let ext = 1; ext <= 30; ext++) {
					const px = endX + ux * ext;
					const py = endY + uy * ext;
					if (isPointInBlobs(px, py, blobs)) {
						endY = py;
						break;
					}
				}
			}
		}

		for (const idx of isolatedBlobIndices) {
			if (isPointInSingleBlob(endX, endY, blobs[idx]!)) {
				isolatedReached.add(idx);
			}
		}

		branches.push({
			x1: startX,
			y1: startY,
			x2: endX,
			y2: endY,
			widthStart: randomInRange(rng, SUB_BRANCH_WIDTH_MIN, SUB_BRANCH_WIDTH_MAX),
			widthEnd: randomInRange(rng, 1, 2),
		});
	}

	for (const idx of isolatedBlobIndices) {
		if (isolatedReached.has(idx)) {
			continue;
		}
		const blob = blobs[idx]!;
		const branchT = randomInRange(rng, 0.1, 0.3);
		const originY = trunkTop + trunkHeight * branchT;
		const originX = trunkCenterX + trunkLean * (1 - branchT);

		branches.push({
			x1: originX,
			y1: originY,
			x2: blob.cx,
			y2: blob.cy,
			widthStart: randomInRange(rng, 3, 5),
			widthEnd: randomInRange(rng, 1, 2),
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
			widthStart: 4,
			widthEnd: 1,
		});
	}

	return additional;
}
