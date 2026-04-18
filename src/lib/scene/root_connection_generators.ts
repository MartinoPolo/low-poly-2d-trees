import { createPrng, randomInRange } from '$lib/trees/prng.js';
import type { Point2D } from '$lib/trees/types/core.js';
import type { BezierControlPoints } from './root_connection_types.js';

export function generateBezierControlPoints(
	from: Point2D,
	to: Point2D,
	seed: number,
): BezierControlPoints {
	const rng = createPrng(seed);

	const dx = to.x - from.x;
	const dy = to.y - from.y;

	const sagAmount = Math.abs(dx) * 0.3 + 20;
	const jitter1 = randomInRange(rng, -15, 15);
	const jitter2 = randomInRange(rng, -15, 15);

	const controlPoint1: Point2D = {
		x: from.x + dx * 0.3 + jitter1,
		y: from.y + dy * 0.3 + sagAmount,
	};

	const controlPoint2: Point2D = {
		x: from.x + dx * 0.7 + jitter2,
		y: from.y + dy * 0.7 + sagAmount,
	};

	return { controlPoint1, controlPoint2 };
}

export function buildBezierPathData(
	from: Point2D,
	to: Point2D,
	controlPoints: BezierControlPoints,
): string {
	const { controlPoint1, controlPoint2 } = controlPoints;
	return `M${from.x},${from.y} C${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${to.x},${to.y}`;
}
