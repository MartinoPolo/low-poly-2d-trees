import { BOUNDARY_KINDS, type BoundaryKind } from '../boundaries.js';

// ---------------------------------------------------------------------------
// Issue #10: custom tree mode — per-blob editor types
// ---------------------------------------------------------------------------

/**
 * Boundary shapes available to a `custom`-tree blob. Currently identical to
 * `BOUNDARY_KINDS` — derived directly to eliminate duplication. If custom
 * should ever expose only a subset, use `Extract<BoundaryKind, ...>` instead.
 */
export const CUSTOM_BLOB_BOUNDARY_KINDS = BOUNDARY_KINDS;

export type CustomBlobBoundaryKind = BoundaryKind;

export const CUSTOM_BLOB_BOUNDARY_OPTIONS: readonly {
	value: CustomBlobBoundaryKind;
	label: string;
}[] = [
	{ value: CUSTOM_BLOB_BOUNDARY_KINDS.circle, label: 'Circle' },
	{ value: CUSTOM_BLOB_BOUNDARY_KINDS.egg, label: 'Egg' },
	{ value: CUSTOM_BLOB_BOUNDARY_KINDS.teardrop, label: 'Teardrop' },
	{ value: CUSTOM_BLOB_BOUNDARY_KINDS.isoscelesTriangle, label: 'Isosceles Triangle' },
	{ value: CUSTOM_BLOB_BOUNDARY_KINDS.equilateralTriangle, label: 'Equilateral Triangle' },
] as const;

/**
 * Per-blob override for a `custom`-shape tree. `position.x` and `position.y`
 * are normalized to [-1, +1] relative to the canopy spread radius so the
 * placement is resolution-independent.
 */
export interface CustomBlob {
	readonly boundaryKind: CustomBlobBoundaryKind;
	/** Rotation applied around the blob centroid, in degrees. */
	readonly rotationDeg: number;
	/** Uniform scale on rx and ry. 1.0 is the baseline size. */
	readonly sizeScale: number;
	/** Position offset normalized to the canopy spread radius. */
	readonly position: { readonly x: number; readonly y: number };
}

export const CUSTOM_BLOB_ROTATION_STEP = 5;
export const CUSTOM_BLOB_SIZE_MIN = 0.5;
export const CUSTOM_BLOB_SIZE_MAX = 2.0;
export const CUSTOM_BLOB_SIZE_STEP = 0.05;
export const CUSTOM_BLOB_POSITION_MIN = -1;
export const CUSTOM_BLOB_POSITION_MAX = 1;
export const CUSTOM_BLOB_POSITION_STEP = 0.05;

/** Default values used when seeding a brand-new custom blob entry. */
export const CUSTOM_BLOB_DEFAULT = {
	boundaryKind: CUSTOM_BLOB_BOUNDARY_KINDS.circle,
	rotationDeg: 0,
	sizeScale: 1.0,
	position: { x: 0, y: 0 },
} as const satisfies CustomBlob;
