import type { TreeConfig, TreeGeometry, BlobGeometry, JunctionData } from './types.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT, TREE_SHAPES, FRUIT_TYPES } from './types.js';
import { applyStageModifiers, generateStakeTriangles } from './stages/index.js';
import { createPrng } from './prng.js';
import {
	getShapeDefinition,
	computeEffectiveTrunkTop,
	isPointInBlobs,
	generateBranches,
	getBlobsBounds,
	applyBlobSizeVariance,
	applyBlobCloseness,
	applyCanopySize,
	repositionIsolatedBlobs,
	validateNoFloatingBlobs,
	generateTiers,
	isPointInTier,
	getTiersBounds,
	buildTrunkPath,
	sampleTrunkCenterX,
	computeZoneSplit,
	generateCustomBlobs,
	CUSTOM_BLOB_CANOPY_CENTER_X,
	CUSTOM_BLOB_CANOPY_CENTER_Y,
	CUSTOM_BLOB_SPREAD_RADIUS,
	TRUNK_ENTRY_MIN_PX,
	treeSizeW,
	trimBranchTipsToBlobs,
	type Blob,
	type GeneratedBranch,
	type ForkReduction,
} from './shapes.js';
import {
	classifyBranchZOrder,
	classifyChildBranchZOrder,
	canopyZOrderToLayer,
} from './z_ordering.js';
import { computeCanopyEnvelope } from './canopy_envelope.js';
import { clusterBranchTips, computeClusterBlob, type BranchTipInfo } from './canopy_clustering.js';
import { SHAPES_WITH_ACUTE_SMOOTHING, TIERED_SHAPES } from './generate/shape_constants.js';
import {
	generateTrunkQuads,
	computeJunctionStripRatios,
	computeHybridTaper,
} from './generate/trunk_geometry.js';
import { generateAllBranchQuads } from './generate/branch_geometry.js';
import { generateBlobCanopy, generateTierCanopy } from './generate/canopy_triangulation.js';
import { generateBirchStripes } from './generate/birch_stripes.js';
import { computeAnchors } from './generate/anchors.js';

export { computeJunctionStripRatios, computeHybridTaper };

const FRUIT_COUNT_CAP = 7;
const BIRCH_STRIPE_SEED_OFFSET = 9999;

interface StageFlags {
	readonly addStakes: boolean;
	readonly addFruit: boolean;
	readonly addFlowers: boolean;
	readonly addFallingLeaves: boolean;
	readonly addSnowBlobs: boolean;
}

const DEFAULT_STAGE_FLAGS: StageFlags = {
	addStakes: false,
	addFruit: false,
	addFlowers: false,
	addFallingLeaves: false,
	addSnowBlobs: false,
};

export function generateTree(config: TreeConfig): TreeGeometry {
	if (config.shape !== TREE_SHAPES.custom) {
		const stageResult = applyStageModifiers(config);
		if (stageResult.kind === 'directGeometry') {
			return stageResult.geometry;
		}
		return generateTreeCore(stageResult.config, {
			addStakes: stageResult.addStakes,
			addFruit: stageResult.addFruit,
			addFlowers: stageResult.addFlowers,
			addFallingLeaves: stageResult.addFallingLeaves,
			addSnowBlobs: stageResult.addSnowBlobs,
		});
	}
	// Custom shapes: derive addFruit from config (fruitType and fruitCount)
	const customFlags: StageFlags = {
		...DEFAULT_STAGE_FLAGS,
		addFruit: config.fruitType !== FRUIT_TYPES.none && config.fruitCount > 0,
	};
	return generateTreeCore(config, customFlags);
}

function generateTreeCore(config: TreeConfig, flags: StageFlags): TreeGeometry {
	const rng = createPrng(config.seed);
	const shapeDef = getShapeDefinition(config.shape);
	const isTiered = TIERED_SHAPES.has(config.shape);
	const isCustom = config.shape === TREE_SHAPES.custom;
	const hasBranchingCanopy = !isTiered && shapeDef.styleParameters !== undefined;

	const effectiveTrunkTop = computeEffectiveTrunkTop(shapeDef, config.trunkHeight);
	const canopyDelta = effectiveTrunkTop - shapeDef.defaultTrunkTop;
	const trunkBottom = shapeDef.trunkBottom;

	// REQ-EV2-TZ-02: enforce minimum trunk segments when branches are enabled
	const maxL1 = config.branchesLevel1Range[1];
	const hasBranches = config.branchDepth > 0 && maxL1 > 0;
	const { lowerZoneSegments, upperZoneSegments } = computeZoneSplit(
		config.trunkSegments,
		hasBranches ? maxL1 : 0,
	);
	const effectiveTrunkSegments = hasBranches
		? lowerZoneSegments + upperZoneSegments
		: config.trunkSegments;

	let trunkJunctions = buildTrunkPath(
		rng,
		config.trunkLean,
		effectiveTrunkSegments,
		config.trunkCrookedness,
		effectiveTrunkTop,
		trunkBottom,
		config.crookednessMode,
	);
	const topJunctionInitial = trunkJunctions[trunkJunctions.length - 1]!;
	const horizontalCanopyShift = topJunctionInitial.x - VIEWBOX_WIDTH / 2;

	let blobs: Blob[];
	if (isTiered) {
		blobs = [];
	} else if (isCustom) {
		blobs = generateCustomBlobs(
			config.customBlobs ?? [],
			config.blobCount,
			CUSTOM_BLOB_CANOPY_CENTER_X,
			CUSTOM_BLOB_CANOPY_CENTER_Y,
			CUSTOM_BLOB_SPREAD_RADIUS,
		);
		for (const blob of blobs) {
			blob.cy += canopyDelta;
			blob.cx += horizontalCanopyShift;
		}
	} else if (hasBranchingCanopy) {
		blobs = [];
	} else {
		blobs = shapeDef.generateBlobs(rng, config.blobCount);
		applyBlobSizeVariance(blobs, config.blobSizeVariance);
		if (blobs.length > 1) {
			const spreadRadius = treeSizeW(0.22);
			applyBlobCloseness(blobs, config.blobCloseness, spreadRadius);
		}
		applyCanopySize(blobs, config.canopySize);
		for (const blob of blobs) {
			blob.cy += canopyDelta;
			blob.cx += horizontalCanopyShift;
		}
	}

	const tiers = isTiered
		? generateTiers(
				rng,
				config.blobCount,
				trunkJunctions,
				config.blobCloseness,
				config.blobSizeVariance,
				config.canopySize,
				canopyDelta,
			)
		: [];

	// Custom trees may legitimately have zero blobs (user dragged blobCount to
	// 0 with no overrides yet). Fall back to trivial bounds anchored on the
	// current trunk top so `computeAnchors` and the trunk-penetration clamp
	// below stay well-defined.
	const canopyBounds = isTiered
		? getTiersBounds(tiers)
		: blobs.length > 0
			? getBlobsBounds(blobs)
			: {
					minX: VIEWBOX_WIDTH / 2,
					minY: effectiveTrunkTop,
					maxX: VIEWBOX_WIDTH / 2,
					maxY: effectiveTrunkTop + TRUNK_ENTRY_MIN_PX,
				};

	if (!hasBranchingCanopy && !isTiered) {
		const clampedTrunkTop = Math.min(effectiveTrunkTop, canopyBounds.maxY - TRUNK_ENTRY_MIN_PX);
		if (clampedTrunkTop !== effectiveTrunkTop) {
			const clamped = [...trunkJunctions];
			const top = clamped[clamped.length - 1]!;
			clamped[clamped.length - 1] = { x: top.x, y: clampedTrunkTop };
			trunkJunctions = clamped;
		}
	}
	const trunkTop = trunkJunctions[trunkJunctions.length - 1]!.y;

	// Branch generation: all shapes (including maple) use the generic system (BR-13)
	let branches: GeneratedBranch[];
	let forkReductions: ForkReduction[] = [];
	if (isTiered) {
		branches = [];
	} else {
		const thicknessScale = config.trunkThickness / 100;
		const branchResult = generateBranches(
			createPrng(config.seed + 7777),
			trunkTop,
			trunkBottom,
			shapeDef.trunkTopWidth * thicknessScale,
			config,
			trunkJunctions,
			blobs,
			shapeDef.trunkBaseWidth * thicknessScale,
		);
		branches = branchResult.branches;
		forkReductions = branchResult.forkReductions;

		// REQ-EV2-G-02: Trunk centerline displacement opposite to branch at fork junctions.
		// For each L1 branch, shift all trunk junctions above the fork away from the branch.
		if (branches.length > 0) {
			const displaced = [...trunkJunctions];
			for (const branch of branches) {
				if (branch.depth !== 1) {
					continue;
				}
				// Find the closest junction to the branch origin
				let closestIdx = 0;
				let closestDist = Infinity;
				for (let j = 0; j < displaced.length; j++) {
					const dist = Math.abs(displaced[j]!.y - branch.segment.y1);
					if (dist < closestDist) {
						closestDist = dist;
						closestIdx = j;
					}
				}
				// Branch direction: origin to tip
				const branchDirX = branch.segment.x2 - branch.segment.x1;
				// Displacement opposite to branch X direction, 2-5px proportional to width fraction
				const trunkWidthAtFork = shapeDef.trunkBaseWidth * thicknessScale;
				const widthFraction =
					trunkWidthAtFork > 0 ? branch.segment.widthStart / trunkWidthAtFork : 0;
				const displacementPx = 2 + widthFraction * 3; // 2-5px range
				const displacementDir = branchDirX > 0 ? -1 : 1;
				// Shift all junctions above the fork point
				for (let j = closestIdx; j < displaced.length; j++) {
					const attenuation = j === closestIdx ? 0.5 : 1.0;
					displaced[j] = {
						x: displaced[j]!.x + displacementDir * displacementPx * attenuation,
						y: displaced[j]!.y,
					};
				}
			}
			trunkJunctions = displaced;
		}
	}

	const extraSegments =
		isTiered || hasBranchingCanopy
			? []
			: validateNoFloatingBlobs(
					blobs,
					branches.map((b) => b.segment),
				);
	const extraBranches: GeneratedBranch[] = extraSegments.map((seg) => ({
		segment: seg,
		path: [
			{ x: seg.x1, y: seg.y1 },
			{ x: seg.x2, y: seg.y2 },
		],
		depth: 1,
		parentIndex: null,
	}));
	const allBranches = [...branches, ...extraBranches];

	// Rule L validation (REQ-EV2-L-01): trunk tip must connect to branch or canopy.
	// When trunkFork is active, the effective tip is at the fork junction (second-
	// to-last) since the topmost junction is not rendered.
	const effectiveTipIndex =
		config.trunkFork && trunkJunctions.length >= 3
			? trunkJunctions.length - 2
			: trunkJunctions.length - 1;
	const topJunction = trunkJunctions[effectiveTipIndex]!;
	const tipInsideCanopy =
		isPointInBlobs(topJunction.x, topJunction.y, blobs) ||
		tiers.some((t) => isPointInTier(topJunction.x, topJunction.y, t));
	const tipHasBranch = allBranches.some(
		(b) =>
			Math.abs(b.segment.x1 - topJunction.x) < 5 &&
			Math.abs(b.segment.y1 - topJunction.y) < 5,
	);
	if (!tipInsideCanopy && !tipHasBranch && allBranches.length > 0) {
		// Emergency: connect trunk tip to nearest canopy blob
		const targetX = blobs.length > 0 ? blobs[0]!.cx : topJunction.x;
		const targetY = blobs.length > 0 ? blobs[0]!.cy : topJunction.y - 20;
		allBranches.push({
			segment: {
				x1: topJunction.x,
				y1: topJunction.y,
				x2: targetX,
				y2: targetY,
				widthStart: 3 * (config.branchThickness / 100),
				widthEnd: 1,
			},
			path: [
				{ x: topJunction.x, y: topJunction.y },
				{ x: targetX, y: targetY },
			],
			depth: 1,
			parentIndex: null,
		});
	}

	// Generate trunk quads — Engine v2: junction-based continuous strips
	const trunkResult = generateTrunkQuads(trunkJunctions, shapeDef, config, forkReductions);
	const trunkQuads = trunkResult.quads;

	// ---------------------------------------------------------------------------
	// Z-Order Classification (REQ-EV2-Z-01, Z-03)
	// ---------------------------------------------------------------------------

	const trunkCenterX = sampleTrunkCenterX(
		trunkJunctions,
		(trunkJunctions[0]!.y + trunkJunctions[trunkJunctions.length - 1]!.y) / 2,
	);

	// Classify each branch as front/back (loop so parent z-orders are available for L2+)
	const branchZOrders: ('front' | 'back')[] = [];
	for (let i = 0; i < allBranches.length; i++) {
		const branch = allBranches[i]!;
		if (!hasBranchingCanopy) {
			branchZOrders.push('front');
			continue;
		}

		if (branch.depth === 1) {
			branchZOrders.push(
				classifyBranchZOrder(
					branch.segment.x1,
					trunkCenterX,
					config.lightAngle,
					config.seed,
					i,
				),
			);
			continue;
		}
		// L2+: inherit from parent with flip chance
		if (branch.parentIndex !== null && branchZOrders[branch.parentIndex] !== undefined) {
			branchZOrders.push(
				classifyChildBranchZOrder(branchZOrders[branch.parentIndex]!, config.seed, i),
			);
			continue;
		}
		branchZOrders.push(
			classifyBranchZOrder(
				branch.segment.x1,
				trunkCenterX,
				config.lightAngle,
				config.seed,
				i,
			),
		);
	}

	// Generate branch quads with z-order (BR-3 + REQ-EV2-Z-02). Pass trunk
	// junction edge points so L1 forks use the shared-vertex model
	// (REQ-EV2-F-01): branch base outer corners coincide with trunk edges.
	const branchGroups = generateAllBranchQuads(
		allBranches,
		config,
		trunkJunctions,
		trunkResult.junctionEdgePoints,
		branchZOrders,
	);

	// ---------------------------------------------------------------------------
	// Canopy Generation — branching vs branchless (REQ-EV2-P-01, P-02)
	// ---------------------------------------------------------------------------

	const smoothAcuteAngles = SHAPES_WITH_ACUTE_SMOOTHING.has(config.shape);
	let canopyBlobs: BlobGeometry[];
	let canopyEnvelope:
		| { centerX: number; centerY: number; radiusX: number; radiusY: number }
		| undefined;

	if (isTiered) {
		// Branchless tiered shapes (pine, fir): unchanged
		canopyBlobs = generateTierCanopy(
			rng,
			tiers,
			config.polygonsPerBlob,
			config,
			flags.addSnowBlobs,
		);
	} else if (hasBranchingCanopy) {
		// Branch-driven canopy: cluster tips → generate blobs (REQ-EV2-BC-01)
		const styleParams = shapeDef.styleParameters!;
		const envDefaults = shapeDef.envelopeDefaults!;
		const topJunctionForEnv = trunkJunctions[trunkJunctions.length - 1]!;

		// Compute canopy envelope (REQ-EV2-CE-01)
		const envelope = computeCanopyEnvelope(
			{
				canopyCenterX: topJunctionForEnv.x,
				canopyCenterY: envDefaults.canopyCenterY + canopyDelta,
				baseRadiusX: envDefaults.baseRadiusX,
				baseRadiusY: envDefaults.baseRadiusY,
			},
			config.canopySize,
		);

		canopyEnvelope = envelope;

		const trunkTipPoint = trunkJunctions[trunkJunctions.length - 1]!;

		let clusters: ReturnType<typeof clusterBranchTips>;
		if (allBranches.length > 0) {
			const tipInfos: BranchTipInfo[] = allBranches.map((b, i) => ({
				position: { x: b.segment.x2, y: b.segment.y2 },
				depth: b.depth,
				widthEnd: b.segment.widthEnd,
				zOrder: branchZOrders[i]!,
			}));
			clusters = clusterBranchTips(
				tipInfos,
				config.blobCount,
				trunkTipPoint,
				styleParams.trunkTipWeight,
				config.seed,
			);
		} else {
			clusters = [
				{
					centroid: trunkTipPoint,
					tips: [],
					strongestDepth: 1,
					strongestWidth: 2,
					hasTrunkTip: true,
					zOrder: 'front' as const,
				},
			];
		}

		const survivingClusterCount = clusters.length;
		const clusteredBlobsWithZ: { blob: Blob; zOrder: 'front' | 'back' }[] = [];
		for (const cluster of clusters) {
			const blob = computeClusterBlob(cluster, styleParams, envelope, survivingClusterCount);
			if (blob !== null) {
				clusteredBlobsWithZ.push({ blob, zOrder: cluster.zOrder });
			}
		}

		// Sort largest → smallest so applyBlobSizeVariance (which lerps by index
		// from 1.0 at [0] down to 1/variance at [n-1]) shrinks the smallest
		// blobs, not arbitrary ones. Matches legacy pipeline semantics (REQ-C-02).
		clusteredBlobsWithZ.sort((a, b) => b.blob.rx * b.blob.ry - a.blob.rx * a.blob.ry);

		const clusteredBlobs: Blob[] = clusteredBlobsWithZ.map((x) => x.blob);
		const clusterZOrders: ('front' | 'back')[] = clusteredBlobsWithZ.map((x) => x.zOrder);

		// Apply blobSizeVariance (REQ-C-02: max/min ratio) only if the cluster's
		// natural size spread is less than the target. Clustered blobs already
		// vary naturally (envelopeFactor + cluster-strength modulation) — applying
		// the full legacy ratio lerp on top would squash the smallest blob below
		// visibility.
		if (clusteredBlobs.length >= 2) {
			const areas = clusteredBlobs.map((b) => b.rx * b.ry);
			const maxArea = Math.max(...areas);
			const minArea = Math.min(...areas);
			const naturalRatio = Math.sqrt(maxArea / Math.max(0.01, minArea));
			if (naturalRatio < config.blobSizeVariance) {
				// Natural spread is below the user's target — top it up, but scale
				// by the REMAINING ratio, not the full one.
				const remainingRatio = config.blobSizeVariance / naturalRatio;
				applyBlobSizeVariance(clusteredBlobs, remainingRatio);
			}
		}

		// Update blobs for subsequent processing (anchors, etc.)
		blobs = clusteredBlobs;

		// Reposition isolated blobs toward neighbors (issue #110) — prevents
		// floating canopy blobs in branching-canopy shapes.
		repositionIsolatedBlobs(clusteredBlobs);

		// Trim branch tips that extend past their closest canopy blob (issue #110).
		trimBranchTipsToBlobs(allBranches, clusteredBlobs);

		// Generate canopy triangles from clustered blobs
		const clusteredBlobGeos = generateBlobCanopy(
			rng,
			clusteredBlobs,
			config.polygonsPerBlob,
			smoothAcuteAngles,
			config,
			flags.addSnowBlobs,
		);

		// Apply z-order to canopy blobs (REQ-EV2-CZ-01)
		canopyBlobs = clusteredBlobGeos.map((geo, i) => ({
			...geo,
			zOrder: canopyZOrderToLayer(clusterZOrders[i] ?? 'front'),
		}));
	} else {
		// Non-tiered shapes without branches or without style params: use legacy blob generators
		canopyBlobs = generateBlobCanopy(
			rng,
			blobs,
			config.polygonsPerBlob,
			smoothAcuteAngles,
			config,
			flags.addSnowBlobs,
		);
	}

	// Recompute canopy bounds from final blobs (clustering may have changed them)
	const finalCanopyBounds = !isTiered && blobs.length > 0 ? getBlobsBounds(blobs) : canopyBounds;

	const anchors = computeAnchors(
		trunkJunctions,
		finalCanopyBounds,
		allBranches.map((b) => b.segment),
		canopyBlobs,
		blobs,
		tiers,
		config.seed,
	);

	// Cross-phase contract: branch tip depths (REQ-EV2-C-02)
	const branchTipDepths = allBranches.map((b) => ({
		position: { x: b.segment.x2, y: b.segment.y2 },
		depth: b.depth,
	}));
	const anchorsWithTipDepths = { ...anchors, branchTipDepths };

	const effectiveFruitCount = Math.min(config.fruitCount, FRUIT_COUNT_CAP);
	const stakeTriangles = flags.addStakes ? generateStakeTriangles(anchorsWithTipDepths) : [];
	const fruitSlotsResult = flags.addFruit
		? anchorsWithTipDepths.fruitSlots.slice(0, effectiveFruitCount)
		: [];
	const flowerSlotsResult = flags.addFlowers ? anchorsWithTipDepths.fruitSlots : [];

	// Cross-phase contract: junction data (REQ-EV2-C-01)
	// Reuse bisectors computed in generateTrunkQuads (item #8: avoid duplicate call)
	const junctionData: JunctionData[] = trunkJunctions.map((pos, i) => ({
		position: pos,
		width: trunkResult.junctionWidths[i] ?? 0,
		stripRatios: trunkResult.stripRatios[i] ?? [],
		bisectorAngle: Math.atan2(trunkResult.bisectors[i]!.perpY, trunkResult.bisectors[i]!.perpX),
	}));

	const birchStripes =
		config.shape === TREE_SHAPES.birch
			? generateBirchStripes(
					trunkJunctions,
					trunkResult.junctionWidths,
					createPrng(config.seed + BIRCH_STRIPE_SEED_OFFSET),
				)
			: [];

	return {
		trunkQuads,
		trunkTriangles: [],
		branchGroups,
		canopyBlobs,
		fruitTriangles: [],
		stakeTriangles,
		fruitSlots: fruitSlotsResult,
		flowerSlots: flowerSlotsResult,
		showFallingLeaves: flags.addFallingLeaves,
		showSnowBlobs: flags.addSnowBlobs,
		snowAboveCanopy: flags.addSnowBlobs && !isTiered,
		birchStripes,
		anchors: anchorsWithTipDepths,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
		junctionData,
		envelopeBounds: finalCanopyBounds,
		canopyEnvelope,
	};
}
