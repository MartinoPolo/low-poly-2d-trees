import { describe, it, expect } from 'vitest';
import { clusterBranchTips, computeClusterBlob, type BranchTipInfo } from './canopy_clustering.js';
import type { ShapeStyleParameters } from './shapes/shape_types.js';
import { computeCanopyEnvelope } from './canopy_envelope.js';

const defaultStyleParams: ShapeStyleParameters = {
	blobRxRyRatio: 1.0,
	blobVerticalOffset: 0,
	blobBoundary: 'circle',
	blobClusterBehavior: 0.5,
	trunkTipWeight: 1.0,
};

const defaultEnvelope = computeCanopyEnvelope(
	{ canopyCenterX: 150, canopyCenterY: 90, baseRadiusX: 80, baseRadiusY: 60 },
	100,
);

const DEFAULT_BLOB_COUNT = 5;

function makeTip(
	x: number,
	y: number,
	depth: number = 1,
	widthEnd: number = 3,
	zOrder: 'front' | 'back' = 'front',
): BranchTipInfo {
	return { position: { x, y }, depth, widthEnd, zOrder };
}

// ---------------------------------------------------------------------------
// REQ-EV2-BC-01: Clustering
// ---------------------------------------------------------------------------

describe('clusterBranchTips', () => {
	it('returns empty array for no tips and no trunk tip', () => {
		expect(clusterBranchTips([], 3, null, 0, 42)).toEqual([]);
	});

	it('cluster count matches blobCount when enough tips', () => {
		const tips: BranchTipInfo[] = [
			makeTip(100, 80),
			makeTip(200, 80),
			makeTip(120, 60),
			makeTip(180, 60),
			makeTip(150, 50),
		];
		const clusters = clusterBranchTips(tips, 3, null, 0, 42);
		expect(clusters.length).toBe(3);
	});

	it('cluster count capped at tip count when fewer tips than blobCount', () => {
		const tips: BranchTipInfo[] = [makeTip(100, 80), makeTip(200, 80)];
		const clusters = clusterBranchTips(tips, 5, null, 0, 42);
		expect(clusters.length).toBeLessThanOrEqual(2);
	});

	it('is deterministic — same seed produces same clusters', () => {
		const tips: BranchTipInfo[] = [makeTip(100, 80), makeTip(200, 80), makeTip(150, 50)];
		const c1 = clusterBranchTips(tips, 2, null, 0, 42);
		const c2 = clusterBranchTips(tips, 2, null, 0, 42);
		expect(c1.length).toBe(c2.length);
		for (let i = 0; i < c1.length; i++) {
			expect(c1[i]!.centroid.x).toBeCloseTo(c2[i]!.centroid.x);
			expect(c1[i]!.centroid.y).toBeCloseTo(c2[i]!.centroid.y);
		}
	});

	it('all tips are assigned to exactly one cluster', () => {
		const tips: BranchTipInfo[] = [
			makeTip(100, 80),
			makeTip(200, 80),
			makeTip(120, 60),
			makeTip(180, 60),
		];
		const clusters = clusterBranchTips(tips, 2, null, 0, 42);
		const totalTips = clusters.reduce((sum, c) => sum + c.tips.length, 0);
		expect(totalTips).toBe(tips.length);
	});
});

// ---------------------------------------------------------------------------
// REQ-EV2-BC-02: Trunk tip weight
// ---------------------------------------------------------------------------

describe('trunk tip weight', () => {
	it('trunk tip with weight=1 attracts a cluster centroid to it (oak)', () => {
		const trunkTip = { x: 150, y: 100 };
		const tips: BranchTipInfo[] = [makeTip(100, 80), makeTip(200, 80)];
		const clusters = clusterBranchTips(tips, 2, trunkTip, 1.0, 42);

		// At least one cluster should be close to trunk tip
		const minDistToTrunk = Math.min(
			...clusters.map((c) =>
				Math.sqrt((c.centroid.x - trunkTip.x) ** 2 + (c.centroid.y - trunkTip.y) ** 2),
			),
		);
		expect(minDistToTrunk).toBeLessThan(30);
	});

	it('trunk tip with weight=0 does not anchor a cluster (maple)', () => {
		const trunkTip = { x: 150, y: 100 };
		const tips: BranchTipInfo[] = [makeTip(100, 80), makeTip(200, 80)];
		const clustersNoWeight = clusterBranchTips(tips, 2, trunkTip, 0, 42);
		// With weight=0, trunk tip is not added, so clusters are purely based on tips
		expect(clustersNoWeight.every((c) => !c.hasTrunkTip)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// REQ-EV2-BC-04: Stronger branches get larger blobs
// ---------------------------------------------------------------------------

describe('cluster strength', () => {
	it('strongest depth is the minimum depth in the cluster', () => {
		const tips: BranchTipInfo[] = [makeTip(150, 80, 1, 5), makeTip(155, 82, 2, 2)];
		const clusters = clusterBranchTips(tips, 1, null, 0, 42);
		expect(clusters[0]!.strongestDepth).toBe(1);
		expect(clusters[0]!.strongestWidth).toBe(5);
	});
});

// ---------------------------------------------------------------------------
// REQ-EV2-CZ-01: Cluster z-order
// ---------------------------------------------------------------------------

describe('cluster z-order', () => {
	it('all-back cluster → back', () => {
		const tips: BranchTipInfo[] = [
			makeTip(100, 80, 1, 3, 'back'),
			makeTip(110, 82, 2, 2, 'back'),
		];
		const clusters = clusterBranchTips(tips, 1, null, 0, 42);
		expect(clusters[0]!.zOrder).toBe('back');
	});

	it('mixed cluster → front', () => {
		const tips: BranchTipInfo[] = [
			makeTip(100, 80, 1, 3, 'front'),
			makeTip(110, 82, 2, 2, 'back'),
		];
		const clusters = clusterBranchTips(tips, 1, null, 0, 42);
		expect(clusters[0]!.zOrder).toBe('front');
	});

	it('trunk-tip cluster → always front', () => {
		const tips: BranchTipInfo[] = [makeTip(150, 80, 1, 3, 'back')];
		const clusters = clusterBranchTips(tips, 1, { x: 150, y: 100 }, 1.0, 42);
		const trunkCluster = clusters.find((c) => c.hasTrunkTip);
		expect(trunkCluster?.zOrder).toBe('front');
	});
});

// ---------------------------------------------------------------------------
// REQ-EV2-BS-01, BC-03, BC-04: Blob generation from clusters
// ---------------------------------------------------------------------------

describe('computeClusterBlob', () => {
	it('produces a blob centered on cluster centroid (REQ-EV2-BC-03)', () => {
		const cluster = {
			centroid: { x: 150, y: 80 },
			tips: [makeTip(150, 80, 1, 5)],
			strongestDepth: 1,
			strongestWidth: 5,
			hasTrunkTip: false,
			zOrder: 'front' as const,
		};
		const blob = computeClusterBlob(
			cluster,
			defaultStyleParams,
			defaultEnvelope,
			DEFAULT_BLOB_COUNT,
		);
		expect(blob).not.toBeNull();
		expect(blob!.cx).toBeCloseTo(150, 0);
		expect(blob!.cy).toBeCloseTo(80, 0);
	});

	it('weaker branches (higher depth) produce smaller blobs (REQ-EV2-BC-04)', () => {
		const strongCluster = {
			centroid: { x: 150, y: 80 },
			tips: [makeTip(150, 80, 1, 5)],
			strongestDepth: 1,
			strongestWidth: 5,
			hasTrunkTip: false,
			zOrder: 'front' as const,
		};
		const weakCluster = {
			centroid: { x: 150, y: 80 },
			tips: [makeTip(150, 80, 3, 1)],
			strongestDepth: 3,
			strongestWidth: 1,
			hasTrunkTip: false,
			zOrder: 'front' as const,
		};
		const strongBlob = computeClusterBlob(
			strongCluster,
			defaultStyleParams,
			defaultEnvelope,
			DEFAULT_BLOB_COUNT,
		);
		const weakBlob = computeClusterBlob(
			weakCluster,
			defaultStyleParams,
			defaultEnvelope,
			DEFAULT_BLOB_COUNT,
		);
		expect(strongBlob).not.toBeNull();
		expect(weakBlob).not.toBeNull();
		const strongArea = strongBlob!.rx * strongBlob!.ry;
		const weakArea = weakBlob!.rx * weakBlob!.ry;
		expect(strongArea).toBeGreaterThan(weakArea);
	});

	it('returns null for tips far outside envelope (bare branch)', () => {
		const cluster = {
			centroid: { x: 400, y: 400 },
			tips: [makeTip(400, 400, 1, 3)],
			strongestDepth: 1,
			strongestWidth: 3,
			hasTrunkTip: false,
			zOrder: 'front' as const,
		};
		const blob = computeClusterBlob(
			cluster,
			defaultStyleParams,
			defaultEnvelope,
			DEFAULT_BLOB_COUNT,
		);
		expect(blob).toBeNull();
	});

	it('applies blobRxRyRatio from style params', () => {
		const cluster = {
			centroid: { x: 150, y: 80 },
			tips: [makeTip(150, 80, 1, 5)],
			strongestDepth: 1,
			strongestWidth: 5,
			hasTrunkTip: false,
			zOrder: 'front' as const,
		};
		const flatParams: ShapeStyleParameters = { ...defaultStyleParams, blobRxRyRatio: 4.0 };
		const blob = computeClusterBlob(cluster, flatParams, defaultEnvelope, DEFAULT_BLOB_COUNT);
		expect(blob).not.toBeNull();
		// rx should be much larger than ry for flat shapes like acacia
		expect(blob!.rx / blob!.ry).toBeCloseTo(4.0, 0);
	});

	it('applies blobVerticalOffset from style params (willow droop)', () => {
		const cluster = {
			centroid: { x: 150, y: 80 },
			tips: [makeTip(150, 80, 1, 5)],
			strongestDepth: 1,
			strongestWidth: 5,
			hasTrunkTip: false,
			zOrder: 'front' as const,
		};
		const droopParams: ShapeStyleParameters = { ...defaultStyleParams, blobVerticalOffset: 15 };
		const blob = computeClusterBlob(cluster, droopParams, defaultEnvelope, DEFAULT_BLOB_COUNT);
		expect(blob).not.toBeNull();
		expect(blob!.cy).toBeCloseTo(95, 0); // 80 + 15
	});

	it('live-cluster-count budgeting: 2 surviving clusters share envelope area 50/50, not 5-way', () => {
		const cluster = {
			centroid: { x: 150, y: 80 },
			tips: [makeTip(150, 80, 1, 5)],
			strongestDepth: 1,
			strongestWidth: 5,
			hasTrunkTip: false,
			zOrder: 'front' as const,
		};
		const blobWith5 = computeClusterBlob(cluster, defaultStyleParams, defaultEnvelope, 5);
		const blobWith2 = computeClusterBlob(cluster, defaultStyleParams, defaultEnvelope, 2);
		expect(blobWith5).not.toBeNull();
		expect(blobWith2).not.toBeNull();
		expect(blobWith2!.rx).toBeGreaterThan(blobWith5!.rx * 1.3);
	});

	it('singleton-branch-tip cluster produces rx >= 25 px', () => {
		const oakEnvelope = computeCanopyEnvelope(
			{ canopyCenterX: 150, canopyCenterY: 90, baseRadiusX: 96, baseRadiusY: 66 },
			100,
		);
		const singletonCluster = {
			centroid: { x: 150, y: 90 },
			tips: [makeTip(150, 90, 1, 1.5)],
			strongestDepth: 1,
			strongestWidth: 1.5,
			hasTrunkTip: false,
			zOrder: 'front' as const,
		};
		const blob = computeClusterBlob(singletonCluster, defaultStyleParams, oakEnvelope, 3);
		expect(blob).not.toBeNull();
		expect(blob!.rx).toBeGreaterThanOrEqual(25);
	});

	it('blob radius scales with envelope area — default oak-like envelope produces substantial blobs (REQ-EV2-BS-01)', () => {
		// Mimics default oak: 96 x 66 envelope, 5 blobs, thin branch tips (~1.5 px).
		const oakEnvelope = computeCanopyEnvelope(
			{ canopyCenterX: 150, canopyCenterY: 90, baseRadiusX: 96, baseRadiusY: 66 },
			100,
		);
		const thinCluster = {
			centroid: { x: 150, y: 90 },
			tips: [makeTip(150, 90, 1, 1.5)],
			strongestDepth: 1,
			strongestWidth: 1.5,
			hasTrunkTip: false,
			zOrder: 'front' as const,
		};
		const blob = computeClusterBlob(thinCluster, defaultStyleParams, oakEnvelope, 5);
		expect(blob).not.toBeNull();
		// Guards the pre-fix regression where thin branch tips produced ~8 px blobs.
		expect(Math.min(blob!.rx, blob!.ry)).toBeGreaterThan(15);
	});
});

describe('Issue #110: Minimum visible blob radius', () => {
	it('computeClusterBlob enforces min radius >= 8 even with tiny envelope', () => {
		// Use a very small envelope to force tiny blobs — the clamp at 8px ensures visibility.
		const tinyEnvelope = computeCanopyEnvelope(
			{ canopyCenterX: 150, canopyCenterY: 90, baseRadiusX: 15, baseRadiusY: 10 },
			100,
		);
		const cluster = {
			centroid: { x: 150, y: 90 },
			tips: [makeTip(150, 90, 3, 0.5)],
			strongestDepth: 3,
			strongestWidth: 0.5,
			hasTrunkTip: false,
			zOrder: 'front' as const,
		};
		const blob = computeClusterBlob(cluster, defaultStyleParams, tinyEnvelope, 25);
		expect(blob).not.toBeNull();
		expect(blob!.rx).toBeGreaterThanOrEqual(8);
		expect(blob!.ry).toBeGreaterThanOrEqual(8);
	});
});
