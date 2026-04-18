import { describe, expect, it } from 'vitest';
import { generateBezierControlPoints, buildBezierPathData } from './root_connection_generators.js';

describe('generateBezierControlPoints', () => {
	const from = { x: 100, y: 200 };
	const to = { x: 400, y: 200 };

	it('is deterministic — same seed produces same output', () => {
		const a = generateBezierControlPoints(from, to, 42);
		const b = generateBezierControlPoints(from, to, 42);
		expect(a).toEqual(b);
	});

	it('different seeds produce different output', () => {
		const a = generateBezierControlPoints(from, to, 42);
		const b = generateBezierControlPoints(from, to, 99);
		expect(a).not.toEqual(b);
	});

	it('control points are between from and to horizontally', () => {
		const { controlPoint1, controlPoint2 } = generateBezierControlPoints(from, to, 42);
		expect(controlPoint1.x).toBeGreaterThan(from.x - 30);
		expect(controlPoint1.x).toBeLessThan(to.x + 30);
		expect(controlPoint2.x).toBeGreaterThan(from.x - 30);
		expect(controlPoint2.x).toBeLessThan(to.x + 30);
	});

	it('control points sag below the line between from/to', () => {
		const { controlPoint1, controlPoint2 } = generateBezierControlPoints(from, to, 42);
		expect(controlPoint1.y).toBeGreaterThan(from.y);
		expect(controlPoint2.y).toBeGreaterThan(to.y);
	});
});

describe('buildBezierPathData', () => {
	it('returns valid SVG cubic bezier path', () => {
		const from = { x: 100, y: 200 };
		const to = { x: 400, y: 200 };
		const controlPoints = generateBezierControlPoints(from, to, 42);
		const path = buildBezierPathData(from, to, controlPoints);
		expect(path).toMatch(/^M[\d.,-]+\sC[\d.,\s-]+$/);
	});

	it('path starts at from and ends at to', () => {
		const from = { x: 50, y: 100 };
		const to = { x: 300, y: 150 };
		const controlPoints = generateBezierControlPoints(from, to, 42);
		const path = buildBezierPathData(from, to, controlPoints);
		expect(path).toContain(`M${from.x},${from.y}`);
		expect(path).toContain(`${to.x},${to.y}`);
	});
});
