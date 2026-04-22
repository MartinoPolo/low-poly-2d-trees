import type { Point2D, Quad, TreeConfig } from '../types.js';
import { GEOMETRY_GROUPS } from '../types.js';
import { createPrng } from '../prng.js';
import { computeJunctionBisectors } from '../shapes.js';
import { computeStripColors } from '../lighting.js';

// ---------------------------------------------------------------------------
// Tri-split constants
// ---------------------------------------------------------------------------

const TRUNK_SEGMENT_SEED_OFFSET = 500;
export const BRANCH_SEED_OFFSET = 700;

/** Center normal xy-perturbation: (rng - 0.5) * this = ±0.15 range. */
export const CENTER_NORMAL_PERTURBATION_RANGE = 0.3;

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
export function computeJunctionEdgePoints(
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

interface TrunkQuadResult {
	quads: Quad[];
	junctionEdgePoints: Point2D[][];
	junctionWidths: number[];
	stripRatios: number[][];
	bisectors: readonly { perpX: number; perpY: number }[];
}

export function generateTrunkQuads(
	trunkJunctions: readonly Point2D[],
	shapeDef: { readonly trunkBaseWidth: number; readonly trunkTopWidth: number },
	config: TreeConfig,
	forkReductions: readonly { readonly junctionIndex: number; readonly reduction: number }[] = [],
): TrunkQuadResult {
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

	// Trunk fork flare: widen top 1-2 junctions by 30-50%
	if (config.trunkFork && junctionCount >= 2) {
		const flareCount = Math.min(2, junctionCount - 1);
		for (let f = 0; f < flareCount; f++) {
			const idx = junctionCount - 2 - f;
			const flareMultiplier =
				1.3 + (0.2 * (flareCount - 1 - f)) / Math.max(1, flareCount - 1);
			junctionWidths[idx] = junctionWidths[idx]! * flareMultiplier;
		}
	}

	// Enforce monotonically decreasing widths from base to top so flare
	// never makes the trunk wider than the junction below it.
	for (let j = 1; j < junctionCount; j++) {
		junctionWidths[j] = Math.min(junctionWidths[j]!, junctionWidths[j - 1]!);
	}

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
	const segmentEnd =
		config.trunkFork && junctionCount >= 3 ? junctionCount - 2 : junctionCount - 1;

	for (let i = 0; i < segmentEnd; i++) {
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
