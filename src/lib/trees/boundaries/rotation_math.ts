import type { BoundaryPoint } from './types.js';

// ---------------------------------------------------------------------------
// Rotation helpers shared by all boundary shape implementations
// ---------------------------------------------------------------------------

/**
 * Rotate a world-space point (px, py) around center (cx, cy) by rotationDeg
 * degrees (counter-clockwise in standard math coordinates). Returns the
 * rotated point unchanged when rotationDeg is exactly 0.
 */
export function rotatePointAroundCenter(
	px: number,
	py: number,
	cx: number,
	cy: number,
	rotationDeg: number,
): BoundaryPoint {
	if (rotationDeg === 0) {
		return { x: px, y: py };
	}
	const theta = (rotationDeg * Math.PI) / 180;
	const cosT = Math.cos(theta);
	const sinT = Math.sin(theta);
	const dx = px - cx;
	const dy = py - cy;
	return {
		x: cx + dx * cosT - dy * sinT,
		y: cy + dx * sinT + dy * cosT,
	};
}

/**
 * Inverse-rotate a world-space point into the local coordinate frame of a
 * shape centered at (cx, cy) with rotation rotationDeg. The result is the
 * local offset (xLocal, yLocal) from (cx, cy). Returns the plain offset when
 * rotationDeg is exactly 0.
 */
export function inverseRotateToLocal(
	px: number,
	py: number,
	cx: number,
	cy: number,
	rotationDeg: number,
): { xLocal: number; yLocal: number } {
	if (rotationDeg === 0) {
		return { xLocal: px - cx, yLocal: py - cy };
	}
	const theta = (-rotationDeg * Math.PI) / 180;
	const cosT = Math.cos(theta);
	const sinT = Math.sin(theta);
	const dx = px - cx;
	const dy = py - cy;
	return {
		xLocal: dx * cosT - dy * sinT,
		yLocal: dx * sinT + dy * cosT,
	};
}
