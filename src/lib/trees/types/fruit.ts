import type { Point2D } from './core.js';

export const FRUIT_TYPES = {
	none: 'none',
	apple: 'apple',
	cherry: 'cherry',
	flower: 'flower',
} as const;

export type FruitType = (typeof FRUIT_TYPES)[keyof typeof FRUIT_TYPES];

export const FRUIT_TYPE_OPTIONS: readonly { value: FruitType; label: string }[] = [
	{ value: FRUIT_TYPES.none, label: 'None' },
	{ value: FRUIT_TYPES.apple, label: 'Apple' },
	{ value: FRUIT_TYPES.cherry, label: 'Cherry' },
	{ value: FRUIT_TYPES.flower, label: 'Flower' },
] as const;

interface FruitSpec {
	readonly color: string;
	readonly generateShape: (
		cx: number,
		cy: number,
		size: number,
		rng: () => number,
	) => [Point2D, Point2D, Point2D][];
}

function generateAppleShape(
	cx: number,
	cy: number,
	size: number,
	rng: () => number,
): [Point2D, Point2D, Point2D][] {
	const triangleCount = 5 + (rng() < 0.5 ? 1 : 0);
	const triangles: [Point2D, Point2D, Point2D][] = [];
	const angleStep = (Math.PI * 2) / triangleCount;

	for (let i = 0; i < triangleCount; i++) {
		const angle1 = i * angleStep;
		const angle2 = (i + 1) * angleStep;
		const r1 = size * (0.8 + rng() * 0.4);
		const r2 = size * (0.8 + rng() * 0.4);
		triangles.push([
			{ x: cx, y: cy },
			{ x: cx + Math.cos(angle1) * r1, y: cy + Math.sin(angle1) * r1 },
			{ x: cx + Math.cos(angle2) * r2, y: cy + Math.sin(angle2) * r2 },
		]);
	}

	return triangles;
}

function generateCherryShape(
	cx: number,
	cy: number,
	size: number,
	rng: () => number,
): [Point2D, Point2D, Point2D][] {
	const triangles: [Point2D, Point2D, Point2D][] = [];
	const offset = size * 1.2;

	for (const side of [-1, 1]) {
		const ccx = cx + side * offset;
		const ccy = cy + size * 0.3;
		const cherryTriCount = 3 + (rng() < 0.5 ? 1 : 0);
		const angleStep = (Math.PI * 2) / cherryTriCount;

		for (let i = 0; i < cherryTriCount; i++) {
			const angle1 = i * angleStep;
			const angle2 = (i + 1) * angleStep;
			const r1 = size * (0.6 + rng() * 0.3);
			const r2 = size * (0.6 + rng() * 0.3);
			triangles.push([
				{ x: ccx, y: ccy },
				{ x: ccx + Math.cos(angle1) * r1, y: ccy + Math.sin(angle1) * r1 },
				{ x: ccx + Math.cos(angle2) * r2, y: ccy + Math.sin(angle2) * r2 },
			]);
		}

		const stemWidth = size * 0.15;
		triangles.push([
			{ x: ccx, y: ccy - size * 0.5 },
			{ x: cx + stemWidth, y: cy - size * 0.8 },
			{ x: cx - stemWidth, y: cy - size * 0.8 },
		]);
	}

	return triangles;
}

function generateFlowerShape(
	cx: number,
	cy: number,
	size: number,
	rng: () => number,
): [Point2D, Point2D, Point2D][] {
	const triangles: [Point2D, Point2D, Point2D][] = [];
	const jitter = () => rng() * size * 0.2 - size * 0.1;
	const petalLength = size * 0.9;
	const petalWidth = size * 0.4;

	for (let i = 0; i < 4; i++) {
		const angle = (i * Math.PI) / 2;
		const tipX = cx + Math.cos(angle) * petalLength + jitter();
		const tipY = cy + Math.sin(angle) * petalLength + jitter();
		const perpAngle = angle + Math.PI / 2;
		const baseX1 = cx + Math.cos(perpAngle) * petalWidth;
		const baseY1 = cy + Math.sin(perpAngle) * petalWidth;
		const baseX2 = cx - Math.cos(perpAngle) * petalWidth;
		const baseY2 = cy - Math.sin(perpAngle) * petalWidth;

		triangles.push([
			{ x: tipX, y: tipY },
			{ x: baseX1, y: baseY1 },
			{ x: baseX2, y: baseY2 },
		]);
	}

	return triangles;
}

export const FRUIT_SPECS: Record<Exclude<FruitType, 'none'>, FruitSpec> = {
	[FRUIT_TYPES.apple]: {
		color: '#e53e3e',
		generateShape: generateAppleShape,
	},
	[FRUIT_TYPES.cherry]: {
		color: '#9b2c2c',
		generateShape: generateCherryShape,
	},
	[FRUIT_TYPES.flower]: {
		color: '#ed64a6',
		generateShape: generateFlowerShape,
	},
};
