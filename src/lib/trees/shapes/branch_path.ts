import type { Point2D, CrookednessMode } from '../types.js';
import { CROOKEDNESS_MODES } from '../types.js';
import { randomInRange } from '../prng.js';
import { lerp } from '../math.js';

// ---------------------------------------------------------------------------
// Branch path building (issue #105 — multi-junction branches)
// ---------------------------------------------------------------------------

/** Maximum absolute angle from branch axis (degrees) to prevent self-intersection. */
const MAX_BRANCH_ABSOLUTE_ANGLE_DEG = 85;

/**
 * Compute effective branch segments per depth (REQ-EV2-B-04):
 * L1 = config, L2 = max(config-1, 1), L3+ = 1.
 */
export function computeEffectiveBranchSegments(configSegments: number, depth: number): number {
	if (depth >= 3) {
		return 1;
	}
	if (depth === 2) {
		return Math.max(configSegments - 1, 1);
	}
	return configSegments;
}

/**
 * Build a crooked polyline path for a branch. Analogous to trunk's
 * `buildCrookedPath` but works in the branch's local coordinate frame
 * (arbitrary direction, not just vertical).
 *
 * Uses the same jitter model as the trunk: cumulative angle from branch
 * axis, per-junction jitter reduction, segment length variation, and
 * alternating/random mode.
 */
export function buildBranchPath(
	rng: () => number,
	startX: number,
	startY: number,
	endX: number,
	endY: number,
	segments: number,
	crookedness: number,
	crookednessMode: CrookednessMode,
): Point2D[] {
	const segmentCount = Math.max(1, Math.min(5, Math.round(segments)));
	const clampedCrookedness = Math.max(0, Math.min(100, crookedness));

	const totalDx = endX - startX;
	const totalDy = endY - startY;
	const totalLength = Math.sqrt(totalDx * totalDx + totalDy * totalDy);

	if (totalLength === 0) {
		return [
			{ x: startX, y: startY },
			{ x: endX, y: endY },
		];
	}

	// Unit vectors along branch axis and perpendicular
	const axisX = totalDx / totalLength;
	const axisY = totalDy / totalLength;
	const perpX = -axisY;
	const perpY = axisX;

	const baseSegmentLen = totalLength / segmentCount;

	// Segment length variation: only when crookedness > 0 (same as trunk)
	let segmentMultipliers: number[] | null = null;
	let normalizeScale = 1;
	if (clampedCrookedness > 0) {
		segmentMultipliers = [];
		let multiplierSum = 0;
		for (let i = 0; i < segmentCount; i++) {
			const mult = 0.7 + rng() * 0.6; // 0.7-1.3 range (+/-30%)
			segmentMultipliers.push(mult);
			multiplierSum += mult;
		}
		normalizeScale = segmentCount / multiplierSum;
	}

	const junctions: Point2D[] = [{ x: startX, y: startY }];

	const maxJitterDeg = lerp(0, 90, clampedCrookedness / 100);
	const maxAbsoluteRad = (MAX_BRANCH_ABSOLUTE_ANGLE_DEG * Math.PI) / 180;

	let currentAngleRad = 0; // Angle relative to branch axis
	let alternatingSign = clampedCrookedness > 0 ? (rng() < 0.5 ? -1 : 1) : 1;
	let cumulativeAxisLen = 0;
	let cumulativePerpOffset = 0;

	for (let i = 1; i <= segmentCount; i++) {
		const segmentLen =
			segmentMultipliers !== null
				? baseSegmentLen * segmentMultipliers[i - 1]! * normalizeScale
				: baseSegmentLen;

		if (i > 1 && clampedCrookedness > 0) {
			// Per-junction jitter reduction: up to 50% of max
			const jitterReduction = 0.5 + rng() * 0.5; // 0.5-1.0 multiplier
			const effectiveMaxJitter = maxJitterDeg * jitterReduction;

			let jitterSign: number;
			if (crookednessMode === CROOKEDNESS_MODES.alternating) {
				alternatingSign *= -1;
				jitterSign = alternatingSign;
			} else {
				jitterSign = rng() < 0.5 ? -1 : 1;
			}

			const jitterDeg =
				randomInRange(rng, effectiveMaxJitter * 0.3, effectiveMaxJitter) * jitterSign;
			currentAngleRad += (jitterDeg * Math.PI) / 180;
			currentAngleRad = Math.max(-maxAbsoluteRad, Math.min(maxAbsoluteRad, currentAngleRad));
		}

		cumulativeAxisLen += segmentLen;
		cumulativePerpOffset += segmentLen * Math.tan(currentAngleRad);

		junctions.push({
			x: startX + axisX * cumulativeAxisLen + perpX * cumulativePerpOffset,
			y: startY + axisY * cumulativeAxisLen + perpY * cumulativePerpOffset,
		});
	}

	return junctions;
}

/**
 * Sample a point along a polyline path at parametric position t ∈ [0,1].
 * Piecewise-linear interpolation: t=0 → first junction, t=1 → last junction.
 */
export function samplePointAlongPath(path: readonly Point2D[], t: number): Point2D {
	if (path.length < 2) {
		return path[0]!;
	}

	// Fast-path exact endpoints to avoid float-accumulation drift
	if (t <= 0) {
		return path[0]!;
	}
	if (t >= 1) {
		return path[path.length - 1]!;
	}

	// Compute cumulative segment lengths
	let totalLength = 0;
	const segmentLengths: number[] = [];
	for (let i = 0; i < path.length - 1; i++) {
		const dx = path[i + 1]!.x - path[i]!.x;
		const dy = path[i + 1]!.y - path[i]!.y;
		const len = Math.sqrt(dx * dx + dy * dy);
		segmentLengths.push(len);
		totalLength += len;
	}

	if (totalLength === 0) {
		return path[0]!;
	}

	const targetDistance = t * totalLength;
	let accumulated = 0;

	for (let i = 0; i < segmentLengths.length; i++) {
		const segLen = segmentLengths[i]!;
		if (accumulated + segLen >= targetDistance || i === segmentLengths.length - 1) {
			const localT = segLen > 0 ? (targetDistance - accumulated) / segLen : 0;
			return {
				x: path[i]!.x + localT * (path[i + 1]!.x - path[i]!.x),
				y: path[i]!.y + localT * (path[i + 1]!.y - path[i]!.y),
			};
		}
		accumulated += segLen;
	}

	return path[path.length - 1]!;
}
