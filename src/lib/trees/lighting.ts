import { clamp, hslToHex, interpolateHslInHexSpace } from './color.js';
import type { Point2D } from './types.js';

interface LightConfig {
	readonly lightAngle: number;
	readonly canopyLightColor: string;
	readonly canopyDarkColor: string;
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

/**
 * Compute canopy triangle color using hemisphere-based pseudo-3D lighting.
 * The output color is produced by interpolating between `canopyDarkColor`
 * and `canopyLightColor` in HSL space using the computed lighting factor
 * (REQ-L-01, REQ-L-02, REQ-L-07). Fully-lit faces map exactly to
 * `canopyLightColor`; fully-shadowed faces map exactly to `canopyDarkColor`.
 */
export function computeCanopyColor(
	points: readonly [Point2D, Point2D, Point2D],
	canopyBounds: { minX: number; minY: number; maxX: number; maxY: number },
	config: LightConfig,
): string {
	const centroid = triangleCentroid(points);
	const light = normalize3(lightDirection(config.lightAngle));

	// Map centroid to [-1, 1] within canopy bounds
	const bw = canopyBounds.maxX - canopyBounds.minX;
	const bh = canopyBounds.maxY - canopyBounds.minY;
	const nx = bw > 0 ? ((centroid.x - canopyBounds.minX) / bw) * 2 - 1 : 0;
	const ny = bh > 0 ? ((centroid.y - canopyBounds.minY) / bh) * 2 - 1 : 0;

	// Hemisphere: compute z from position on dome. REQ-L-04 scales z by
	// depthVariance (0 → uniform lighting, 1 → standard, 2 → exaggerated).
	const r2 = nx * nx + ny * ny;
	const z = (r2 < 1 ? Math.sqrt(1 - r2) : 0.05) * config.depthVariance;
	const normal = normalize3({ x: nx * 0.7, y: ny * 0.7, z });

	// Diffuse lighting clamped to [0, 1]
	const diffuse = clamp(dot3(normal, light), 0, 1);

	// Rim darkening — triangles outside the hemisphere disk
	const rimFactor = r2 < 1 ? 1 : 0.7;

	// REQ-L-02: ambient 0.15 + diffuse 0.85 × diffuse. Rim factor applies
	// last and only reduces edge brightness, so fully-lit non-rim faces
	// still reach lighting = 1 and land on canopyLightColor exactly.
	const lighting = clamp((0.15 + 0.85 * diffuse) * rimFactor, 0, 1);

	return interpolateHslInHexSpace(config.canopyDarkColor, config.canopyLightColor, lighting);
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

	// Cylinder mapping — only horizontal position matters (REQ-L-08)
	const bw = trunkBounds.maxX - trunkBounds.minX;
	const nx = bw > 0 ? ((centroid.x - trunkBounds.minX) / bw) * 2 - 1 : 0;
	const z = Math.sqrt(Math.max(0, 1 - nx * nx));
	const normal = normalize3({ x: nx, y: 0, z });

	const diffuse = clamp(dot3(normal, light), 0, 1);
	const lighting = 0.25 + 0.75 * diffuse;

	const hue = config.trunkHue + (rng() - 0.5) * 8;
	const sat = config.trunkSaturation + (rng() - 0.5) * 8;
	const lightness = config.trunkLightness + (lighting - 0.5) * 35 + (rng() - 0.5) * 4;

	return hslToHex(hue, sat, lightness);
}

/**
 * Compute two-tone trunk/branch colors (BR-2).
 * Returns light and dark hex colors. Light side flips with lightAngle.
 */
export function computeTwoToneColors(config: LightConfig): {
	lightColor: string;
	darkColor: string;
} {
	const lightOffset = 12;
	const darkOffset = -8;

	const lightColor = hslToHex(
		config.trunkHue,
		config.trunkSaturation,
		config.trunkLightness + lightOffset,
	);
	const darkColor = hslToHex(
		config.trunkHue,
		config.trunkSaturation,
		config.trunkLightness + darkOffset,
	);

	return { lightColor, darkColor };
}

/**
 * Determine if the "left" side of a quad (relative to its direction) is the
 * light side based on lightAngle. For trunk (vertical), left = screen-left.
 * For branches, left is perpendicular-left relative to branch direction.
 */
export function isLeftSideLight(lightAngle: number, directionAngleRad: number): boolean {
	const light = normalize3(lightDirection(lightAngle));
	// Perpendicular left normal of the branch direction
	const perpX = -Math.sin(directionAngleRad);
	const perpY = Math.cos(directionAngleRad);
	// Dot product with light direction — positive means light hits left side
	return light.x * perpX + light.y * perpY > 0;
}
