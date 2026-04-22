import type { Point2D, Quad, BranchGeometry, TreeConfig } from '../types.js';
import { GEOMETRY_GROUPS } from '../types.js';
import { createPrng } from '../prng.js';
import { computeJunctionBisectors } from '../shapes.js';
import { computeStripColors } from '../lighting.js';
import { branchZOrderToLayer } from '../z_ordering.js';
import type { BranchSegment, GeneratedBranch } from '../shapes.js';
import {
	computeJunctionStripRatios,
	computeJunctionEdgePoints,
	BRANCH_SEED_OFFSET,
	CENTER_NORMAL_PERTURBATION_RANGE,
} from './trunk_geometry.js';

/** Twist attenuation per depth: L1=full, L2=50%, L3+=0% (REQ-EV2-B-03). */
const TWIST_ATTENUATION_BY_DEPTH: Record<number, number> = { 1: 1.0, 2: 0.5 };

/** Back-branch lightness offset (REQ-EV2-Z-02). */
const BACK_BRANCH_LIGHTNESS_OFFSET = -3;

/**
 * Edge vertices of a parent silhouette at a branch's fork height.
 * For L1 branches this is the trunk edge at the attachment junction.
 * Used for the shared-vertex fork (REQ-EV2-F-01): the branch's base outer
 * corners coincide exactly with these vertices instead of being offset by
 * the branch's own half-width along its perpendicular direction.
 */
interface ForkBasePoints {
	readonly left: Point2D;
	readonly right: Point2D;
}

function generateBranchQuadGroup(
	branch: BranchSegment,
	path: readonly Point2D[],
	config: TreeConfig,
	depth: number,
	parentIndex: number | null = null,
	zOrder?: 'front' | 'back',
	forkBasePoints?: ForkBasePoints,
): BranchGeometry {
	const dirX = branch.x2 - branch.x1;
	const dirY = branch.y2 - branch.y1;
	const length = Math.sqrt(dirX * dirX + dirY * dirY);
	const zOrderLayer = zOrder ? branchZOrderToLayer(zOrder) : undefined;
	if (length === 0) {
		return {
			quads: [],
			junctionFills: [],
			origin: { x: branch.x1, y: branch.y1 },
			depth,
			parentIndex,
			zOrder: zOrderLayer,
		};
	}

	// Per-branch PRNG seeded from position to ensure determinism
	const branchRng = createPrng(
		config.seed +
			Math.round(branch.x1 * 100) +
			Math.round(branch.y1 * 100) +
			BRANCH_SEED_OFFSET,
	);

	const centerPerturbX = (branchRng() - 0.5) * CENTER_NORMAL_PERTURBATION_RANGE;
	const centerPerturbY = (branchRng() - 0.5) * CENTER_NORMAL_PERTURBATION_RANGE;

	const branchLightnessOffset = zOrder === 'back' ? BACK_BRANCH_LIGHTNESS_OFFSET : 0;

	// REQ-EV2-B-02: L3+ uses single plain quad (no strip system)
	if (depth >= 3) {
		const perpX = -dirY / length;
		const perpY = dirX / length;
		const halfStart = branch.widthStart / 2;
		const halfEnd = branch.widthEnd / 2;
		const colors = computeStripColors({
			segmentDirectionX: dirX,
			segmentDirectionY: dirY,
			lightAngle: config.lightAngle,
			trunkHue: config.trunkHue,
			trunkSaturation: config.trunkSaturation,
			trunkLightness: config.trunkLightness,
			centerPerturbationX: centerPerturbX,
			centerPerturbationY: centerPerturbY,
			stripCount: 1,
			lightnessOffset: branchLightnessOffset,
		});
		const quads: Quad[] = [
			{
				points: [
					{ x: branch.x1 + perpX * halfStart, y: branch.y1 + perpY * halfStart },
					{ x: branch.x1 - perpX * halfStart, y: branch.y1 - perpY * halfStart },
					{ x: branch.x2 - perpX * halfEnd, y: branch.y2 - perpY * halfEnd },
					{ x: branch.x2 + perpX * halfEnd, y: branch.y2 + perpY * halfEnd },
				],
				color: colors[0]!,
				group: GEOMETRY_GROUPS.branch,
			},
		];
		return {
			quads,
			junctionFills: [],
			origin: { x: branch.x1, y: branch.y1 },
			depth,
			parentIndex,
			zOrder: zOrderLayer,
		};
	}

	// REQ-EV2-B-01: L1/L2 use variable strip count with junction continuity
	const stripCount = config.trunkStripCount;
	const twistAttenuation = TWIST_ATTENUATION_BY_DEPTH[depth] ?? 0;
	const effectiveTwist = config.trunkTwist * twistAttenuation;
	const junctionCount = path.length;

	// Compute strip ratios for all junctions (reuses trunk strip ratio model)
	const branchStripRatios = computeJunctionStripRatios(
		config.seed + Math.round(branch.x1 * 100) + Math.round(branch.y1 * 100),
		junctionCount,
		stripCount,
		effectiveTwist,
	);

	// Compute bisector perpendicular directions at each junction
	const bisectors = computeJunctionBisectors(path);

	// Compute widths at each junction (linear taper from widthStart to widthEnd)
	const junctionWidths: number[] = [];
	for (let j = 0; j < junctionCount; j++) {
		const t = junctionCount > 1 ? j / (junctionCount - 1) : 0;
		junctionWidths.push(branch.widthStart + t * (branch.widthEnd - branch.widthStart));
	}

	// Compute shared junction edge points (same model as trunk — REQ-EV2-J-02)
	const branchJunctionEdgePoints = computeJunctionEdgePoints(
		path,
		bisectors,
		junctionWidths,
		branchStripRatios,
		stripCount,
	);

	// REQ-EV2-F-01: shared-vertex fork at base junction. If forkBasePoints are
	// provided (L1 branch snapped to trunk), override junction[0]'s edge points
	// with the parent silhouette's vertices, interpolating inner strip splits
	// along the base line using the branch's own strip ratios.
	if (forkBasePoints) {
		const sharedBase: Point2D[] = [forkBasePoints.left];
		let accRatio = 0;
		for (let s = 0; s < stripCount - 1; s++) {
			accRatio += branchStripRatios[0]![s]!;
			sharedBase.push({
				x:
					forkBasePoints.left.x +
					(forkBasePoints.right.x - forkBasePoints.left.x) * accRatio,
				y:
					forkBasePoints.left.y +
					(forkBasePoints.right.y - forkBasePoints.left.y) * accRatio,
			});
		}
		sharedBase.push(forkBasePoints.right);
		branchJunctionEdgePoints[0] = sharedBase;
	}

	const quads: Quad[] = [];

	// Build quads between adjacent junctions, iterating like trunk
	for (let i = 0; i < junctionCount - 1; i++) {
		const bottomPoints = branchJunctionEdgePoints[i]!;
		const topPoints = branchJunctionEdgePoints[i + 1]!;

		const segDirX = path[i + 1]!.x - path[i]!.x;
		const segDirY = path[i + 1]!.y - path[i]!.y;

		// Per-segment strip colors (consistent lighting per segment)
		const stripColors = computeStripColors({
			segmentDirectionX: segDirX,
			segmentDirectionY: segDirY,
			lightAngle: config.lightAngle,
			trunkHue: config.trunkHue,
			trunkSaturation: config.trunkSaturation,
			trunkLightness: config.trunkLightness,
			centerPerturbationX: centerPerturbX,
			centerPerturbationY: centerPerturbY,
			stripCount,
			lightnessOffset: branchLightnessOffset,
		});

		for (let s = 0; s < stripCount; s++) {
			quads.push({
				points: [topPoints[s]!, topPoints[s + 1]!, bottomPoints[s + 1]!, bottomPoints[s]!],
				color: stripColors[s]!,
				group: GEOMETRY_GROUPS.branch,
			});
		}
	}

	// REQ-EV2-F-02 (updated, Issue #104): no collar by default. Shared-vertex
	// fork closes the junction geometrically; junctionFills retained as an
	// empty field for renderer/type stability and future optional fills.
	return {
		quads,
		junctionFills: [],
		origin: { x: branch.x1, y: branch.y1 },
		depth,
		parentIndex,
		zOrder: zOrderLayer,
	};
}

/**
 * For each L1 branch, resolve the trunk edge vertices at its attachment height
 * so the branch can emit a shared-vertex fork base (REQ-EV2-F-01). Matching is
 * by exact y (L1 branches are placed at a specific trunk junction, and trunk
 * displacement preserves y while shifting x). Falls back to undefined if no
 * junction matches — the branch then uses the default perp offset.
 */
function resolveL1ForkBasePoints(
	branch: GeneratedBranch,
	trunkJunctions: readonly Point2D[],
	junctionEdgePoints: readonly (readonly Point2D[])[],
	stripCount: number,
): ForkBasePoints | undefined {
	if (branch.depth !== 1) {
		return undefined;
	}
	const y = branch.segment.y1;
	let bestIdx = -1;
	let bestDist = Infinity;
	for (let j = 0; j < trunkJunctions.length; j++) {
		const dist = Math.abs(trunkJunctions[j]!.y - y);
		if (dist < bestDist) {
			bestDist = dist;
			bestIdx = j;
		}
	}
	// Y must match exactly (branches attach at discrete trunk junctions).
	if (bestIdx < 0 || bestDist > 1e-6) {
		return undefined;
	}
	const edgePoints = junctionEdgePoints[bestIdx];
	if (edgePoints === undefined || edgePoints.length < stripCount + 1) {
		return undefined;
	}
	return {
		left: edgePoints[0]!,
		right: edgePoints[stripCount]!,
	};
}

export function generateAllBranchQuads(
	branches: readonly GeneratedBranch[],
	config: TreeConfig,
	trunkJunctions: readonly Point2D[],
	junctionEdgePoints: readonly (readonly Point2D[])[],
	branchZOrders?: readonly ('front' | 'back')[],
): BranchGeometry[] {
	const stripCount = config.trunkStripCount;
	return branches.map((branch, i) =>
		generateBranchQuadGroup(
			branch.segment,
			branch.path,
			config,
			branch.depth,
			branch.parentIndex,
			branchZOrders?.[i],
			resolveL1ForkBasePoints(branch, trunkJunctions, junctionEdgePoints, stripCount),
		),
	);
}
