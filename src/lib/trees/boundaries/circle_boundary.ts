import type { BoundaryShape } from './types.js';
import { BOUNDARY_KINDS } from './types.js';
import { inverseRotateToLocal, rotatePointAroundCenter } from './rotation_math.js';

// ---------------------------------------------------------------------------
// Circle (axis-aligned ellipse) boundary
// ---------------------------------------------------------------------------

const CIRCLE_RADIAL_JITTER_FACTOR = 0.15;
const CIRCLE_ANGLE_JITTER_RAD = (40 * Math.PI) / 180;

export const circleBoundary: BoundaryShape = {
	kind: BOUNDARY_KINDS.circle,
	contains(px, py, cx, cy, rx, ry, rotationDeg) {
		const { xLocal, yLocal } = inverseRotateToLocal(px, py, cx, cy, rotationDeg);
		const nx = xLocal / rx;
		const ny = yLocal / ry;
		return nx * nx + ny * ny <= 1;
	},
	sample(cx, cy, rx, ry, count, rng, rotationDeg) {
		const points = [];
		for (let i = 0; i < count; i++) {
			const baseAngle = (i / count) * Math.PI * 2;
			const angleJitter = (rng() - 0.5) * CIRCLE_ANGLE_JITTER_RAD;
			const angle = baseAngle + angleJitter;
			const radialJitter = 1.0 + (rng() - 0.5) * 2 * CIRCLE_RADIAL_JITTER_FACTOR;
			const xLocal = Math.cos(angle) * rx * radialJitter;
			const yLocal = Math.sin(angle) * ry * radialJitter;
			const rotated = rotatePointAroundCenter(cx + xLocal, cy + yLocal, cx, cy, rotationDeg);
			points.push(rotated);
		}
		return points;
	},
};
