import { createPrng, randomInRange } from '$lib/trees/prng.js';

interface RainDrop {
	readonly x: number;
	readonly y: number;
	readonly length: number;
	readonly delay: number;
	readonly speed: number;
}

interface Snowflake {
	readonly x: number;
	readonly y: number;
	readonly size: number;
	readonly delay: number;
	readonly drift: number;
	readonly speed: number;
}

interface CloudShape {
	readonly triangles: readonly string[];
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly opacity: number;
}

interface Firefly {
	readonly x: number;
	readonly y: number;
	readonly delay: number;
	readonly duration: number;
}

interface WindParticle {
	readonly x: number;
	readonly y: number;
	readonly size: number;
	readonly rotation: number;
	readonly delay: number;
}

export function generateRainDrops(
	intensity: number,
	seed: number,
	viewWidth: number,
	viewHeight: number,
): RainDrop[] {
	const rng = createPrng(seed);
	const count = Math.round(intensity * 1.5);
	const drops: RainDrop[] = [];

	for (let i = 0; i < count; i++) {
		drops.push({
			x: randomInRange(rng, 0, viewWidth),
			y: randomInRange(rng, 0, viewHeight),
			length: randomInRange(rng, 10, 30),
			delay: randomInRange(rng, 0, 2),
			speed: randomInRange(rng, 0.3, 1.0),
		});
	}

	return drops;
}

export function generateSnowflakes(
	count: number,
	seed: number,
	viewWidth: number,
	viewHeight: number,
): Snowflake[] {
	const rng = createPrng(seed);
	const flakes: Snowflake[] = [];

	for (let i = 0; i < count; i++) {
		flakes.push({
			x: randomInRange(rng, 0, viewWidth),
			y: randomInRange(rng, 0, viewHeight),
			size: randomInRange(rng, 2, 6),
			delay: randomInRange(rng, 0, 5),
			drift: randomInRange(rng, -20, 20),
			speed: randomInRange(rng, 4, 8),
		});
	}

	return flakes;
}

export function generateCloudShapes(count: number, seed: number, viewWidth: number): CloudShape[] {
	const rng = createPrng(seed);
	const clouds: CloudShape[] = [];

	for (let i = 0; i < count; i++) {
		const cloudWidth = randomInRange(rng, 80, 200);
		const cloudHeight = randomInRange(rng, 30, 60);
		const triangleCount = Math.round(randomInRange(rng, 3, 5));

		const trianglePoints: string[] = [];
		for (let t = 0; t < triangleCount; t++) {
			const cx = randomInRange(rng, 0, cloudWidth);
			const cy = randomInRange(rng, 0, cloudHeight);
			const size = randomInRange(rng, 20, 50);
			const x1 = cx - size / 2;
			const y1 = cy + size / 3;
			const x2 = cx + size / 2;
			const y2 = cy + size / 3;
			const x3 = cx;
			const y3 = cy - size / 2;
			trianglePoints.push(`${x1},${y1} ${x2},${y2} ${x3},${y3}`);
		}

		clouds.push({
			triangles: trianglePoints,
			x: randomInRange(rng, 0, viewWidth - cloudWidth),
			y: randomInRange(rng, 0, 30),
			width: cloudWidth,
			opacity: randomInRange(rng, 0.3, 0.7),
		});
	}

	return clouds;
}

export function generateFireflyPositions(
	count: number,
	seed: number,
	viewWidth: number,
	viewHeight: number,
): Firefly[] {
	const rng = createPrng(seed);
	const fireflies: Firefly[] = [];

	for (let i = 0; i < count; i++) {
		fireflies.push({
			x: randomInRange(rng, 0, viewWidth),
			y: randomInRange(rng, 0, viewHeight),
			delay: randomInRange(rng, 0, 5),
			duration: randomInRange(rng, 2, 6),
		});
	}

	return fireflies;
}

export function generateWindParticles(
	count: number,
	seed: number,
	viewWidth: number,
	viewHeight: number,
): WindParticle[] {
	const rng = createPrng(seed);
	const particles: WindParticle[] = [];

	for (let i = 0; i < count; i++) {
		particles.push({
			x: randomInRange(rng, 0, viewWidth),
			y: randomInRange(rng, 0, viewHeight),
			size: randomInRange(rng, 3, 10),
			rotation: randomInRange(rng, 0, 360),
			delay: randomInRange(rng, 0, 4),
		});
	}

	return particles;
}
