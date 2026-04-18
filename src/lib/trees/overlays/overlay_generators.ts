import { createPrng, randomInRange } from '$lib/trees/prng.js';
import type {
	StormCloudGeometry,
	StormCloudTriangle,
	RainLine,
	SpeechBubbleGeometry,
} from './overlay_types.js';

const CLOUD_DARK = '#4a4a5a';
const CLOUD_DARKER = '#3a3a4a';

export function generateStormCloudTriangles(seed: number, cloudWidth: number): StormCloudGeometry {
	const rng = createPrng(seed);
	const triangleCount = Math.round(randomInRange(rng, 5, 8));
	const cloudHeight = cloudWidth * 0.4;
	const triangles: StormCloudTriangle[] = [];

	for (let i = 0; i < triangleCount; i++) {
		const cx = randomInRange(rng, cloudWidth * 0.1, cloudWidth * 0.9);
		const cy = randomInRange(rng, cloudHeight * 0.2, cloudHeight * 0.8);
		const size = randomInRange(rng, cloudWidth * 0.2, cloudWidth * 0.4);
		const angle = randomInRange(rng, 0, Math.PI * 2);

		const points = [];
		for (let v = 0; v < 3; v++) {
			const a = angle + (v * Math.PI * 2) / 3;
			const r = size / 2 + randomInRange(rng, -size * 0.1, size * 0.1);
			points.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
		}

		const color = rng() > 0.5 ? CLOUD_DARK : CLOUD_DARKER;
		triangles.push({ points: points.join(' '), color });
	}

	return { triangles, width: cloudWidth, height: cloudHeight };
}

export function generateRainLines(seed: number, count: number, cloudWidth: number): RainLine[] {
	const rng = createPrng(seed);
	const lines: RainLine[] = [];

	for (let i = 0; i < count; i++) {
		lines.push({
			x: randomInRange(rng, 0, cloudWidth),
			y: randomInRange(rng, 0, 20),
			length: randomInRange(rng, 4, 12),
			delay: randomInRange(rng, 0, 1.5),
			speed: randomInRange(rng, 0.3, 0.8),
		});
	}

	return lines;
}

export function generateSpeechBubblePath(width: number, height: number): SpeechBubbleGeometry {
	const rng = createPrng(42);
	const vertexCount = Math.round(randomInRange(rng, 6, 8));
	const cx = width / 2;
	const cy = height / 2;
	const rx = width / 2;
	const ry = height / 2;

	const points: string[] = [];
	for (let i = 0; i < vertexCount; i++) {
		const angle = (i / vertexCount) * Math.PI * 2 - Math.PI / 2;
		const jitter = randomInRange(rng, 0.9, 1.05);
		const px = cx + Math.cos(angle) * rx * jitter;
		const py = cy + Math.sin(angle) * ry * jitter;
		points.push(`${px},${py}`);
	}

	const path = `M${points.join(' L')} Z`;

	const pointerTipX = cx;
	const pointerTipY = height + 10;
	const pointerBaseLeft = `${cx - 6},${height * 0.85}`;
	const pointerBaseRight = `${cx + 6},${height * 0.85}`;
	const pointerPath = `M${pointerBaseLeft} L${pointerTipX},${pointerTipY} L${pointerBaseRight} Z`;

	return { path, width, height, pointerPath };
}
