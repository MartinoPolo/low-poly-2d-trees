import { generateTree } from './generate.js';
import { DEFAULT_TREE_CONFIG, SHAPE_DEFAULTS, TREE_SHAPES, TREE_STAGES } from './types.js';
import type {
	TreeGeometry,
	TreeConfig,
	Point2D,
	Triangle,
	Quad,
	BlobGeometry,
	BranchGeometry,
	TreeAnchors,
} from './types.js';
import type { OakPrdConfig } from './types/oak_prd_types.js';
import { OAK_PRD_VIEWBOX } from './types/oak_prd_types.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from './types.js';

const SCALE_X = OAK_PRD_VIEWBOX.width / VIEWBOX_WIDTH;
const SCALE_Y = OAK_PRD_VIEWBOX.height / VIEWBOX_HEIGHT;
const MAX_BLOB_COUNT = 15;
const MIN_BLOB_COUNT = 3;

function scalePoint(point: Point2D): Point2D {
	return { x: point.x * SCALE_X, y: point.y * SCALE_Y };
}

function scaleTriangle(tri: Triangle): Triangle {
	return {
		points: [scalePoint(tri.points[0]), scalePoint(tri.points[1]), scalePoint(tri.points[2])],
		color: tri.color,
		group: tri.group,
	};
}

function scaleQuad(quad: Quad): Quad {
	return {
		points: [
			scalePoint(quad.points[0]),
			scalePoint(quad.points[1]),
			scalePoint(quad.points[2]),
			scalePoint(quad.points[3]),
		],
		color: quad.color,
		group: quad.group,
	};
}

function scaleBranchGeometry(branch: BranchGeometry): BranchGeometry {
	return {
		quads: branch.quads.map(scaleQuad),
		junctionFills: branch.junctionFills.map(scaleQuad),
		origin: scalePoint(branch.origin),
		depth: branch.depth,
		parentIndex: branch.parentIndex,
	};
}

function scaleBlobGeometry(blob: BlobGeometry): BlobGeometry {
	return {
		triangles: blob.triangles.map(scaleTriangle),
		center: scalePoint(blob.center),
		depth: blob.depth,
		snowCap: blob.snowCap
			? { triangles: blob.snowCap.triangles.map(scaleTriangle) }
			: undefined,
	};
}

function scaleAnchors(anchors: TreeAnchors): TreeAnchors {
	return {
		trunkTop: scalePoint(anchors.trunkTop),
		trunkMiddle: scalePoint(anchors.trunkMiddle),
		trunkBase: scalePoint(anchors.trunkBase),
		crownCenter: scalePoint(anchors.crownCenter),
		crownTop: scalePoint(anchors.crownTop),
		roots: scalePoint(anchors.roots),
		branchTips: anchors.branchTips.map(scalePoint),
		fruitSlots: anchors.fruitSlots.map(scalePoint),
	};
}

function scaleGeometry(geometry: TreeGeometry): TreeGeometry {
	return {
		trunkQuads: geometry.trunkQuads.map(scaleQuad),
		trunkTriangles: geometry.trunkTriangles.map(scaleTriangle),
		branchGroups: geometry.branchGroups.map(scaleBranchGeometry),
		canopyBlobs: geometry.canopyBlobs.map(scaleBlobGeometry),
		fruitTriangles: geometry.fruitTriangles.map(scaleTriangle),
		stakeTriangles: geometry.stakeTriangles.map(scaleTriangle),
		fruitSlots: geometry.fruitSlots.map(scalePoint),
		flowerSlots: geometry.flowerSlots.map(scalePoint),
		showFallingLeaves: geometry.showFallingLeaves,
		showSnowBlobs: geometry.showSnowBlobs,
		snowAboveCanopy: geometry.snowAboveCanopy,
		birchStripes: [],
		anchors: scaleAnchors(geometry.anchors),
		viewBox: OAK_PRD_VIEWBOX,
	};
}

function computeBlobCount(issueCount: number): number {
	return Math.min(MAX_BLOB_COUNT, Math.max(MIN_BLOB_COUNT, Math.ceil(issueCount / 2)));
}

function applyCompletionRatio(
	canopyBlobs: readonly BlobGeometry[],
	completionRatio: number,
): readonly BlobGeometry[] {
	const totalBlobs = canopyBlobs.length;
	const completedCount = Math.floor(totalBlobs * completionRatio);

	const sortedIndices = [...Array(totalBlobs).keys()].sort((a, b) => {
		const blobA = canopyBlobs[a]!;
		const blobB = canopyBlobs[b]!;
		return blobA.center.y - blobB.center.y || blobA.center.x - blobB.center.x;
	});

	const rankOf = Array.from<number>({ length: totalBlobs });
	sortedIndices.forEach((originalIndex, rank) => {
		rankOf[originalIndex] = rank;
	});

	return canopyBlobs.map((blob, i) => {
		if (rankOf[i]! < completedCount) {
			return blob;
		}
		return { triangles: [], center: blob.center, depth: blob.depth };
	});
}

export function generateOakPrdTree(config: OakPrdConfig): TreeGeometry {
	const blobCount = computeBlobCount(config.issueCount);

	const treeConfig: TreeConfig = {
		...DEFAULT_TREE_CONFIG,
		...SHAPE_DEFAULTS.oak,
		shape: TREE_SHAPES.oak,
		stage: TREE_STAGES.leafy,
		seed: config.seed,
		blobCount,
		branchesLevel1Range: [Math.min(blobCount, 5), Math.min(blobCount + 1, 8)] as const,
	};

	const baseGeometry = generateTree(treeConfig);
	const scaledGeometry = scaleGeometry(baseGeometry);

	const processedBlobs = applyCompletionRatio(scaledGeometry.canopyBlobs, config.completionRatio);

	return {
		...scaledGeometry,
		canopyBlobs: processedBlobs,
	};
}
