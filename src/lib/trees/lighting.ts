import type { Point2D } from './types.js';

interface LightConfig {
	readonly lightAngle: number;
	readonly canopyHue: number;
	readonly canopyHueSpread: number;
	readonly canopySaturation: number;
	readonly canopyLightness: number;
	readonly trunkHue: number;
	readonly trunkSaturation: number;
	readonly trunkLightness: number;
	readonly depthVariance: number;
}

function degToRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

function lightDirection(angleDeg: number): { x: number; y: number; z: number } {
	const rad = degToRad(angleDeg);
	return {
		x: Math.cos(rad),
		y: -Math.sin(rad),
		z: 0.5,
	};
}

function normalize3(v: { x: number; y: number; z: number }): {
	x: number;
	y: number;
	z: number;
} {
	const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
	if (len === 0) {
		return { x: 0, y: 0, z: 1 };
	}
	return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function dot3(
	a: { x: number; y: number; z: number },
	b: { x: number; y: number; z: number },
): number {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function triangleCentroid(points: readonly [Point2D, Point2D, Point2D]): Point2D {
	return {
		x: (points[0].x + points[1].x + points[2].x) / 3,
		y: (points[0].y + points[1].y + points[2].y) / 3,
	};
}

function clamp(val: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, val));
}

function hslToHex(h: number, s: number, l: number): string {
	h = ((h % 360) + 360) % 360;
	s = clamp(s, 0, 100) / 100;
	l = clamp(l, 0, 100) / 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r: number, g: number, b: number;
	if (h < 60) {
		[r, g, b] = [c, x, 0];
	} else if (h < 120) {
		[r, g, b] = [x, c, 0];
	} else if (h < 180) {
		[r, g, b] = [0, c, x];
	} else if (h < 240) {
		[r, g, b] = [0, x, c];
	} else if (h < 300) {
		[r, g, b] = [x, 0, c];
	} else {
		[r, g, b] = [c, 0, x];
	}

	const toHex = (v: number) =>
		Math.round((v + m) * 255)
			.toString(16)
			.padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Compute canopy triangle color using hemisphere-based pseudo-3D lighting.
 */
export function computeCanopyColor(
	points: readonly [Point2D, Point2D, Point2D],
	canopyBounds: { minX: number; minY: number; maxX: number; maxY: number },
	config: LightConfig,
	rng: () => number,
): string {
	const centroid = triangleCentroid(points);
	const light = normalize3(lightDirection(config.lightAngle));

	// Map centroid to [-1, 1] within canopy bounds
	const bw = canopyBounds.maxX - canopyBounds.minX;
	const bh = canopyBounds.maxY - canopyBounds.minY;
	const nx = bw > 0 ? ((centroid.x - canopyBounds.minX) / bw) * 2 - 1 : 0;
	const ny = bh > 0 ? ((centroid.y - canopyBounds.minY) / bh) * 2 - 1 : 0;

	// Hemisphere: compute z from position on dome
	const r2 = nx * nx + ny * ny;
	const z = (r2 < 1 ? Math.sqrt(1 - r2) : 0.05) * config.depthVariance;
	const normal = normalize3({ x: nx * 0.7, y: ny * 0.7, z });

	// Diffuse lighting
	const diffuse = clamp(dot3(normal, light), 0, 1);

	// Rim darkening — triangles at the edge of the canopy
	const rimFactor = r2 < 1 ? 1 : 0.7;

	// Combined lighting factor — wider range for more dramatic faceting
	const lighting = (0.15 + 0.85 * diffuse) * rimFactor;

	// Hue variation: shift hue based on lighting + random jitter
	// Lit faces shift toward yellow-green, shadowed toward blue-green
	const hueShift = (lighting - 0.5) * config.canopyHueSpread * 1.2 + (rng() - 0.5) * 20;
	const hue = config.canopyHue + hueShift;

	// Saturation: shadowed faces more saturated, lit faces slightly desaturated
	const sat = config.canopySaturation + (0.5 - lighting) * 20 + (rng() - 0.5) * 12;

	// Lightness driven by lighting model — wider spread for dramatic look
	const baseLightness = config.canopyLightness;
	const lightness = baseLightness + (lighting - 0.5) * 60 + (rng() - 0.5) * 8;

	return hslToHex(hue, sat, lightness);
}

/**
 * Compute trunk/branch triangle color using cylinder-like lighting.
 */
export function computeTrunkColor(
	points: readonly [Point2D, Point2D, Point2D],
	trunkBounds: { minX: number; maxX: number },
	config: LightConfig,
	rng: () => number,
): string {
	const centroid = triangleCentroid(points);
	const light = normalize3(lightDirection(config.lightAngle));

	// Cylinder mapping — only horizontal position matters
	const bw = trunkBounds.maxX - trunkBounds.minX;
	const nx = bw > 0 ? ((centroid.x - trunkBounds.minX) / bw) * 2 - 1 : 0;
	const z = Math.sqrt(Math.max(0, 1 - nx * nx));
	const normal = normalize3({ x: nx, y: 0, z });

	const diffuse = clamp(dot3(normal, light), 0, 1);
	const lighting = 0.4 + 0.6 * diffuse;

	const hue = config.trunkHue + (rng() - 0.5) * 8;
	const sat = config.trunkSaturation + (rng() - 0.5) * 8;
	const lightness = config.trunkLightness + (lighting - 0.5) * 25 + (rng() - 0.5) * 4;

	return hslToHex(hue, sat, lightness);
}
