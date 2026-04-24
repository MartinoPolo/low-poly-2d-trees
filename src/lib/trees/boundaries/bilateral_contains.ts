import { inverseRotateToLocal } from './rotation_math.js';

export function bilateralContains(
	px: number,
	py: number,
	cx: number,
	cy: number,
	rx: number,
	ry: number,
	rotationDeg: number,
	xHalfWidthFn: (tParam: number) => number,
): boolean {
	const { xLocal, yLocal } = inverseRotateToLocal(px, py, cx, cy, rotationDeg);
	const tParam = yLocal / ry;
	if (tParam < -1 || tParam > 1) {
		return false;
	}
	const halfWidth = xHalfWidthFn(tParam);
	if (halfWidth <= 0) {
		return Math.abs(xLocal) < 1e-9;
	}
	const nx = xLocal / (rx * halfWidth);
	return nx * nx <= 1;
}
