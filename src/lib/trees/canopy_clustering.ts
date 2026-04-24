import type { Point2D } from './types/core.js';
import type { CanopyEnvelope } from './canopy_envelope.js';
import {
	ENVELOPE_EDGE_SCALE,
	clampToEnvelope,
	computeEnvelopeScaleFactor,
	getEnvelopeArea,
} from './canopy_envelope.js';
import type { Blob, ShapeStyleParameters } from './shapes/shape_types.js';
import { BOUNDARY_KINDS } from './boundaries.js';
import { createPrng } from './prng.js';
import { classifyCanopyBlobZOrder } from './z_ordering.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BranchTipInfo {
	readonly position: Point2D;
	readonly depth: number;
	/** Width of the branch at its tip (correlates with branch strength). */
	readonly widthEnd: number;
	/** Front/back z-order classification of this branch. */
	readonly zOrder: 'front' | 'back';
}

interface BlobCluster {
	readonly centroid: Point2D;
	readonly tips: readonly BranchTipInfo[];
	/** Depth of the strongest (lowest depth) branch in the cluster. */
	readonly strongestDepth: number;
	/** Max widthEnd among cluster's tips — proxy for strongest branch. */
	readonly strongestWidth: number;
	/** Whether this cluster contains the trunk tip. */
	readonly hasTrunkTip: boolean;
	/** Aggregate z-order for the cluster. */
	readonly zOrder: 'front' | 'back';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLUSTERING_SEED_OFFSET = 6666;
const KMEANS_MAX_ITERATIONS = 15;

/** Floor on cluster-size tip bonus contribution (0.5 when clusters are singletons). */
const CLUSTER_SIZE_BONUS_FLOOR = 0.5;

/** Branch widthEnd (in px) that saturates the width bonus to 1.0. */
const WIDTH_BONUS_SATURATION_PX = 4;

/** Base multiplier applied to envelope-budget radius before cluster modulation. */
const SIZE_MODULATION_BASE = 0.85;

/** Additional range on top of SIZE_MODULATION_BASE that cluster strength can add. */
const SIZE_MODULATION_RANGE = 0.4;

/** Minimum blob radius in px so blobs remain visible at high counts (issue #110). */
const MIN_VISIBLE_BLOB_RADIUS = 8;

// ---------------------------------------------------------------------------
// K-Means Clustering (REQ-EV2-BC-01)
// ---------------------------------------------------------------------------

interface WeightedPoint {
	readonly x: number;
	readonly y: number;
	readonly weight: number;
	readonly tipInfo?: BranchTipInfo;
	readonly isTrunkTip: boolean;
}

function buildWeightedPoints(
	tips: readonly BranchTipInfo[],
	trunkTip: Point2D | null,
	trunkTipWeight: number,
): WeightedPoint[] {
	const points: WeightedPoint[] = tips.map((tip) => ({
		x: tip.position.x,
		y: tip.position.y,
		weight: 1,
		tipInfo: tip,
		isTrunkTip: false,
	}));

	if (trunkTip !== null && trunkTipWeight > 0) {
		points.push({
			x: trunkTip.x,
			y: trunkTip.y,
			weight: trunkTipWeight,
			isTrunkTip: true,
		});
	}

	return points;
}

function initializeKMeansCentroids(
	points: readonly WeightedPoint[],
	count: number,
	rng: () => number,
): { x: number; y: number }[] {
	const centroids: { x: number; y: number }[] = [];
	const usedIndices = new Set<number>();

	for (let i = 0; i < count; i++) {
		let idx: number;
		if (i === 0) {
			idx = Math.floor(rng() * points.length);
		} else {
			let bestDist = -1;
			idx = 0;
			for (let p = 0; p < points.length; p++) {
				if (usedIndices.has(p)) {
					continue;
				}
				let minDist = Infinity;
				for (const c of centroids) {
					const d = (points[p]!.x - c.x) ** 2 + (points[p]!.y - c.y) ** 2;
					if (d < minDist) {
						minDist = d;
					}
				}
				if (minDist > bestDist) {
					bestDist = minDist;
					idx = p;
				}
			}
		}
		usedIndices.add(idx);
		centroids.push({ x: points[idx]!.x, y: points[idx]!.y });
	}

	return centroids;
}

function runKMeansIterations(
	points: readonly WeightedPoint[],
	centroids: { x: number; y: number }[],
): number[] {
	let assignments = Array.from<number>({ length: points.length }).fill(0);

	for (let iter = 0; iter < KMEANS_MAX_ITERATIONS; iter++) {
		const newAssignments: number[] = [];
		for (let p = 0; p < points.length; p++) {
			let bestCluster = 0;
			let bestDist = Infinity;
			for (let c = 0; c < centroids.length; c++) {
				const d =
					(points[p]!.x - centroids[c]!.x) ** 2 + (points[p]!.y - centroids[c]!.y) ** 2;
				if (d < bestDist) {
					bestDist = d;
					bestCluster = c;
				}
			}
			newAssignments.push(bestCluster);
		}

		const converged = newAssignments.every((a, i) => a === assignments[i]);
		assignments = newAssignments;

		if (converged) {
			break;
		}

		for (let c = 0; c < centroids.length; c++) {
			let sumX = 0;
			let sumY = 0;
			let totalWeight = 0;
			for (let p = 0; p < points.length; p++) {
				if (assignments[p] !== c) {
					continue;
				}
				sumX += points[p]!.x * points[p]!.weight;
				sumY += points[p]!.y * points[p]!.weight;
				totalWeight += points[p]!.weight;
			}
			if (totalWeight > 0) {
				centroids[c] = { x: sumX / totalWeight, y: sumY / totalWeight };
			}
		}
	}

	return assignments;
}

function buildClustersFromAssignments(
	points: readonly WeightedPoint[],
	centroids: readonly { x: number; y: number }[],
	assignments: readonly number[],
	trunkTip: Point2D | null,
): BlobCluster[] {
	const clusters: BlobCluster[] = [];

	for (let c = 0; c < centroids.length; c++) {
		const clusterTips: BranchTipInfo[] = [];
		const zOrders: ('front' | 'back')[] = [];
		let hasTrunkTip = false;
		let strongestDepth = Infinity;
		let strongestWidth = 0;

		for (let p = 0; p < points.length; p++) {
			if (assignments[p] !== c) {
				continue;
			}
			const point = points[p]!;
			if (point.isTrunkTip) {
				hasTrunkTip = true;
			}
			if (point.tipInfo) {
				clusterTips.push(point.tipInfo);
				zOrders.push(point.tipInfo.zOrder);
				if (point.tipInfo.depth < strongestDepth) {
					strongestDepth = point.tipInfo.depth;
				}
				if (point.tipInfo.widthEnd > strongestWidth) {
					strongestWidth = point.tipInfo.widthEnd;
				}
			}
		}

		if (clusterTips.length === 0 && !hasTrunkTip) {
			continue;
		}

		const zOrder = classifyCanopyBlobZOrder(zOrders, hasTrunkTip);

		if (strongestDepth === Infinity) {
			strongestDepth = 1;
		}
		if (strongestWidth === 0) {
			strongestWidth = 2;
		}

		const centroid =
			hasTrunkTip && trunkTip !== null ? { x: trunkTip.x, y: trunkTip.y } : centroids[c]!;

		clusters.push({
			centroid,
			tips: clusterTips,
			strongestDepth,
			strongestWidth,
			hasTrunkTip,
			zOrder,
		});
	}

	return clusters;
}

export function clusterBranchTips(
	tips: readonly BranchTipInfo[],
	blobCount: number,
	trunkTip: Point2D | null,
	trunkTipWeight: number,
	seed: number,
): BlobCluster[] {
	if (blobCount <= 0) {
		return [];
	}
	if (tips.length === 0 && trunkTip === null) {
		return [];
	}

	const rng = createPrng(seed + CLUSTERING_SEED_OFFSET);
	const points = buildWeightedPoints(tips, trunkTip, trunkTipWeight);
	const effectiveBlobCount = Math.max(1, Math.min(blobCount, points.length));
	const centroids = initializeKMeansCentroids(points, effectiveBlobCount, rng);
	const assignments = runKMeansIterations(points, centroids);
	return buildClustersFromAssignments(points, centroids, assignments, trunkTip);
}

// ---------------------------------------------------------------------------
// Cluster → Blob Conversion (REQ-EV2-BS-01, BC-03, BC-04)
// ---------------------------------------------------------------------------

/**
 * Convert a cluster into a render-ready Blob, applying shape style parameters,
 * envelope clamping, and size scaling.
 *
 * Size is anchored to the envelope budget: each blob starts from a "fair share"
 * of the envelope area (`sqrt(envelopeArea / blobCount / π)`) and is modulated
 * down by cluster strength and depth per REQ-EV2-BS-01 / REQ-EV2-BC-04.
 * `blobSizeVariance` is NOT applied here — it is applied after all clusters are
 * built (ratio semantics per REQ-C-02) via `applyBlobSizeVariance`.
 *
 * Returns null if the cluster's centroid is too far outside the envelope (bare branch).
 */
export function computeClusterBlob(
	cluster: BlobCluster,
	styleParams: ShapeStyleParameters,
	envelope: CanopyEnvelope,
	blobCount: number,
): Blob | null {
	// Check envelope coverage — tips very far outside get no blob (REQ-EV2-CE-04)
	const rawEnvelopeFactor = computeEnvelopeScaleFactor(
		cluster.centroid.x,
		cluster.centroid.y,
		envelope,
	);

	// Trunk-tip clusters always produce a blob (core canopy guarantee)
	const envelopeFactor = cluster.hasTrunkTip
		? Math.max(ENVELOPE_EDGE_SCALE, rawEnvelopeFactor)
		: rawEnvelopeFactor;

	if (envelopeFactor <= 0) {
		return null; // Bare branch — outside envelope
	}

	// Clamp centroid to envelope if outside (REQ-EV2-CE-04)
	const clampedCenter = clampToEnvelope(cluster.centroid.x, cluster.centroid.y, envelope);

	// Envelope-budget radius: each blob's fair share of the canopy region (REQ-EV2-BS-01).
	const envelopeArea = getEnvelopeArea(envelope);
	const targetRadius = Math.sqrt(envelopeArea / Math.max(1, blobCount) / Math.PI);

	// Cluster-strength modulation: more tips + thicker branches → bigger blob (REQ-EV2-BS-01).
	// Trunk-tip clusters represent the "central crown" (REQ-EV2-BC-02) and get full modulation
	// regardless of attached branch tips — they must penetrate the trunk top visibly.
	const tipBonus = cluster.hasTrunkTip
		? 1
		: Math.max(CLUSTER_SIZE_BONUS_FLOOR, Math.min(cluster.tips.length, 4) / 4);
	const widthBonus = Math.min(cluster.strongestWidth / WIDTH_BONUS_SATURATION_PX, 1);
	const sizeModulation = Math.min(
		1.1,
		SIZE_MODULATION_BASE + SIZE_MODULATION_RANGE * (0.5 * tipBonus + 0.5 * widthBonus),
	);

	// Weaker branches → smaller blobs (REQ-EV2-BC-04).
	const depthScale =
		cluster.strongestDepth === 1 ? 1.0 : cluster.strongestDepth === 2 ? 0.8 : 0.6;

	const finalRadius = targetRadius * sizeModulation * depthScale * envelopeFactor;

	// Shape style: rx/ry ratio and vertical offset.
	// Enforce minimum visible blob radius so blobs don't vanish at high counts (issue #110).
	const rx = Math.max(
		MIN_VISIBLE_BLOB_RADIUS,
		finalRadius * Math.sqrt(styleParams.blobRxRyRatio),
	);
	const ry = Math.max(
		MIN_VISIBLE_BLOB_RADIUS,
		finalRadius / Math.sqrt(styleParams.blobRxRyRatio),
	);

	return {
		cx: clampedCenter.x,
		cy: clampedCenter.y + styleParams.blobVerticalOffset,
		rx,
		ry,
		boundary: BOUNDARY_KINDS[styleParams.blobBoundary],
	};
}
