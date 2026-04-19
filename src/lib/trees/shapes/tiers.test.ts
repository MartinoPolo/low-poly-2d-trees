import { describe, it, expect } from 'vitest';
import { generateTiers } from './tiers.js';
import { createPrng } from '../prng.js';
import { VIEWBOX_HEIGHT, VIEWBOX_WIDTH } from '../types.js';

const H = VIEWBOX_HEIGHT; // 300
const W = VIEWBOX_WIDTH; // 300

describe('generateTiers — tier base overlaps trunk top', () => {
	// Pine trunk top at H*0.8 = 240, trunk bottom at H*0.95 = 285
	const pineTrunkTopY = H * 0.8; // 240
	const pineTrunkBottomY = H * 0.95; // 285
	const pineJunctions = [
		{ x: W / 2, y: pineTrunkBottomY },
		{ x: W / 2, y: (pineTrunkBottomY + pineTrunkTopY) / 2 },
		{ x: W / 2, y: pineTrunkTopY },
	];

	// Fir trunk top at H*0.82 = 246, trunk bottom at H*0.95 = 285
	const firTrunkTopY = H * 0.82; // 246
	const firTrunkBottomY = H * 0.95; // 285
	const firJunctions = [
		{ x: W / 2, y: firTrunkBottomY },
		{ x: W / 2, y: (firTrunkBottomY + firTrunkTopY) / 2 },
		{ x: W / 2, y: firTrunkTopY },
	];

	it('pine: bottom tier baseY overlaps trunk top (baseY >= trunkTopY)', () => {
		const rng = createPrng(42);
		const tiers = generateTiers(rng, 3, pineJunctions, 50, 1, 100, 0);
		const bottomTier = tiers[tiers.length - 1]!;
		// The bottom tier's base should be at or below the trunk top Y
		expect(bottomTier.baseLeftY).toBeGreaterThanOrEqual(pineTrunkTopY);
		expect(bottomTier.baseRightY).toBeGreaterThanOrEqual(pineTrunkTopY);
	});

	it('fir: bottom tier baseY overlaps trunk top (baseY >= trunkTopY)', () => {
		const rng = createPrng(42);
		const tiers = generateTiers(rng, 4, firJunctions, 50, 1, 100, 0);
		const bottomTier = tiers[tiers.length - 1]!;
		expect(bottomTier.baseLeftY).toBeGreaterThanOrEqual(firTrunkTopY);
		expect(bottomTier.baseRightY).toBeGreaterThanOrEqual(firTrunkTopY);
	});

	it('top tier tipY remains near H * 0.05 (unchanged by trunk junction fix)', () => {
		const rng = createPrng(42);
		const tiers = generateTiers(rng, 3, pineJunctions, 50, 1, 100, 0);
		const topTier = tiers[0]!;
		// tipY should be near H * 0.05 = 15 (with possible overlap offset for non-first tiers)
		expect(topTier.tipY).toBeCloseTo(H * 0.05, 0);
	});

	it('verticalShift shifts tiers correctly', () => {
		const shift = 20;
		const rng1 = createPrng(42);
		const tiersNoShift = generateTiers(rng1, 3, pineJunctions, 50, 1, 100, 0);
		const rng2 = createPrng(42);
		const tiersWithShift = generateTiers(rng2, 3, pineJunctions, 50, 1, 100, shift);
		const topNoShift = tiersNoShift[0]!;
		const topWithShift = tiersWithShift[0]!;
		// The tipY of the top tier should shift by approximately the verticalShift amount
		expect(topWithShift.tipY).toBeGreaterThan(topNoShift.tipY);
	});
});
