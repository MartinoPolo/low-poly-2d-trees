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

interface TriSplitColorInput {
	readonly segmentDirectionX: number;
	readonly segmentDirectionY: number;
	readonly lightAngle: number;
	readonly trunkHue: number;
	readonly trunkSaturation: number;
	readonly trunkLightness: number;
	readonly centerPerturbationX: number;
	readonly centerPerturbationY: number;
}

interface TriSplitColors {
	readonly leftColor: string;
	readonly centerColor: string;
	readonly rightColor: string;
}

// ---------------------------------------------------------------------------
// Engine v2: Variable strip count face colors (REQ-EV2-LT-01)
// ---------------------------------------------------------------------------

/** @public — exported for Phase 2 (#96) strip color computation */
export interface StripColorInput {
	readonly segmentDirectionX: number;
	readonly segmentDirectionY: number;
	readonly lightAngle: number;
	readonly trunkHue: number;
	readonly trunkSaturation: number;
	readonly trunkLightness: number;
	readonly centerPerturbationX: number;
	readonly centerPerturbationY: number;
	readonly stripCount: number;
}

/**
 * Compute face colors for variable strip counts (2-4).
 * Face normals derived from polygonal cross-section model:
 * - 2 strips (square): 4 total faces, normals at PI/4 spacing
 * - 3 strips (hex): 6 total faces, normals at PI/6 spacing (same as old tri-split)
 * - 4 strips (octagonal): 8 total faces, normals at PI/8 spacing
 */
export function computeStripColors(input: StripColorInput): string[] {
	const {
		segmentDirectionX: dx,
		segmentDirectionY: dy,
		lightAngle,
		trunkHue,
		trunkSaturation,
		trunkLightness,
		centerPerturbationX,
		centerPerturbationY,
		stripCount,
	} = input;

	const len = Math.sqrt(dx * dx + dy * dy);
	const ux = len > 0 ? dx / len : 0;
	const uy = len > 0 ? dy / len : -1;

	const totalFaces = 2 * stripCount;
	const faceAngleStep = Math.PI / totalFaces;
	const light = normalize3(lightDirection(lightAngle));

	function faceColor(normal: { x: number; y: number; z: number }): string {
		const d = dot3(normal, light);
		const lightnessOffset = -10 + ((d + 1) / 2) * 22;
		return hslToHex(trunkHue, trunkSaturation, trunkLightness + lightnessOffset);
	}

	const colors: string[] = [];

	for (let f = 0; f < stripCount; f++) {
		const faceOffset = f - (stripCount - 1) / 2;
		const normalAngle = faceOffset * faceAngleStep;

		const sinA = Math.sin(normalAngle);
		const cosA = Math.cos(normalAngle);

		// Rotate face normal: perpendicular component (uy, -ux) scaled by sinA, forward z by cosA
		let normal: { x: number; y: number; z: number };
		if (f === Math.floor(stripCount / 2) && stripCount % 2 === 1) {
			// Center face: add perturbation for organic variety
			normal = normalize3({ x: centerPerturbationX, y: centerPerturbationY, z: 1 });
		} else {
			normal = normalize3({ x: uy * sinA, y: -ux * sinA, z: cosA });
		}

		colors.push(faceColor(normal));
	}

	return colors;
}

/**
 * Compute tri-split trunk/branch face colors from 3 face normals.
 *
 * Left/right normals are derived from the segment direction's perpendicular
 * at 60° from forward (hex cross-section). Center normal is front-facing
 * with seeded random xy-perturbation. Each face's lightness offset is
 * computed via `dot(faceNormal, lightDirection)` mapped to [-10, +12].
 */
export function computeTriSplitColors(input: TriSplitColorInput): TriSplitColors {
	const {
		segmentDirectionX: dx,
		segmentDirectionY: dy,
		lightAngle,
		trunkHue,
		trunkSaturation,
		trunkLightness,
		centerPerturbationX,
		centerPerturbationY,
	} = input;

	const len = Math.sqrt(dx * dx + dy * dy);
	// Unit direction; default to pointing up if zero-length
	const ux = len > 0 ? dx / len : 0;
	const uy = len > 0 ? dy / len : -1;

	// Hexagonal cross-section face normals at 60° from forward.
	// Screen-left perpendicular of (ux, uy) is (uy, -ux).
	const sin60 = Math.sin(Math.PI / 3);
	const cos60 = Math.cos(Math.PI / 3);

	const leftNormal = normalize3({ x: uy * sin60, y: -ux * sin60, z: cos60 });
	const centerNormal = normalize3({ x: centerPerturbationX, y: centerPerturbationY, z: 1 });
	const rightNormal = normalize3({ x: -uy * sin60, y: ux * sin60, z: cos60 });

	const light = normalize3(lightDirection(lightAngle));

	function faceColor(normal: { x: number; y: number; z: number }): string {
		const d = dot3(normal, light);
		const lightnessOffset = -10 + ((d + 1) / 2) * 22;
		return hslToHex(trunkHue, trunkSaturation, trunkLightness + lightnessOffset);
	}

	return {
		leftColor: faceColor(leftNormal),
		centerColor: faceColor(centerNormal),
		rightColor: faceColor(rightNormal),
	};
}
