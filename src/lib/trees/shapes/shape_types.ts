import type { BoundaryKind } from '../boundaries.js';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/** Per-shape style knobs that drive branch-driven canopy rendering (REQ-EV2-SS-01). */
export interface ShapeStyleParameters {
	/** Blob rx/ry ratio: 1.0 = round, 3.0+ = flat (REQ-EV2-SS-01). */
	readonly blobRxRyRatio: number;
	/** Vertical offset from tip position: positive = droop downward (SVG Y increases downward) (REQ-EV2-SS-01). */
	readonly blobVerticalOffset: number;
	/** Boundary shape: 'circle' or 'teardrop' (REQ-EV2-SS-01). */
	readonly blobBoundary: 'circle' | 'teardrop';
	/** How aggressively nearby tips merge: 0 = spread, 1 = tight (REQ-EV2-SS-01). */
	readonly blobClusterBehavior: number;
	/** Trunk tip weight in clustering: 0 = ignore, 1 = strong anchor (REQ-EV2-BC-02). */
	readonly trunkTipWeight: number;
}

export interface Blob {
	cx: number;
	cy: number;
	rx: number;
	ry: number;
	/**
	 * Per-blob boundary shape discriminator. Circle (axis-aligned ellipse) is
	 * the default for oak/birch/willow/maple/etc. Teardrop is used for the top
	 * blob of fir-style cone canopies. See boundaries.ts for the registry.
	 */
	boundary: BoundaryKind;
	/**
	 * Rotation applied to the boundary shape around (cx, cy), in degrees.
	 * Ignored for axis-aligned circle boundaries; required for teardrop blobs
	 * that need to point in a non-default direction.
	 */
	rotationDeg?: number;
}

export interface BranchSegment {
	readonly x1: number;
	readonly y1: number;
	readonly x2: number;
	readonly y2: number;
	readonly widthStart: number;
	readonly widthEnd: number;
}

/** Envelope config for canopy bounding region (REQ-EV2-CE-01). */
interface ShapeEnvelopeDefaults {
	readonly canopyCenterY: number;
	readonly baseRadiusX: number;
	readonly baseRadiusY: number;
}

export interface ShapeDefinition {
	readonly trunkBaseWidth: number;
	readonly trunkTopWidth: number;
	readonly trunkBottom: number;
	readonly defaultTrunkTop: number;
	generateBlobs(rng: () => number, blobCount: number): Blob[];
	/** Style parameters for branch-driven canopy (REQ-EV2-SS-01). Undefined for branchless shapes. */
	readonly styleParameters?: ShapeStyleParameters;
	/** Canopy envelope config (REQ-EV2-CE-01). Undefined for branchless/tiered shapes. */
	readonly envelopeDefaults?: ShapeEnvelopeDefaults;
}
