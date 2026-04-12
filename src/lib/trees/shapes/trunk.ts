import type { Point2D } from '../types.js';
import { VIEWBOX_WIDTH } from '../types.js';
import { randomInRange } from '../prng.js';
import type { ShapeDefinition } from './shape-types.js';

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
