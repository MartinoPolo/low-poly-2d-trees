import type { Tier, Point2D } from '../types.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types.js';
import { randomInRange } from '../prng.js';
import { lerp } from '../math.js';
import { sampleTrunkCenterX } from './trunk.js';
import { TREE_SCALE, treeY } from './tree_scale.js';

const W = VIEWBOX_WIDTH;

// ---------------------------------------------------------------------------
// Tier (pine) — triangular shapes
// ---------------------------------------------------------------------------

export function generateTiers(
	rng: () => number,
	blobCount: number,
	trunkJunctions: readonly Point2D[],
	blobCloseness: number,
	blobSizeVariance: number,
	canopySize: number,
	verticalShift: number,
): Tier[] {
	const tiers: Tier[] = [];
	const count = Math.max(1, blobCount);
	const centerX = W / 2;
	const trunkTopY = trunkJunctions[trunkJunctions.length - 1]!.y;
	const tipY = treeY(0.05) + verticalShift * TREE_SCALE;
	const tierTrunkOverlap = 0.1;
	const overlapAmount = (trunkTopY - tipY) * tierTrunkOverlap;
	const baseY = trunkTopY + overlapAmount;
	const totalHeight = baseY - tipY;

	const canopyScale = canopySize / 100;
	const overlapFraction = blobCloseness / 100;

	for (let i = 0; i < count; i++) {
		const t0 = i / count;
		const t1 = (i + 1) / count;

		const tierTipY = tipY + t0 * totalHeight;
		const tierBaseY = tipY + t1 * totalHeight;

		// D8: blobSizeVariance controls ratio of top to bottom tier width
		const widthT = count > 1 ? i / (count - 1) : 0;
		const topScale = 1 / blobSizeVariance;
		const widthScale = lerp(topScale, 1.0, widthT);

		const baseHalfWidth = (W * 0.084 + t1 * W * 0.308) * TREE_SCALE * widthScale * canopyScale;

		// D10: tiers follow trunk path (sampled from junctions). For y values
		// above the topmost junction, sampling clamps to topJunction.x so tiers
		// stop leaning once they rise above the trunk.
		const leanOffset = sampleTrunkCenterX(trunkJunctions, tierTipY) - centerX;
		const baseLeanOffset = sampleTrunkCenterX(trunkJunctions, tierBaseY) - centerX;

		const jitterX = randomInRange(rng, -2, 2);

		// D7: blobCloseness controls overlap
		const overlapOffset = i > 0 ? (totalHeight / count) * overlapFraction : 0;

		tiers.push({
			tipX: centerX + jitterX + leanOffset,
			tipY: tierTipY - overlapOffset,
			baseLeftX: centerX - baseHalfWidth + randomInRange(rng, -3, 3) + baseLeanOffset,
			baseLeftY: tierBaseY,
			baseRightX: centerX + baseHalfWidth + randomInRange(rng, -3, 3) + baseLeanOffset,
			baseRightY: tierBaseY,
		});
	}

	return tiers;
}

export function isPointInTier(x: number, y: number, tier: Tier): boolean {
	const x0 = tier.tipX;
	const y0 = tier.tipY;
	const x1 = tier.baseLeftX;
	const y1 = tier.baseLeftY;
	const x2 = tier.baseRightX;
	const y2 = tier.baseRightY;

	const denom = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
	if (denom === 0) {
		return false;
	}

	const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / denom;
	const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / denom;
	const c = 1 - a - b;

	return a >= 0 && b >= 0 && c >= 0;
}

export function getTiersBounds(tiers: readonly Tier[]): {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
} {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for (const t of tiers) {
		minX = Math.min(minX, t.tipX, t.baseLeftX, t.baseRightX);
		minY = Math.min(minY, t.tipY, t.baseLeftY, t.baseRightY);
		maxX = Math.max(maxX, t.tipX, t.baseLeftX, t.baseRightX);
		maxY = Math.max(maxY, t.tipY, t.baseLeftY, t.baseRightY);
	}

	return {
		minX: Math.max(0, minX),
		minY: Math.max(0, minY),
		maxX: Math.min(VIEWBOX_WIDTH, maxX),
		maxY: Math.min(VIEWBOX_HEIGHT, maxY),
	};
}
