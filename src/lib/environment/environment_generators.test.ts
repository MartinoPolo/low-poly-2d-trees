import { describe, expect, it } from 'vitest';
import {
	generateRainDrops,
	generateSnowflakes,
	generateCloudShapes,
	generateFireflyPositions,
	generateWindParticles,
} from './environment_generators.js';

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;

describe('generateRainDrops', () => {
	it('is deterministic — same seed produces same output', () => {
		const a = generateRainDrops(50, 42, VIEW_WIDTH, VIEW_HEIGHT);
		const b = generateRainDrops(50, 42, VIEW_WIDTH, VIEW_HEIGHT);
		expect(a).toEqual(b);
	});

	it('count scales with intensity', () => {
		const low = generateRainDrops(20, 42, VIEW_WIDTH, VIEW_HEIGHT);
		const high = generateRainDrops(150, 42, VIEW_WIDTH, VIEW_HEIGHT);
		expect(high.length).toBeGreaterThan(low.length);
	});

	it('all values within valid ranges', () => {
		const drops = generateRainDrops(100, 42, VIEW_WIDTH, VIEW_HEIGHT);
		for (const drop of drops) {
			expect(drop.x).toBeGreaterThanOrEqual(0);
			expect(drop.x).toBeLessThanOrEqual(VIEW_WIDTH);
			expect(drop.y).toBeGreaterThanOrEqual(0);
			expect(drop.y).toBeLessThanOrEqual(VIEW_HEIGHT);
			expect(drop.length).toBeGreaterThan(0);
			expect(drop.delay).toBeGreaterThanOrEqual(0);
			expect(drop.speed).toBeGreaterThan(0);
		}
	});

	it('returns objects with correct shape', () => {
		const drops = generateRainDrops(50, 1, VIEW_WIDTH, VIEW_HEIGHT);
		expect(drops.length).toBeGreaterThan(0);
		const drop = drops[0];
		expect(drop).toHaveProperty('x');
		expect(drop).toHaveProperty('y');
		expect(drop).toHaveProperty('length');
		expect(drop).toHaveProperty('delay');
		expect(drop).toHaveProperty('speed');
	});
});

describe('generateSnowflakes', () => {
	it('is deterministic', () => {
		const a = generateSnowflakes(30, 42, VIEW_WIDTH, VIEW_HEIGHT);
		const b = generateSnowflakes(30, 42, VIEW_WIDTH, VIEW_HEIGHT);
		expect(a).toEqual(b);
	});

	it('returns requested count', () => {
		const flakes = generateSnowflakes(25, 42, VIEW_WIDTH, VIEW_HEIGHT);
		expect(flakes).toHaveLength(25);
	});

	it('all values within valid ranges', () => {
		const flakes = generateSnowflakes(50, 42, VIEW_WIDTH, VIEW_HEIGHT);
		for (const flake of flakes) {
			expect(flake.x).toBeGreaterThanOrEqual(0);
			expect(flake.x).toBeLessThanOrEqual(VIEW_WIDTH);
			expect(flake.y).toBeGreaterThanOrEqual(0);
			expect(flake.y).toBeLessThanOrEqual(VIEW_HEIGHT);
			expect(flake.size).toBeGreaterThanOrEqual(2);
			expect(flake.size).toBeLessThanOrEqual(6);
			expect(flake.delay).toBeGreaterThanOrEqual(0);
			expect(flake.drift).toBeDefined();
		}
	});
});

describe('generateCloudShapes', () => {
	it('is deterministic', () => {
		const a = generateCloudShapes(5, 42, VIEW_WIDTH);
		const b = generateCloudShapes(5, 42, VIEW_WIDTH);
		expect(a).toEqual(b);
	});

	it('returns requested count', () => {
		const clouds = generateCloudShapes(4, 42, VIEW_WIDTH);
		expect(clouds).toHaveLength(4);
	});

	it('clouds positioned in upper 30% of viewport', () => {
		const clouds = generateCloudShapes(10, 42, VIEW_WIDTH);
		for (const cloud of clouds) {
			// y should be in 0..30 range (percentage of viewport)
			expect(cloud.y).toBeGreaterThanOrEqual(0);
			expect(cloud.y).toBeLessThanOrEqual(30);
		}
	});

	it('each cloud has triangles array, x, y, width, opacity', () => {
		const clouds = generateCloudShapes(3, 42, VIEW_WIDTH);
		for (const cloud of clouds) {
			expect(Array.isArray(cloud.triangles)).toBe(true);
			expect(cloud.triangles.length).toBeGreaterThanOrEqual(3);
			expect(cloud.triangles.length).toBeLessThanOrEqual(5);
			expect(cloud.x).toBeGreaterThanOrEqual(0);
			expect(cloud.width).toBeGreaterThan(0);
			expect(cloud.opacity).toBeGreaterThan(0);
			expect(cloud.opacity).toBeLessThanOrEqual(1);
		}
	});
});

describe('generateFireflyPositions', () => {
	it('is deterministic', () => {
		const a = generateFireflyPositions(20, 42, VIEW_WIDTH, VIEW_HEIGHT);
		const b = generateFireflyPositions(20, 42, VIEW_WIDTH, VIEW_HEIGHT);
		expect(a).toEqual(b);
	});

	it('returns requested count', () => {
		const fireflies = generateFireflyPositions(15, 42, VIEW_WIDTH, VIEW_HEIGHT);
		expect(fireflies).toHaveLength(15);
	});

	it('all values within valid ranges', () => {
		const fireflies = generateFireflyPositions(30, 42, VIEW_WIDTH, VIEW_HEIGHT);
		for (const ff of fireflies) {
			expect(ff.x).toBeGreaterThanOrEqual(0);
			expect(ff.x).toBeLessThanOrEqual(VIEW_WIDTH);
			expect(ff.y).toBeGreaterThanOrEqual(0);
			expect(ff.y).toBeLessThanOrEqual(VIEW_HEIGHT);
			expect(ff.delay).toBeGreaterThanOrEqual(0);
			expect(ff.duration).toBeGreaterThan(0);
		}
	});
});

describe('generateWindParticles', () => {
	it('is deterministic', () => {
		const a = generateWindParticles(20, 42, VIEW_WIDTH, VIEW_HEIGHT);
		const b = generateWindParticles(20, 42, VIEW_WIDTH, VIEW_HEIGHT);
		expect(a).toEqual(b);
	});

	it('returns requested count', () => {
		const particles = generateWindParticles(12, 42, VIEW_WIDTH, VIEW_HEIGHT);
		expect(particles).toHaveLength(12);
	});

	it('all values within valid ranges', () => {
		const particles = generateWindParticles(30, 42, VIEW_WIDTH, VIEW_HEIGHT);
		for (const p of particles) {
			expect(p.x).toBeGreaterThanOrEqual(0);
			expect(p.x).toBeLessThanOrEqual(VIEW_WIDTH);
			expect(p.y).toBeGreaterThanOrEqual(0);
			expect(p.y).toBeLessThanOrEqual(VIEW_HEIGHT);
			expect(p.size).toBeGreaterThan(0);
			expect(p.rotation).toBeGreaterThanOrEqual(0);
			expect(p.rotation).toBeLessThanOrEqual(360);
			expect(p.delay).toBeGreaterThanOrEqual(0);
		}
	});
});
