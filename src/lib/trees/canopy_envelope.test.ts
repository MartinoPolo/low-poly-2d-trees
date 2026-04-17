import { describe, it, expect } from 'vitest';
import {
	computeCanopyEnvelope,
	isInsideEnvelope,
	clampToEnvelope,
	computeEnvelopeScaleFactor,
	ENVELOPE_EDGE_SCALE,
} from './canopy_envelope.js';

describe('computeCanopyEnvelope', () => {
	const baseConfig = {
		canopyCenterX: 150,
		canopyCenterY: 90,
		baseRadiusX: 80,
		baseRadiusY: 60,
	};

	it('canopySize=100 uses base radii', () => {
		const env = computeCanopyEnvelope(baseConfig, 100);
		expect(env.radiusX).toBe(80);
		expect(env.radiusY).toBe(60);
		expect(env.centerX).toBe(150);
		expect(env.centerY).toBe(90);
	});

	it('canopySize=50 shrinks envelope by half', () => {
		const env = computeCanopyEnvelope(baseConfig, 50);
		expect(env.radiusX).toBe(40);
		expect(env.radiusY).toBe(30);
	});

	it('canopySize=200 grows envelope freely (no viewport clamp)', () => {
		const env = computeCanopyEnvelope(baseConfig, 200);
		expect(env.radiusX).toBe(160);
		expect(env.radiusY).toBe(120);
	});

	it('envelope may extend beyond viewport (SVG clipping handles overflow)', () => {
		const env = computeCanopyEnvelope(baseConfig, 200);
		expect(env.minX).toBeLessThan(0);
		expect(env.maxX).toBeGreaterThan(300);
	});

	it('off-center canopy grows freely without viewport margins', () => {
		const offCenter = { ...baseConfig, canopyCenterX: 30 };
		const env = computeCanopyEnvelope(offCenter, 100);
		expect(env.radiusX).toBe(80);
	});
});

describe('isInsideEnvelope', () => {
	const envelope = computeCanopyEnvelope(
		{ canopyCenterX: 150, canopyCenterY: 90, baseRadiusX: 80, baseRadiusY: 60 },
		100,
	);

	it('center point is inside', () => {
		expect(isInsideEnvelope(150, 90, envelope)).toBe(true);
	});

	it('point on edge is inside (boundary inclusive)', () => {
		expect(isInsideEnvelope(230, 90, envelope)).toBe(true);
	});

	it('point outside is not inside', () => {
		expect(isInsideEnvelope(250, 90, envelope)).toBe(false);
	});
});

describe('clampToEnvelope', () => {
	const envelope = computeCanopyEnvelope(
		{ canopyCenterX: 150, canopyCenterY: 90, baseRadiusX: 80, baseRadiusY: 60 },
		100,
	);

	it('inside point returned as-is', () => {
		const result = clampToEnvelope(160, 95, envelope);
		expect(result.x).toBe(160);
		expect(result.y).toBe(95);
	});

	it('outside point projected to envelope edge', () => {
		const result = clampToEnvelope(300, 90, envelope);
		// Should be on the right edge: centerX + radiusX = 230
		expect(result.x).toBeCloseTo(230, 0);
		expect(result.y).toBeCloseTo(90, 0);
	});
});

describe('computeEnvelopeScaleFactor', () => {
	const envelope = computeCanopyEnvelope(
		{ canopyCenterX: 150, canopyCenterY: 90, baseRadiusX: 80, baseRadiusY: 60 },
		100,
	);

	it('center point has scale factor ~1.0', () => {
		expect(computeEnvelopeScaleFactor(150, 90, envelope)).toBeCloseTo(1.0);
	});

	it('edge point has reduced scale factor', () => {
		const factor = computeEnvelopeScaleFactor(230, 90, envelope);
		expect(factor).toBeGreaterThan(0.4);
		expect(factor).toBeLessThan(0.7);
	});

	it('point very far outside has 0 scale factor', () => {
		expect(computeEnvelopeScaleFactor(400, 90, envelope)).toBe(0);
	});

	it('point slightly outside has small positive scale factor', () => {
		// Just outside the envelope
		const factor = computeEnvelopeScaleFactor(240, 90, envelope);
		expect(factor).toBeGreaterThan(0);
		expect(factor).toBeLessThan(ENVELOPE_EDGE_SCALE);
	});

	it('point exactly on envelope edge returns ENVELOPE_EDGE_SCALE', () => {
		// Edge: centerX + radiusX = 150 + 80 = 230 → normalizedDistance = 1.0
		expect(computeEnvelopeScaleFactor(230, 90, envelope)).toBeCloseTo(ENVELOPE_EDGE_SCALE);
	});

	it('point at the cutoff distance (1.3× radiusX) returns 0', () => {
		// 150 + 80 * 1.3 = 254 → normalizedDistance just above 1.3 → 0
		expect(computeEnvelopeScaleFactor(254.01, 90, envelope)).toBe(0);
	});
});
