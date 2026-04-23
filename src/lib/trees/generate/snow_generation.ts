import type { Point2D, Triangle, SnowCapGeometry, Tier } from '../types.js';
import { GEOMETRY_GROUPS } from '../types.js';
import { interpolateHslInHexSpace } from '../color.js';
import { rotatePointAroundCenter } from '../boundaries/rotation_math.js';
import { BOUNDARY_KINDS } from '../boundaries/types.js';
import { randomInRange } from '../prng.js';
import type { Blob } from '../shapes.js';

const SNOW_BLOB_COVERAGE = 0.35;
const SNOW_BLOB_ARC_SAMPLE_COUNT = 14;
const SNOW_BLOB_OVERHANG = 0.06;
const SNOW_BLOB_TOP_OVERHANG = 0.02;
const SNOW_BLOB_BOTTOM_EDGE_POINTS = 5;
const SNOW_BLOB_BOTTOM_JITTER = 0.04;
const SNOW_LIGHT_COLOR = '#ffffff';
const SNOW_DARK_COLOR = '#e8ecf0';

const SNOW_TIER_COVERAGE = 0.75;
const SNOW_TIER_OVERHANG = 1.04;
const SNOW_TIER_TIP_OVERHANG = 0.02;
const SNOW_TIER_BOTTOM_EDGE_POINTS = 5;
const SNOW_TIER_BOTTOM_JITTER = 0.06;

function fanTriangulate(polygon: Point2D[], snowTopY: number, snowBottomY: number): Triangle[] {
	const centroidX = polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length;
	const centroidY = polygon.reduce((sum, p) => sum + p.y, 0) / polygon.length;
	const centroid: Point2D = { x: centroidX, y: centroidY };
	const snowYRange = snowBottomY - snowTopY;
	return polygon.map((a, i) => {
		const b = polygon[(i + 1) % polygon.length]!;
		const triCentroidY = (centroid.y + a.y + b.y) / 3;
		const verticalFactor = snowYRange > 0 ? (triCentroidY - snowTopY) / snowYRange : 0.5;
		return {
			points: [centroid, a, b],
			color: interpolateHslInHexSpace(SNOW_DARK_COLOR, SNOW_LIGHT_COLOR, 1 - verticalFactor),
			group: GEOMETRY_GROUPS.snow,
		};
	});
}

function expandFromCentroid(
	px: number,
	py: number,
	cx: number,
	cy: number,
	factor: number,
): Point2D {
	return { x: cx + (px - cx) * factor, y: cy + (py - cy) * factor };
}

export function generateTierSnowCap(tier: Tier, rng: () => number): SnowCapGeometry {
	const tierHeight = (tier.baseLeftY + tier.baseRightY) / 2 - tier.tipY;
	if (tierHeight < 1) {
		return { triangles: [] };
	}

	const cx = (tier.tipX + tier.baseLeftX + tier.baseRightX) / 3;
	const cy = (tier.tipY + tier.baseLeftY + tier.baseRightY) / 3;

	const snowTip = expandFromCentroid(
		tier.tipX,
		tier.tipY - SNOW_TIER_TIP_OVERHANG * tierHeight,
		cx,
		cy,
		SNOW_TIER_OVERHANG,
	);

	const leftCutX = tier.tipX + SNOW_TIER_COVERAGE * (tier.baseLeftX - tier.tipX);
	const leftCutY = tier.tipY + SNOW_TIER_COVERAGE * (tier.baseLeftY - tier.tipY);
	const rightCutX = tier.tipX + SNOW_TIER_COVERAGE * (tier.baseRightX - tier.tipX);
	const rightCutY = tier.tipY + SNOW_TIER_COVERAGE * (tier.baseRightY - tier.tipY);

	const snowLeftCut = expandFromCentroid(leftCutX, leftCutY, cx, cy, SNOW_TIER_OVERHANG);
	const snowRightCut = expandFromCentroid(rightCutX, rightCutY, cx, cy, SNOW_TIER_OVERHANG);

	const bottomEdgePoints: Point2D[] = [];
	for (let i = 1; i <= SNOW_TIER_BOTTOM_EDGE_POINTS; i++) {
		const t = i / (SNOW_TIER_BOTTOM_EDGE_POINTS + 1);
		const baseX = snowLeftCut.x + t * (snowRightCut.x - snowLeftCut.x);
		const baseY = snowLeftCut.y + t * (snowRightCut.y - snowLeftCut.y);
		const jitter = randomInRange(rng, -SNOW_TIER_BOTTOM_JITTER, SNOW_TIER_BOTTOM_JITTER);
		bottomEdgePoints.push({ x: baseX, y: baseY + jitter * tierHeight });
	}

	const polygon: Point2D[] = [snowTip, snowLeftCut, ...bottomEdgePoints, snowRightCut];

	const allYValues = polygon.map((p) => p.y);
	const snowTopY = Math.min(...allYValues);
	const snowBottomY = Math.max(...allYValues);

	return { triangles: fanTriangulate(polygon, snowTopY, snowBottomY) };
}

const TEARDROP_POINT_EXPONENT = 0.6;

function teardropHalfWidth(tParam: number): number {
	const ellipseFactor = Math.sqrt(Math.max(0, 1 - tParam * tParam));
	if (tParam < 0) {
		return ellipseFactor * Math.pow(1 + tParam, TEARDROP_POINT_EXPONENT);
	}
	return ellipseFactor;
}

function circleHalfWidth(tParam: number): number {
	return Math.sqrt(Math.max(0, 1 - tParam * tParam));
}

function applyBlobRotation(worldX: number, worldY: number, blob: Blob): Point2D {
	if (blob.rotationDeg) {
		return rotatePointAroundCenter(worldX, worldY, blob.cx, blob.cy, blob.rotationDeg);
	}
	return { x: worldX, y: worldY };
}

export function generateBlobSnowCap(blob: Blob, rng: () => number): SnowCapGeometry {
	if (blob.rx < 1 || blob.ry < 1) {
		return { triangles: [] };
	}

	const halfWidthFn =
		blob.boundary === BOUNDARY_KINDS.teardrop ? teardropHalfWidth : circleHalfWidth;

	const tCutoff = -1 + 2 * SNOW_BLOB_COVERAGE;
	const cutoffHalfWidth = halfWidthFn(tCutoff);
	const snowHalfWidth = blob.rx * cutoffHalfWidth * (1 + SNOW_BLOB_OVERHANG);

	const cutoffY = blob.cy + blob.ry * tCutoff;
	const snowTopY = blob.cy - blob.ry - SNOW_BLOB_TOP_OVERHANG * blob.ry;
	const snowHeight = cutoffY - snowTopY;

	// Rounded arc: left-bottom → top → right-bottom
	const polygon: Point2D[] = [];
	for (let i = 0; i <= SNOW_BLOB_ARC_SAMPLE_COUNT; i++) {
		const angle = Math.PI * (1 - i / SNOW_BLOB_ARC_SAMPLE_COUNT);
		const x = blob.cx + snowHalfWidth * Math.cos(angle);
		const y = cutoffY - snowHeight * Math.sin(angle);
		polygon.push(applyBlobRotation(x, y, blob));
	}

	// Jittered bottom edge: right to left
	for (let j = 1; j <= SNOW_BLOB_BOTTOM_EDGE_POINTS; j++) {
		const fraction = j / (SNOW_BLOB_BOTTOM_EDGE_POINTS + 1);
		const baseX = blob.cx + snowHalfWidth * (1 - 2 * fraction);
		const jitter = randomInRange(rng, -SNOW_BLOB_BOTTOM_JITTER, SNOW_BLOB_BOTTOM_JITTER);
		polygon.push(applyBlobRotation(baseX, cutoffY + jitter * blob.ry, blob));
	}

	const allYValues = polygon.map((p) => p.y);
	return { triangles: fanTriangulate(polygon, Math.min(...allYValues), Math.max(...allYValues)) };
}
