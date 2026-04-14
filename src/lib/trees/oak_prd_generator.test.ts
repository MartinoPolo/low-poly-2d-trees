import { describe, it, expect } from 'vitest';
import { generateOakPrdTree } from './oak_prd_generator.js';
import type { OakPrdConfig } from './types/oak_prd_types.js';
import { DEFAULT_OAK_PRD_CONFIG, OAK_PRD_VIEWBOX } from './types/oak_prd_types.js';

function makeConfig(overrides: Partial<OakPrdConfig> = {}): OakPrdConfig {
	return { ...DEFAULT_OAK_PRD_CONFIG, ...overrides };
}

describe('generateOakPrdTree', () => {
	it('returns TreeGeometry with OAK_PRD_VIEWBOX (300x450)', () => {
		const geo = generateOakPrdTree(makeConfig());
		expect(geo.viewBox.width).toBe(OAK_PRD_VIEWBOX.width);
		expect(geo.viewBox.height).toBe(OAK_PRD_VIEWBOX.height);
		expect(Array.isArray(geo.trunkQuads)).toBe(true);
		expect(Array.isArray(geo.trunkTriangles)).toBe(true);
		expect(Array.isArray(geo.branchGroups)).toBe(true);
		expect(Array.isArray(geo.canopyBlobs)).toBe(true);
		expect(Array.isArray(geo.fruitTriangles)).toBe(true);
		expect(Array.isArray(geo.stakeTriangles)).toBe(true);
		expect(Array.isArray(geo.fruitSlots)).toBe(true);
	});

	it('completionRatio=1 produces all canopyBlobs with triangles', () => {
		const geo = generateOakPrdTree(makeConfig({ completionRatio: 1 }));
		expect(geo.canopyBlobs.length).toBeGreaterThan(0);
		for (const blob of geo.canopyBlobs) {
			expect(blob.triangles.length).toBeGreaterThan(0);
		}
	});

	it('completionRatio=0 produces all canopyBlobs with zero triangles', () => {
		const geo = generateOakPrdTree(makeConfig({ completionRatio: 0 }));
		expect(geo.canopyBlobs.length).toBeGreaterThan(0);
		for (const blob of geo.canopyBlobs) {
			expect(blob.triangles.length).toBe(0);
		}
	});

	it('completionRatio=0.6 with issueCount=20 splits blobs proportionally', () => {
		const geo = generateOakPrdTree(makeConfig({ completionRatio: 0.6, issueCount: 20 }));
		const total = geo.canopyBlobs.length;
		const filledCount = geo.canopyBlobs.filter((b) => b.triangles.length > 0).length;
		const emptyCount = total - filledCount;
		const expectedFilled = Math.floor(total * 0.6);
		expect(filledCount).toBe(expectedFilled);
		expect(emptyCount).toBe(total - expectedFilled);
	});

	it('branchGroups have non-empty quads even when completionRatio=0', () => {
		const geo = generateOakPrdTree(makeConfig({ completionRatio: 0 }));
		expect(geo.branchGroups.length).toBeGreaterThan(0);
		const totalBranchQuads = geo.branchGroups.reduce((sum, g) => sum + g.quads.length, 0);
		expect(totalBranchQuads).toBeGreaterThan(0);
	});

	it('all geometry points fall within [0, 300] x [0, 450] bounds', () => {
		const geo = generateOakPrdTree(makeConfig({ completionRatio: 1 }));
		const allPoints: { x: number; y: number }[] = [];

		for (const quad of geo.trunkQuads) {
			allPoints.push(...quad.points);
		}
		for (const tri of geo.trunkTriangles) {
			allPoints.push(...tri.points);
		}
		for (const group of geo.branchGroups) {
			for (const quad of group.quads) {
				allPoints.push(...quad.points);
			}
		}
		for (const blob of geo.canopyBlobs) {
			for (const tri of blob.triangles) {
				allPoints.push(...tri.points);
			}
		}

		expect(allPoints.length).toBeGreaterThan(0);
		for (const point of allPoints) {
			expect(point.x).toBeGreaterThanOrEqual(0);
			expect(point.x).toBeLessThanOrEqual(OAK_PRD_VIEWBOX.width);
			expect(point.y).toBeGreaterThanOrEqual(0);
			expect(point.y).toBeLessThanOrEqual(OAK_PRD_VIEWBOX.height);
		}
	});

	it('same config produces identical output (deterministic)', () => {
		const config = makeConfig({ completionRatio: 0.5, issueCount: 12, seed: 99 });
		const geo1 = generateOakPrdTree(config);
		const geo2 = generateOakPrdTree(config);
		expect(geo1).toEqual(geo2);
	});

	it('higher issueCount produces more canopyBlobs', () => {
		const geoSmall = generateOakPrdTree(makeConfig({ issueCount: 4, completionRatio: 1 }));
		const geoLarge = generateOakPrdTree(makeConfig({ issueCount: 20, completionRatio: 1 }));
		expect(geoLarge.canopyBlobs.length).toBeGreaterThan(geoSmall.canopyBlobs.length);
	});

	it('anchors are within viewBox bounds', () => {
		const geo = generateOakPrdTree(makeConfig({ completionRatio: 0.5 }));
		const { anchors } = geo;
		const namedPoints = [
			anchors.trunkTop,
			anchors.trunkMiddle,
			anchors.trunkBase,
			anchors.crownCenter,
			anchors.crownTop,
			anchors.roots,
		];
		for (const point of namedPoints) {
			expect(point.x).toBeGreaterThanOrEqual(0);
			expect(point.x).toBeLessThanOrEqual(OAK_PRD_VIEWBOX.width);
			expect(point.y).toBeGreaterThanOrEqual(0);
			expect(point.y).toBeLessThanOrEqual(OAK_PRD_VIEWBOX.height);
		}
		for (const tip of anchors.branchTips) {
			expect(tip.x).toBeGreaterThanOrEqual(0);
			expect(tip.x).toBeLessThanOrEqual(OAK_PRD_VIEWBOX.width);
			expect(tip.y).toBeGreaterThanOrEqual(0);
			expect(tip.y).toBeLessThanOrEqual(OAK_PRD_VIEWBOX.height);
		}
	});
});
