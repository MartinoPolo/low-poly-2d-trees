import type { Point2D } from './types/core.js';
import type { CanopyEnvelope } from './canopy_envelope.js';
import { clampToEnvelope, computeEnvelopeScaleFactor } from './canopy_envelope.js';
import type { Blob } from './shapes/shape_types.js';
import { BOUNDARY_KINDS } from './boundaries.js';
import { createPrng } from './prng.js';

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

export interface ShapeStyleParameters {
	/** Blob rx/ry ratio: 1.0 = round, 3.0+ = flat (REQ-EV2-SS-01). */
	readonly blobRxRyRatio: number;
	/** Vertical offset from tip position: negative = droop (REQ-EV2-SS-01). */
	readonly blobVerticalOffset: number;
	/** Boundary shape: 'circle' or 'teardrop' (REQ-EV2-SS-01). */
	readonly blobBoundary: 'circle' | 'teardrop';
	/** How aggressively nearby tips merge: 0 = spread, 1 = tight (REQ-EV2-SS-01). */
	readonly blobClusterBehavior: number;
	/** Trunk tip weight in clustering: 0 = ignore, 1 = strong anchor (REQ-EV2-BC-02). */
	readonly trunkTipWeight: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLUSTERING_SEED_OFFSET = 6666;
const KMEANS_MAX_ITERATIONS = 15;

/** Base blob radius scaling factor relative to branch width. */
const BASE_BLOB_RADIUS_FACTOR = 3.5;

/** Minimum blob radius to prevent invisible blobs. */
const MIN_BLOB_RADIUS = 8;

/** Cluster size contribution to blob radius. */
const CLUSTER_SIZE_RADIUS_BONUS = 4;

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

/**
 * Cluster branch tips into M groups using seeded k-means.
 *
 * - `blobCount` = target cluster count (M).
 * - Trunk tip is included with shape-dependent weight.
 * - Returns clusters with centroids at cluster center (branches in MIDDLE of blob).
 */
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

	// Build weighted point list
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

	const effectiveBlobCount = Math.max(1, Math.min(blobCount, points.length));

	// Initialize centroids by picking random points (k-means++ lite)
	const centroids: { x: number; y: number }[] = [];
	const usedIndices = new Set<number>();

	for (let i = 0; i < effectiveBlobCount; i++) {
		let idx: number;
		if (i === 0) {
			idx = Math.floor(rng() * points.length);
		} else {
			// Pick point farthest from existing centroids (simplified k-means++)
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

	// K-means iterations
	let assignments = Array.from<number>({ length: points.length }).fill(0);

	for (let iter = 0; iter < KMEANS_MAX_ITERATIONS; iter++) {
		// Assign each point to nearest centroid
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

		// Check convergence
		const converged = newAssignments.every((a, i) => a === assignments[i]);
		assignments = newAssignments;

		if (converged) {
			break;
		}

		// Update centroids (weighted)
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

	// Build clusters
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

		// Skip empty clusters (can happen if blobCount > points)
		if (clusterTips.length === 0 && !hasTrunkTip) {
			continue;
		}

		// Z-order: trunk-tip clusters always front, else majority wins (REQ-EV2-CZ-01)
		let zOrder: 'front' | 'back' = 'front';
		if (!hasTrunkTip && zOrders.length > 0) {
			const allBack = zOrders.every((z) => z === 'back');
			zOrder = allBack ? 'back' : 'front';
		}

		if (strongestDepth === Infinity) {
			strongestDepth = 1;
		}
		if (strongestWidth === 0) {
			strongestWidth = 2;
		}

		clusters.push({
			centroid: centroids[c]!,
			tips: clusterTips,
			strongestDepth,
			strongestWidth,
			hasTrunkTip,
			zOrder,
		});
	}

	return clusters;
}

// ---------------------------------------------------------------------------
// Cluster → Blob Conversion (REQ-EV2-BS-01, BC-03, BC-04)
// ---------------------------------------------------------------------------

/**
 * Convert a cluster into a render-ready Blob, applying shape style parameters,
 * envelope clamping, and size scaling.
 *
 * Returns null if the cluster's centroid is too far outside the envelope (bare branch).
 */
export function computeClusterBlob(
	cluster: BlobCluster,
	styleParams: ShapeStyleParameters,
	envelope: CanopyEnvelope,
	blobSizeVariance: number,
	rng: () => number,
): Blob | null {
	// Check envelope coverage — tips very far outside get no blob (REQ-EV2-CE-04)
	const envelopeFactor = computeEnvelopeScaleFactor(
		cluster.centroid.x,
		cluster.centroid.y,
		envelope,
	);

	if (envelopeFactor <= 0) {
		return null; // Bare branch — outside envelope
	}

	// Clamp centroid to envelope if outside (REQ-EV2-CE-04)
	const clampedCenter = clampToEnvelope(cluster.centroid.x, cluster.centroid.y, envelope);

	// Blob size from cluster size + branch thickness (REQ-EV2-BS-01)
	const clusterSizeBonus = Math.min(cluster.tips.length, 4) * CLUSTER_SIZE_RADIUS_BONUS;
	const baseRadius = cluster.strongestWidth * BASE_BLOB_RADIUS_FACTOR + clusterSizeBonus;

	// Weaker branches → smaller blobs (REQ-EV2-BC-04)
	const depthScale =
		cluster.strongestDepth === 1 ? 1.0 : cluster.strongestDepth === 2 ? 0.7 : 0.5;

	// Apply envelope scale factor (center = larger, edge = smaller)
	const effectiveRadius = Math.max(MIN_BLOB_RADIUS, baseRadius * depthScale * envelopeFactor);

	// Apply blobSizeVariance
	const varianceFactor = 1 + (rng() * 2 - 1) * (blobSizeVariance / 100) * 0.3;
	const finalRadius = effectiveRadius * varianceFactor;

	// Shape style: rx/ry ratio and vertical offset
	const rx = finalRadius * Math.sqrt(styleParams.blobRxRyRatio);
	const ry = finalRadius / Math.sqrt(styleParams.blobRxRyRatio);

	return {
		cx: clampedCenter.x,
		cy: clampedCenter.y + styleParams.blobVerticalOffset,
		rx,
		ry,
		boundary: BOUNDARY_KINDS[styleParams.blobBoundary],
	};
}
