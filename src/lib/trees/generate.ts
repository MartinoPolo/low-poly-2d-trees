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

// ---------------------------------------------------------------------------
// generateTreeCore helpers
// ---------------------------------------------------------------------------

import type { ShapeDefinition } from './shapes/shape_types.js';

interface BlobInitResult {
	blobs: Blob[];
	tiers: ReturnType<typeof generateTiers>;
	canopyBounds: { minX: number; minY: number; maxX: number; maxY: number };
}

function initializeCanopyShapes(
	rng: () => number,
	config: TreeConfig,
	shapeDef: ShapeDefinition,
	isTiered: boolean,
	isCustom: boolean,
	hasBranchingCanopy: boolean,
	canopyDelta: number,
	horizontalCanopyShift: number,
	effectiveTrunkTop: number,
	trunkJunctions: readonly { x: number; y: number }[],
): BlobInitResult {
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

	return { blobs, tiers, canopyBounds };
}

function classifyAllBranchZOrders(
	allBranches: readonly GeneratedBranch[],
	hasBranchingCanopy: boolean,
	trunkCenterX: number,
	config: TreeConfig,
): ('front' | 'back')[] {
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
	return branchZOrders;
}

interface BranchingCanopyResult {
	canopyBlobs: BlobGeometry[];
	blobs: Blob[];
	canopyEnvelope: { centerX: number; centerY: number; radiusX: number; radiusY: number };
}

function generateBranchingCanopyBlobs(
	rng: () => number,
	allBranches: GeneratedBranch[],
	branchZOrders: readonly ('front' | 'back')[],
	config: TreeConfig,
	shapeDef: {
		styleParameters: NonNullable<ShapeDefinition['styleParameters']>;
		envelopeDefaults: NonNullable<ShapeDefinition['envelopeDefaults']>;
	},
	trunkJunctions: readonly { x: number; y: number }[],
	canopyDelta: number,
): BranchingCanopyResult {
	const { styleParameters: styleParams, envelopeDefaults: envDefaults } = shapeDef;
	const topJunctionForEnv = trunkJunctions[trunkJunctions.length - 1]!;

	const envelope = computeCanopyEnvelope(
		{
			canopyCenterX: topJunctionForEnv.x,
			canopyCenterY: envDefaults.canopyCenterY + canopyDelta,
			baseRadiusX: envDefaults.baseRadiusX,
			baseRadiusY: envDefaults.baseRadiusY,
		},
		config.canopySize,
	);

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

	clusteredBlobsWithZ.sort((a, b) => b.blob.rx * b.blob.ry - a.blob.rx * a.blob.ry);

	const clusteredBlobs: Blob[] = clusteredBlobsWithZ.map((x) => x.blob);
	const clusterZOrders: ('front' | 'back')[] = clusteredBlobsWithZ.map((x) => x.zOrder);

	if (clusteredBlobs.length >= 2) {
		const areas = clusteredBlobs.map((b) => b.rx * b.ry);
		const maxArea = Math.max(...areas);
		const minArea = Math.min(...areas);
		const naturalRatio = Math.sqrt(maxArea / Math.max(0.01, minArea));
		if (naturalRatio < config.blobSizeVariance) {
			const remainingRatio = config.blobSizeVariance / naturalRatio;
			applyBlobSizeVariance(clusteredBlobs, remainingRatio);
		}
	}

	repositionIsolatedBlobs(clusteredBlobs);
	trimBranchTipsToBlobs(allBranches, clusteredBlobs);

	const smoothAcuteAngles = SHAPES_WITH_ACUTE_SMOOTHING.has(config.shape);
	const clusteredBlobGeos = generateBlobCanopy(
		rng,
		clusteredBlobs,
		config.polygonsPerBlob,
		smoothAcuteAngles,
		config,
	);

	const canopyBlobs = clusteredBlobGeos.map((geo, i) => ({
		...geo,
		zOrder: canopyZOrderToLayer(clusterZOrders[i] ?? 'front'),
	}));

	return { canopyBlobs, blobs: clusteredBlobs, canopyEnvelope: envelope };
}

// ---------------------------------------------------------------------------
// Core generation pipeline
// ---------------------------------------------------------------------------

function generateTreeCore(config: TreeConfig, flags: StageFlags): TreeGeometry {
	const rng = createPrng(config.seed);
	const shapeDef = getShapeDefinition(config.shape);
	const isTiered = TIERED_SHAPES.has(config.shape);
	const isCustom = config.shape === TREE_SHAPES.custom;
	const hasBranchingCanopy = !isTiered && shapeDef.styleParameters !== undefined;

	const effectiveTrunkTop = computeEffectiveTrunkTop(shapeDef, config.trunkHeight);
	const canopyDelta = effectiveTrunkTop - shapeDef.defaultTrunkTop;
	const trunkBottom = shapeDef.trunkBottom;

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

	// Initialize blobs/tiers + canopy bounds
	const canopyInit = initializeCanopyShapes(
		rng,
		config,
		shapeDef,
		isTiered,
		isCustom,
		hasBranchingCanopy,
		canopyDelta,
		horizontalCanopyShift,
		effectiveTrunkTop,
		trunkJunctions,
	);
	let { blobs } = canopyInit;
	const { tiers, canopyBounds } = canopyInit;

	// Clamp trunk top into canopy for non-branching shapes
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

	// Branch generation
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

		// REQ-EV2-G-02: Trunk centerline displacement opposite to branch at fork junctions
		if (branches.length > 0) {
			const displaced = [...trunkJunctions];
			for (const branch of branches) {
				if (branch.depth !== 1) {
					continue;
				}
				let closestIdx = 0;
				let closestDist = Infinity;
				for (let j = 0; j < displaced.length; j++) {
					const dist = Math.abs(displaced[j]!.y - branch.segment.y1);
					if (dist < closestDist) {
						closestDist = dist;
						closestIdx = j;
					}
				}
				const branchDirX = branch.segment.x2 - branch.segment.x1;
				const trunkWidthAtFork = shapeDef.trunkBaseWidth * thicknessScale;
				const widthFraction =
					trunkWidthAtFork > 0 ? branch.segment.widthStart / trunkWidthAtFork : 0;
				const displacementPx = 2 + widthFraction * 3;
				const displacementDir = branchDirX > 0 ? -1 : 1;
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

	// Extra branches for floating blobs + trunk-tip validation
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

	// Trunk quads
	const trunkResult = generateTrunkQuads(trunkJunctions, shapeDef, config, forkReductions);
	const trunkQuads = trunkResult.quads;

	// Z-order classification
	const trunkCenterX = sampleTrunkCenterX(
		trunkJunctions,
		(trunkJunctions[0]!.y + trunkJunctions[trunkJunctions.length - 1]!.y) / 2,
	);
	const branchZOrders = classifyAllBranchZOrders(
		allBranches,
		hasBranchingCanopy,
		trunkCenterX,
		config,
	);

	// Branch quads
	const branchGroups = generateAllBranchQuads(
		allBranches,
		config,
		trunkJunctions,
		trunkResult.junctionEdgePoints,
		branchZOrders,
	);

	// Canopy generation
	const smoothAcuteAngles = SHAPES_WITH_ACUTE_SMOOTHING.has(config.shape);
	let canopyBlobs: BlobGeometry[];
	let canopyEnvelope:
		| { centerX: number; centerY: number; radiusX: number; radiusY: number }
		| undefined;

	if (isTiered) {
		canopyBlobs = generateTierCanopy(
			rng,
			tiers,
			config.polygonsPerBlob,
			config,
			flags.addSnowBlobs,
		);
	} else if (hasBranchingCanopy) {
		const result = generateBranchingCanopyBlobs(
			rng,
			allBranches,
			branchZOrders,
			config,
			{
				styleParameters: shapeDef.styleParameters!,
				envelopeDefaults: shapeDef.envelopeDefaults!,
			},
			trunkJunctions,
			canopyDelta,
		);
		canopyBlobs = result.canopyBlobs;
		blobs = result.blobs;
		canopyEnvelope = result.canopyEnvelope;
	} else {
		canopyBlobs = generateBlobCanopy(
			rng,
			blobs,
			config.polygonsPerBlob,
			smoothAcuteAngles,
			config,
			flags.addSnowBlobs,
		);
	}

	// Final assembly
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
