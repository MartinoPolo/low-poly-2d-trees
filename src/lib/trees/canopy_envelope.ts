import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from './types/config.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum distance from canopy envelope to viewport edge (REQ-EV2-CE-03). */
const VIEWPORT_MARGIN_PX = 10;

/**
 * Maximum normalised distance (1.0 = on envelope edge) beyond which a tip gets
 * no blob — returning scale factor 0 (REQ-EV2-CE-04, bare branch).
 */
const ENVELOPE_CUTOFF_DISTANCE = 1.3;

/** Scale factor at the envelope edge — blobs shrink from 1.0 at center to this at edge. */
export const ENVELOPE_EDGE_SCALE = 0.55;

/** Range for the inside-envelope linear ramp: 1.0 (center) → ENVELOPE_EDGE_SCALE (edge). */
const ENVELOPE_INSIDE_LERP_RANGE = 1.0 - ENVELOPE_EDGE_SCALE;

/** Range for the outside-envelope fade: ENVELOPE_EDGE_SCALE → 0 over (cutoff - 1.0). */
const ENVELOPE_OUTSIDE_FADE_RANGE = ENVELOPE_CUTOFF_DISTANCE - 1.0;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanopyEnvelope {
	readonly centerX: number;
	readonly centerY: number;
	readonly radiusX: number;
	readonly radiusY: number;
	readonly minX: number;
	readonly minY: number;
	readonly maxX: number;
	readonly maxY: number;
}

interface ShapeEnvelopeConfig {
	/** Center X of the shape's canopy region. */
	readonly canopyCenterX: number;
	/** Center Y of the shape's canopy region. */
	readonly canopyCenterY: number;
	/** Base horizontal radius of canopy region. */
	readonly baseRadiusX: number;
	/** Base vertical radius of canopy region. */
	readonly baseRadiusY: number;
}

// ---------------------------------------------------------------------------
// Envelope Computation (REQ-EV2-CE-01, CE-02, CE-03)
// ---------------------------------------------------------------------------

/**
 * Compute a canopy envelope for a shape, scaled by canopySize and clamped to viewport.
 *
 * - canopySize=100 uses base radii as-is.
 * - canopySize<100 shrinks envelope (sapling stage).
 * - canopySize>100 grows envelope (lush canopy).
 * - Envelope never extends within 10px of viewport edge.
 */
export function computeCanopyEnvelope(
	shapeConfig: ShapeEnvelopeConfig,
	canopySize: number,
	viewportWidth: number = VIEWBOX_WIDTH,
	viewportHeight: number = VIEWBOX_HEIGHT,
): CanopyEnvelope {
	const scale = canopySize / 100;
	const scaledRadiusX = shapeConfig.baseRadiusX * scale;
	const scaledRadiusY = shapeConfig.baseRadiusY * scale;

	// Viewport clamp: envelope cannot extend within VIEWPORT_MARGIN_PX of edges
	const maxAllowedRadiusX = Math.max(
		0,
		Math.min(
			shapeConfig.canopyCenterX - VIEWPORT_MARGIN_PX,
			viewportWidth - VIEWPORT_MARGIN_PX - shapeConfig.canopyCenterX,
		),
	);
	const maxAllowedRadiusY = Math.max(
		0,
		Math.min(
			shapeConfig.canopyCenterY - VIEWPORT_MARGIN_PX,
			viewportHeight - VIEWPORT_MARGIN_PX - shapeConfig.canopyCenterY,
		),
	);

	const clampedRadiusX = Math.min(scaledRadiusX, maxAllowedRadiusX);
	const clampedRadiusY = Math.min(scaledRadiusY, maxAllowedRadiusY);

	return {
		centerX: shapeConfig.canopyCenterX,
		centerY: shapeConfig.canopyCenterY,
		radiusX: clampedRadiusX,
		radiusY: clampedRadiusY,
		minX: shapeConfig.canopyCenterX - clampedRadiusX,
		minY: shapeConfig.canopyCenterY - clampedRadiusY,
		maxX: shapeConfig.canopyCenterX + clampedRadiusX,
		maxY: shapeConfig.canopyCenterY + clampedRadiusY,
	};
}

// ---------------------------------------------------------------------------
// Envelope Queries
// ---------------------------------------------------------------------------

/**
 * Area of the envelope's elliptical region in square pixels.
 * Used to distribute per-blob radius budget across the clustered canopy pipeline.
 */
export function getEnvelopeArea(envelope: CanopyEnvelope): number {
	if (envelope.radiusX <= 0 || envelope.radiusY <= 0) {
		return 0;
	}
	return Math.PI * envelope.radiusX * envelope.radiusY;
}

/**
 * Check if a point is inside the canopy envelope (elliptical region).
 */
export function isInsideEnvelope(x: number, y: number, envelope: CanopyEnvelope): boolean {
	if (envelope.radiusX <= 0 || envelope.radiusY <= 0) {
		return false;
	}
	const dx = (x - envelope.centerX) / envelope.radiusX;
	const dy = (y - envelope.centerY) / envelope.radiusY;
	return dx * dx + dy * dy <= 1;
}

/**
 * Clamp a point to the envelope edge if outside.
 * Returns the original point if inside.
 */
export function clampToEnvelope(
	x: number,
	y: number,
	envelope: CanopyEnvelope,
): { x: number; y: number } {
	if (isInsideEnvelope(x, y, envelope)) {
		return { x, y };
	}

	if (envelope.radiusX <= 0 || envelope.radiusY <= 0) {
		return { x: envelope.centerX, y: envelope.centerY };
	}

	// Project point onto ellipse boundary
	const dx = x - envelope.centerX;
	const dy = y - envelope.centerY;
	const angle = Math.atan2(dy / envelope.radiusY, dx / envelope.radiusX);

	return {
		x: envelope.centerX + Math.cos(angle) * envelope.radiusX,
		y: envelope.centerY + Math.sin(angle) * envelope.radiusY,
	};
}

/**
 * Compute a scale factor based on distance from envelope center (REQ-EV2-CE-04).
 *
 * Tips near center get factor close to 1 (larger blobs).
 * Tips near edge get factor closer to 0.3 (smaller blobs).
 * Tips outside envelope return 0 (no blob).
 */
export function computeEnvelopeScaleFactor(x: number, y: number, envelope: CanopyEnvelope): number {
	if (envelope.radiusX <= 0 || envelope.radiusY <= 0) {
		return 0;
	}

	const dx = (x - envelope.centerX) / envelope.radiusX;
	const dy = (y - envelope.centerY) / envelope.radiusY;
	const normalizedDistance = Math.sqrt(dx * dx + dy * dy);

	if (normalizedDistance > ENVELOPE_CUTOFF_DISTANCE) {
		// Very far outside — no blob
		return 0;
	}

	if (normalizedDistance > 1.0) {
		// Outside but close — small blob pulled to edge, fading from EDGE_SCALE → 0
		return ENVELOPE_EDGE_SCALE * (1 - (normalizedDistance - 1.0) / ENVELOPE_OUTSIDE_FADE_RANGE);
	}

	// Inside: linear interpolation from 1.0 (center) to ENVELOPE_EDGE_SCALE (edge)
	return 1.0 - normalizedDistance * ENVELOPE_INSIDE_LERP_RANGE;
}
