import type { Point2D } from '../types.js';
import { VIEWBOX_WIDTH } from '../types.js';
import { randomInRange } from '../prng.js';
import type { ShapeDefinition } from './shape_types.js';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Trunk helpers
// ---------------------------------------------------------------------------

export function computeEffectiveTrunkTop(shapeDef: ShapeDefinition, trunkHeight: number): number {
	const trunkBottom = shapeDef.trunkBottom;
	const defaultTop = shapeDef.defaultTrunkTop;
	return trunkBottom - (trunkBottom - defaultTop) * (trunkHeight / 100);
}

/** Maximum absolute angle from vertical (degrees) to prevent self-intersection. */
const MAX_ABSOLUTE_ANGLE_DEG = 85;

/**
 * Build a crooked polyline path. Used for both trunk and branches.
 *
 * Angle model (BR-11, BR-12):
 *   - Max angular change per junction: 90 degrees at 100% crookedness.
 *   - Per-junction jitter reduces max by up to 50% (effective 45-90 deg at 100%).
 *   - Direction random per junction (left/right) enabling S-curves, zigzags.
 *   - Self-intersection prevention: clamp absolute angle to +/-85 degrees.
 */
function buildCrookedPath(
	rng: () => number,
	startX: number,
	startY: number,
	endY: number,
	segments: number,
	crookedness: number,
	initialAngleDeg: number,
): Point2D[] {
	const segmentCount = Math.max(1, Math.min(5, Math.round(segments)));
	const clampedCrookedness = Math.max(0, Math.min(100, crookedness));
	const totalHeight = Math.abs(startY - endY);
	const segmentLenY = totalHeight / segmentCount;
	const direction = startY > endY ? -1 : 1; // -1 = going up (trunk), +1 = going down

	const junctions: Point2D[] = [{ x: startX, y: startY }];

	const initialAngleRad = (initialAngleDeg * Math.PI) / 180;
	const maxJitterDeg = lerp(0, 90, clampedCrookedness / 100);
	const maxAbsoluteRad = (MAX_ABSOLUTE_ANGLE_DEG * Math.PI) / 180;

	let currentAngleRad = initialAngleRad;
	let currentX = startX;

	for (let i = 1; i <= segmentCount; i++) {
		if (i > 1 && clampedCrookedness > 0) {
			// Per-junction jitter reduction: up to 50% of max
			const jitterReduction = 0.5 + rng() * 0.5; // 0.5-1.0 multiplier
			const effectiveMaxJitter = maxJitterDeg * jitterReduction;
			// Random direction for S-curves
			const jitterSign = rng() < 0.5 ? -1 : 1;
			const jitterDeg =
				randomInRange(rng, effectiveMaxJitter * 0.3, effectiveMaxJitter) * jitterSign;
			currentAngleRad += (jitterDeg * Math.PI) / 180;
			// Self-intersection prevention: clamp absolute angle
			currentAngleRad = Math.max(-maxAbsoluteRad, Math.min(maxAbsoluteRad, currentAngleRad));
		}
		currentX += segmentLenY * Math.tan(currentAngleRad);
		const newY = i === segmentCount ? endY : startY + direction * i * segmentLenY;
		junctions.push({ x: currentX, y: newY });
	}

	return junctions;
}

/**
 * Build the trunk centerline as a polyline of junctions from base to top.
 *
 * Conventions:
 *   - `junctions[0]` is always the base at `{ x: VIEWBOX_WIDTH/2, y: trunkBottom }`.
 *   - `junctions[trunkSegments]` is the topmost junction (canopy attachment).
 *   - Junctions are in descending-y order (base has highest y, top has lowest).
 *   - `trunkLean` is measured in degrees from vertical, positive = leans right.
 *   - First segment angle = trunkLean (pure lean, no jitter).
 */
export function buildTrunkPath(
	rng: () => number,
	trunkLean: number,
	trunkSegments: number,
	trunkCrookedness: number,
	trunkTop: number,
	trunkBottom: number,
): Point2D[] {
	return buildCrookedPath(
		rng,
		VIEWBOX_WIDTH / 2,
		trunkBottom,
		trunkTop,
		trunkSegments,
		trunkCrookedness,
		trunkLean,
	);
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
