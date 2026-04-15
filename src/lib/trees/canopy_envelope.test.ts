import { describe, it, expect } from 'vitest';
import {
	computeCanopyEnvelope,
	isInsideEnvelope,
	clampToEnvelope,
	computeEnvelopeScaleFactor,
} from './canopy_envelope.js';

describe('computeCanopyEnvelope', () => {
	const baseConfig = {
		canopyCenterX: 150,
		canopyCenterY: 90,
		baseRadiusX: 80,
		baseRadiusY: 60,
	};

	it('canopySize=100 uses base radii', () => {
		const env = computeCanopyEnvelope(baseConfig, 100, 300, 300);
		expect(env.radiusX).toBe(80);
		expect(env.radiusY).toBe(60);
		expect(env.centerX).toBe(150);
		expect(env.centerY).toBe(90);
	});

	it('canopySize=50 shrinks envelope by half', () => {
		const env = computeCanopyEnvelope(baseConfig, 50, 300, 300);
		expect(env.radiusX).toBe(40);
		expect(env.radiusY).toBe(30);
	});

	it('canopySize=200 grows envelope (clamped by viewport)', () => {
		const env = computeCanopyEnvelope(baseConfig, 200, 300, 300);
		// 150 - 10 = 140 max radiusX, 300 - 10 - 150 = 140 max radiusX → min = 140
		// Scaled radiusX = 160, clamped to 140
		expect(env.radiusX).toBe(140);
	});

	it('viewport clamp: envelope stays 10px from edges (REQ-EV2-CE-03)', () => {
		const env = computeCanopyEnvelope(baseConfig, 200, 300, 300);
		expect(env.minX).toBeGreaterThanOrEqual(10);
		expect(env.minY).toBeGreaterThanOrEqual(10);
		expect(env.maxX).toBeLessThanOrEqual(290);
		expect(env.maxY).toBeLessThanOrEqual(290);
	});

	it('off-center canopy still respects viewport margins', () => {
		const offCenter = { ...baseConfig, canopyCenterX: 30 };
		const env = computeCanopyEnvelope(offCenter, 100, 300, 300);
		// maxAllowedRadiusX = min(30-10, 300-10-30) = min(20, 260) = 20
		expect(env.radiusX).toBe(20);
		expect(env.minX).toBeGreaterThanOrEqual(10);
	});
});

describe('isInsideEnvelope', () => {
	const envelope = computeCanopyEnvelope(
		{ canopyCenterX: 150, canopyCenterY: 90, baseRadiusX: 80, baseRadiusY: 60 },
		100,
		300,
		300,
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
		300,
		300,
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
		300,
		300,
	);

	it('center point has scale factor ~1.0', () => {
		expect(computeEnvelopeScaleFactor(150, 90, envelope)).toBeCloseTo(1.0);
	});

	it('edge point has reduced scale factor', () => {
		const factor = computeEnvelopeScaleFactor(230, 90, envelope);
		expect(factor).toBeGreaterThan(0.2);
		expect(factor).toBeLessThan(0.5);
	});

	it('point very far outside has 0 scale factor', () => {
		expect(computeEnvelopeScaleFactor(400, 90, envelope)).toBe(0);
	});

	it('point slightly outside has small positive scale factor', () => {
		// Just outside the envelope
		const factor = computeEnvelopeScaleFactor(240, 90, envelope);
		expect(factor).toBeGreaterThan(0);
		expect(factor).toBeLessThan(0.3);
	});
});
