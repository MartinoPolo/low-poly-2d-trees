import { describe, it, expect } from 'vitest';
import {
	buildTrunkPath,
	sampleTrunkCenterX,
	isPointInTrunkPath,
	raySegmentEllipseIntersection,
	raySegmentTriangleIntersection,
	computeVisibleBranchLength,
	branchesOverlap,
	resolveBranchLengthRange,
	generateBranches,
	getShapeDefinition,
	computeEffectiveTrunkTop,
	generateCustomBlobs,
	growCustomBlobs,
	CUSTOM_BLOB_CANOPY_CENTER_X,
	CUSTOM_BLOB_CANOPY_CENTER_Y,
	CUSTOM_BLOB_SPREAD_RADIUS,
	DRAWS_PER_BLOB,
	type Blob,
	type BranchSegment,
} from './shapes.js';
import { BOUNDARY_KINDS } from './boundaries.js';
import { createPrng } from './prng.js';
import {
	CUSTOM_BLOB_BOUNDARY_KINDS,
	CUSTOM_BLOB_DEFAULT,
	DEFAULT_TREE_CONFIG,
	VIEWBOX_HEIGHT,
	VIEWBOX_WIDTH,
	type CustomBlob,
} from './types.js';
import type { Tier, TreeConfig } from './types.js';

// ============================================================================
// REQ-T-11 / REQ-T-12: direct unit tests for buildTrunkPath
// ============================================================================

describe('buildTrunkPath', () => {
	const trunkBottomY = 285;
	const trunkTopY = 135;
	const trunkHeightPx = trunkBottomY - trunkTopY;
	const baseX = VIEWBOX_WIDTH / 2;

	it('returns base and top junctions with segments+1 points', () => {
		const rng = createPrng(42);
		const path = buildTrunkPath(rng, 0, 3, 0, trunkTopY, trunkBottomY);
		expect(path).toHaveLength(4);
		expect(path[0]).toEqual({ x: baseX, y: trunkBottomY });
		expect(path[3]!.y).toBeCloseTo(trunkTopY, 10);
	});

	it('lean=0, crookedness=0, N=1 is a perfectly vertical single segment', () => {
		const path = buildTrunkPath(createPrng(42), 0, 1, 0, trunkTopY, trunkBottomY);
		expect(path).toHaveLength(2);
		expect(path[0]!.x).toBe(baseX);
		expect(path[1]!.x).toBe(baseX);
	});

	it('lean=30, N=1 satisfies leanPx = tan(30°) × trunkHeight', () => {
		const path = buildTrunkPath(createPrng(42), 30, 1, 0, trunkTopY, trunkBottomY);
		const expectedDx = Math.tan((30 * Math.PI) / 180) * trunkHeightPx;
		expect(path[1]!.x - path[0]!.x).toBeCloseTo(expectedDx, 10);
	});

	it('REQ-T-12c: first segment angle equals lean regardless of crookedness', () => {
		// Build two paths: one with 1 segment, one with 5 segments, both
		// crookedness=0. Top X must match exactly since no jitter applies.
		const p1 = buildTrunkPath(createPrng(42), 25, 1, 0, trunkTopY, trunkBottomY);
		const p5 = buildTrunkPath(createPrng(42), 25, 5, 0, trunkTopY, trunkBottomY);
		expect(p5[5]!.x).toBeCloseTo(p1[1]!.x, 10);
	});

	it('REQ-T-12: N=1 ignores crookedness (straight trunk)', () => {
		const p = buildTrunkPath(createPrng(42), 0, 1, 100, trunkTopY, trunkBottomY);
		expect(p[1]!.x).toBe(baseX);
	});

	it('REQ-T-12: N>1 with crookedness=0 is straight (no jitter)', () => {
		const p = buildTrunkPath(createPrng(42), 0, 5, 0, trunkTopY, trunkBottomY);
		for (const j of p) {
			expect(j.x).toBeCloseTo(baseX, 10);
		}
	});

	it('REQ-T-12b: junction angle jitter stays within lerp(5°, 20°) per crookedness', () => {
		// With crookedness=100, maxJitter=20°. Measure the angle delta between
		// consecutive segments; each must be ≤ 20° in magnitude.
		const maxJitterDeg = 20;
		const rng = createPrng(42);
		const p = buildTrunkPath(rng, 0, 5, 100, trunkTopY, trunkBottomY);
		const segAngles: number[] = [];
		for (let i = 0; i < p.length - 1; i++) {
			const dx = p[i + 1]!.x - p[i]!.x;
			const dy = p[i + 1]!.y - p[i]!.y; // negative (going up)
			segAngles.push(Math.atan2(dx, -dy));
		}
		for (let i = 1; i < segAngles.length; i++) {
			const deltaDeg = ((segAngles[i]! - segAngles[i - 1]!) * 180) / Math.PI;
			expect(Math.abs(deltaDeg)).toBeLessThanOrEqual(maxJitterDeg + 1e-9);
		}
	});

	it('REQ-T-12b: crookedness=50 keeps per-junction jitter within 12.5°', () => {
		// maxJitter for 50 = lerp(5, 20, 0.5) = 12.5°
		const maxJitterDeg = 12.5;
		const p = buildTrunkPath(createPrng(42), 0, 5, 50, trunkTopY, trunkBottomY);
		const segAngles: number[] = [];
		for (let i = 0; i < p.length - 1; i++) {
			const dx = p[i + 1]!.x - p[i]!.x;
			const dy = p[i + 1]!.y - p[i]!.y;
			segAngles.push(Math.atan2(dx, -dy));
		}
		for (let i = 1; i < segAngles.length; i++) {
			const deltaDeg = ((segAngles[i]! - segAngles[i - 1]!) * 180) / Math.PI;
			expect(Math.abs(deltaDeg)).toBeLessThanOrEqual(maxJitterDeg + 1e-9);
		}
	});

	it('same seed + config produces identical trunk paths', () => {
		const p1 = buildTrunkPath(createPrng(42), 15, 5, 100, trunkTopY, trunkBottomY);
		const p2 = buildTrunkPath(createPrng(42), 15, 5, 100, trunkTopY, trunkBottomY);
		expect(p1).toEqual(p2);
	});

	it('trunkSegments is clamped to [1, 5]', () => {
		const p0 = buildTrunkPath(createPrng(42), 0, 0, 0, trunkTopY, trunkBottomY);
		expect(p0).toHaveLength(2);
		const p9 = buildTrunkPath(createPrng(42), 0, 9, 0, trunkTopY, trunkBottomY);
		expect(p9).toHaveLength(6);
	});
});

describe('sampleTrunkCenterX', () => {
	it('clamps to base junction x when y is at or below base', () => {
		const junctions = [
			{ x: 100, y: 285 },
			{ x: 120, y: 135 },
		];
		expect(sampleTrunkCenterX(junctions, 300)).toBe(100);
		expect(sampleTrunkCenterX(junctions, 285)).toBe(100);
	});

	it('clamps to top junction x when y is at or above top', () => {
		const junctions = [
			{ x: 100, y: 285 },
			{ x: 120, y: 135 },
		];
		expect(sampleTrunkCenterX(junctions, 100)).toBe(120);
		expect(sampleTrunkCenterX(junctions, 135)).toBe(120);
	});

	it('linearly interpolates within a segment', () => {
		const junctions = [
			{ x: 100, y: 285 },
			{ x: 200, y: 135 },
		];
		// Midpoint y = 210, expected x = 150
		expect(sampleTrunkCenterX(junctions, 210)).toBe(150);
	});

	it('selects the correct segment in a multi-segment polyline', () => {
		const junctions = [
			{ x: 100, y: 285 },
			{ x: 110, y: 235 },
			{ x: 90, y: 185 },
			{ x: 130, y: 135 },
		];
		expect(sampleTrunkCenterX(junctions, 260)).toBeCloseTo(105, 10);
		expect(sampleTrunkCenterX(junctions, 210)).toBeCloseTo(100, 10);
		expect(sampleTrunkCenterX(junctions, 160)).toBeCloseTo(110, 10);
	});
});

describe('isPointInTrunkPath', () => {
	const junctions = [
		{ x: 100, y: 285 },
		{ x: 100, y: 135 },
	];

	it('returns true for a point inside the trunk', () => {
		expect(isPointInTrunkPath(100, 200, junctions, 10, 20)).toBe(true);
	});

	it('returns false for a point above the trunk top', () => {
		expect(isPointInTrunkPath(100, 100, junctions, 10, 20)).toBe(false);
	});

	it('returns false for a point below the trunk base', () => {
		expect(isPointInTrunkPath(100, 300, junctions, 10, 20)).toBe(false);
	});

	it('uses linearly interpolated width by y', () => {
		// At midpoint: width = (10 + 20) / 2 = 15, so halfWidth = 7.5
		expect(isPointInTrunkPath(107, 210, junctions, 10, 20)).toBe(true);
		expect(isPointInTrunkPath(108, 210, junctions, 10, 20)).toBe(false);
	});
});

// ============================================================================
// Geometry helpers for branch visibility (issue #7)
// ============================================================================

describe('raySegmentEllipseIntersection', () => {
	it('horizontal segment through ellipse center returns diameter interval', () => {
		// Segment (0,0)-(20,0), ellipse center (10,0) rx=5 ry=3
		// Enters at x=5 (t=0.25), exits at x=15 (t=0.75)
		const result = raySegmentEllipseIntersection(0, 0, 20, 0, 10, 0, 5, 3);
		expect(result).not.toBeNull();
		expect(result![0]).toBeCloseTo(0.25, 10);
		expect(result![1]).toBeCloseTo(0.75, 10);
	});

	it('segment fully outside ellipse returns null', () => {
		const result = raySegmentEllipseIntersection(0, 100, 20, 100, 10, 0, 5, 3);
		expect(result).toBeNull();
	});

	it('segment fully inside ellipse returns [0,1]', () => {
		// Segment (9,0)-(11,0) is inside ellipse center (10,0) rx=5 ry=3
		const result = raySegmentEllipseIntersection(9, 0, 11, 0, 10, 0, 5, 3);
		expect(result).not.toBeNull();
		expect(result![0]).toBe(0);
		expect(result![1]).toBe(1);
	});

	it('segment tangent to ellipse yields tEnter ≈ tExit without NaN', () => {
		// Horizontal segment tangent to the top of the ellipse (y = ry = 3).
		const result = raySegmentEllipseIntersection(0, 3, 20, 3, 10, 0, 5, 3);
		expect(result).not.toBeNull();
		expect(Number.isNaN(result![0])).toBe(false);
		expect(Number.isNaN(result![1])).toBe(false);
		expect(Math.abs(result![1] - result![0])).toBeLessThan(1e-6);
	});

	it('clips tEnter/tExit to [0,1] when segment starts inside', () => {
		// Start inside ellipse at (10,0), exit to the right past x=15
		const result = raySegmentEllipseIntersection(10, 0, 30, 0, 10, 0, 5, 3);
		expect(result).not.toBeNull();
		expect(result![0]).toBe(0);
		expect(result![1]).toBeCloseTo(0.25, 10);
	});
});

describe('raySegmentTriangleIntersection', () => {
	// Simple axis-aligned triangle in Tier form (tipX,tipY is top, base at bottom)
	const tier: Tier = {
		tipX: 10,
		tipY: 0,
		baseLeftX: 0,
		baseLeftY: 10,
		baseRightX: 20,
		baseRightY: 10,
	};

	it('segment passing through triangle center returns clipped interval', () => {
		// Vertical segment through x=10 from y=-5 to y=15 fully spans the triangle vertically.
		// Enters at y=0 (t=0.25), exits at y=10 (t=0.75)
		const result = raySegmentTriangleIntersection(10, -5, 10, 15, tier);
		expect(result).not.toBeNull();
		expect(result![0]).toBeCloseTo(0.25, 6);
		expect(result![1]).toBeCloseTo(0.75, 6);
	});

	it('segment fully outside triangle returns null', () => {
		const result = raySegmentTriangleIntersection(100, 100, 200, 200, tier);
		expect(result).toBeNull();
	});

	it('horizontal segment crossing triangle midline clips correctly', () => {
		// Segment from (-5, 5) to (25, 5) crosses the triangle at y=5
		// At y=5, left edge x = 5, right edge x = 15 (triangle halfway down)
		// So enters at x=5 (t = 10/30 = 0.333), exits at x=15 (t = 20/30 = 0.666)
		const result = raySegmentTriangleIntersection(-5, 5, 25, 5, tier);
		expect(result).not.toBeNull();
		expect(result![0]).toBeCloseTo(10 / 30, 6);
		expect(result![1]).toBeCloseTo(20 / 30, 6);
	});
});

describe('computeVisibleBranchLength', () => {
	const makeBranch = (x1: number, y1: number, x2: number, y2: number): BranchSegment => ({
		x1,
		y1,
		x2,
		y2,
		widthStart: 2,
		widthEnd: 1,
	});

	it('returns full length when branch is fully outside any blob', () => {
		const branch = makeBranch(0, 0, 100, 0);
		const blobs: Blob[] = [
			{ cx: 500, cy: 500, rx: 10, ry: 10, boundary: BOUNDARY_KINDS.circle },
		];
		const visible = computeVisibleBranchLength(branch, blobs, []);
		expect(visible).toBeCloseTo(100, 10);
	});

	it('returns 0 when branch is fully inside a blob', () => {
		const branch = makeBranch(95, 100, 105, 100);
		const blobs: Blob[] = [
			{ cx: 100, cy: 100, rx: 50, ry: 50, boundary: BOUNDARY_KINDS.circle },
		];
		const visible = computeVisibleBranchLength(branch, blobs, []);
		expect(visible).toBeCloseTo(0, 6);
	});

	it('returns half length when branch is half-covered by one blob', () => {
		// Segment from (0,0) to (20,0); blob center (15,0), rx=5, ry=5 covers x in [10, 20]
		const branch = makeBranch(0, 0, 20, 0);
		const blobs: Blob[] = [{ cx: 15, cy: 0, rx: 5, ry: 5, boundary: BOUNDARY_KINDS.circle }];
		const visible = computeVisibleBranchLength(branch, blobs, []);
		expect(visible).toBeCloseTo(10, 6);
	});

	it('does not double-count overlapping blobs', () => {
		// Two blobs covering same region at x in [10,20]
		const branch = makeBranch(0, 0, 20, 0);
		const blobs: Blob[] = [
			{ cx: 15, cy: 0, rx: 5, ry: 5, boundary: BOUNDARY_KINDS.circle },
			{ cx: 15, cy: 0, rx: 5, ry: 5, boundary: BOUNDARY_KINDS.circle },
		];
		const visible = computeVisibleBranchLength(branch, blobs, []);
		expect(visible).toBeCloseTo(10, 6);
	});
});

describe('branchesOverlap', () => {
	const makeBranch = (x1: number, y1: number, x2: number, y2: number, w = 4): BranchSegment => ({
		x1,
		y1,
		x2,
		y2,
		widthStart: w,
		widthEnd: w,
	});

	it('returns false for two parallel non-overlapping branches', () => {
		const a = makeBranch(0, 0, 100, 0);
		const b = makeBranch(0, 50, 100, 50);
		expect(branchesOverlap(a, b)).toBe(false);
	});

	it('returns true for two crossing thick branches', () => {
		const a = makeBranch(0, 50, 100, 50);
		const b = makeBranch(50, 0, 50, 100);
		expect(branchesOverlap(a, b)).toBe(true);
	});

	it('returns true for two coincident branches', () => {
		const a = makeBranch(0, 0, 100, 0);
		const b = makeBranch(0, 0, 100, 0);
		expect(branchesOverlap(a, b)).toBe(true);
	});
});

describe('resolveBranchLengthRange', () => {
	it('variance=0 collapses range to midpoint for both trunk and sub', () => {
		const trunk = resolveBranchLengthRange(20, 40, 100, 0, true);
		expect(trunk.min).toBeCloseTo(30, 10);
		expect(trunk.max).toBeCloseTo(30, 10);

		const sub = resolveBranchLengthRange(20, 40, 100, 0, false);
		expect(sub.min).toBeCloseTo(30, 10);
		expect(sub.max).toBeCloseTo(30, 10);
	});

	it('variance=100 branchLength=100 splits into upper/lower halves', () => {
		const trunk = resolveBranchLengthRange(20, 40, 100, 100, true);
		expect(trunk.min).toBeCloseTo(30, 10);
		expect(trunk.max).toBeCloseTo(40, 10);

		const sub = resolveBranchLengthRange(20, 40, 100, 100, false);
		expect(sub.min).toBeCloseTo(20, 10);
		expect(sub.max).toBeCloseTo(30, 10);
	});

	it('branchLength=200 scales midpoint and half-width', () => {
		const trunk = resolveBranchLengthRange(20, 40, 200, 100, true);
		expect(trunk.min).toBeCloseTo(60, 10);
		expect(trunk.max).toBeCloseTo(80, 10);

		const sub = resolveBranchLengthRange(20, 40, 200, 100, false);
		expect(sub.min).toBeCloseTo(40, 10);
		expect(sub.max).toBeCloseTo(60, 10);
	});
});

// ============================================================================
// generateBranches integration — visibility / crossing / retry invariants
// ============================================================================

function makeConfig(overrides: Partial<TreeConfig> = {}): TreeConfig {
	return { ...DEFAULT_TREE_CONFIG, ...overrides };
}

/**
 * Build the same inputs that generate.ts passes to generateBranches for oak,
 * so tests can call it directly and inspect the raw branch list.
 */
function setupOakBranchInputs(config: TreeConfig): {
	rng: () => number;
	trunkTop: number;
	trunkBottom: number;
	trunkTopWidth: number;
	trunkJunctions: { x: number; y: number }[];
	blobs: Blob[];
} {
	const shapeDef = getShapeDefinition('oak');
	const effectiveTrunkTop = computeEffectiveTrunkTop(shapeDef, config.trunkHeight);
	const trunkBottom = shapeDef.trunkBottom;
	const rng = createPrng(config.seed);
	const trunkJunctions = buildTrunkPath(
		rng,
		config.trunkLean,
		config.trunkSegments,
		config.trunkCrookedness,
		effectiveTrunkTop,
		trunkBottom,
	);
	const blobs = shapeDef.generateBlobs(rng, config.blobCount);
	return {
		rng,
		trunkTop: trunkJunctions[trunkJunctions.length - 1]!.y,
		trunkBottom,
		trunkTopWidth: shapeDef.trunkTopWidth * (config.trunkThickness / 100),
		trunkJunctions,
		blobs,
	};
}

describe('generateBranches — visibility & crossing invariants', () => {
	it('every trunk-origin branch has visible length ≥ 15', () => {
		const config = makeConfig({
			shape: 'oak',
			branchCount: 6,
			seed: 7,
			trunkBranchRatio: 100,
			branchDepth: 1,
		});
		const { rng, trunkTop, trunkBottom, trunkTopWidth, trunkJunctions, blobs } =
			setupOakBranchInputs(config);
		const branches = generateBranches(
			rng,
			trunkTop,
			trunkBottom,
			trunkTopWidth,
			config,
			trunkJunctions,
			blobs,
		);
		expect(branches.length).toBeGreaterThan(0);
		for (const b of branches) {
			const visible = computeVisibleBranchLength(b, blobs, []);
			expect(visible).toBeGreaterThanOrEqual(15);
		}
	});

	it('forked sub-branches exist at depth >= 2', () => {
		const config = makeConfig({
			shape: 'oak',
			branchCount: 10,
			seed: 42,
			trunkBranchRatio: 50,
			branchDepth: 2,
		});
		const { rng, trunkTop, trunkBottom, trunkTopWidth, trunkJunctions, blobs } =
			setupOakBranchInputs(config);
		const branches = generateBranches(
			rng,
			trunkTop,
			trunkBottom,
			trunkTopWidth,
			config,
			trunkJunctions,
			blobs,
		);
		// At depth 2, forks should be generated beyond trunk-origin branches
		const trunkBranchCount = Math.max(1, Math.round(10 * 0.5));
		expect(branches.length).toBeGreaterThan(trunkBranchCount);
	});

	it('no branch crosses the trunk center axis (sign invariant)', () => {
		const config = makeConfig({ shape: 'oak', branchCount: 8, seed: 123 });
		const { rng, trunkTop, trunkBottom, trunkTopWidth, trunkJunctions, blobs } =
			setupOakBranchInputs(config);
		const branches = generateBranches(
			rng,
			trunkTop,
			trunkBottom,
			trunkTopWidth,
			config,
			trunkJunctions,
			blobs,
		);
		expect(branches.length).toBeGreaterThan(0);
		for (const b of branches) {
			// A branch either stays on one side of the trunk axis or ends on the
			// axis. Use the midpoint as the reference side (trunk-origin branches
			// have startX === centerX so the start alone cannot tell us).
			const midX = (b.x1 + b.x2) / 2;
			const midY = (b.y1 + b.y2) / 2;
			const centerAtMid = sampleTrunkCenterX(trunkJunctions, midY);
			const centerAtEnd = sampleTrunkCenterX(trunkJunctions, b.y2);
			const midSide = Math.sign(midX - centerAtMid);
			const endSide = Math.sign(b.x2 - centerAtEnd);
			if (midSide !== 0) {
				expect(endSide === 0 || endSide === midSide).toBe(true);
			} else {
				// Midpoint exactly on axis is allowed (e.g., very short branch).
				expect(true).toBe(true);
			}
		}
	});

	it('branches.length never exceeds config.branchCount', () => {
		const config = makeConfig({ shape: 'oak', branchCount: 6, seed: 5 });
		const { rng, trunkTop, trunkBottom, trunkTopWidth, trunkJunctions, blobs } =
			setupOakBranchInputs(config);
		const branches = generateBranches(
			rng,
			trunkTop,
			trunkBottom,
			trunkTopWidth,
			config,
			trunkJunctions,
			blobs,
		);
		expect(branches.length).toBeLessThanOrEqual(config.branchCount);
	});

	it('pathological blob covering whole tree completes fast and returns few branches', () => {
		const config = makeConfig({ shape: 'oak', branchCount: 8, seed: 9 });
		const setup = setupOakBranchInputs(config);
		// Replace blobs with a single huge blob covering the whole viewbox.
		const giantBlob: Blob[] = [
			{ cx: 100, cy: 150, rx: 500, ry: 500, boundary: BOUNDARY_KINDS.circle },
		];
		const start = Date.now();
		const branches = generateBranches(
			setup.rng,
			setup.trunkTop,
			setup.trunkBottom,
			setup.trunkTopWidth,
			config,
			setup.trunkJunctions,
			giantBlob,
		);
		const elapsed = Date.now() - start;
		expect(elapsed).toBeLessThan(1000);
		expect(branches.length).toBeLessThanOrEqual(config.branchCount);
	});

	it('branchLength=200 produces meaningfully longer max branch than branchLength=100', () => {
		const base = makeConfig({ shape: 'oak', branchCount: 6, seed: 77 });
		const short = setupOakBranchInputs(base);
		const shortBranches = generateBranches(
			short.rng,
			short.trunkTop,
			short.trunkBottom,
			short.trunkTopWidth,
			base,
			short.trunkJunctions,
			short.blobs,
		);
		const longConfig = { ...base, branchLength: 200 };
		const longInputs = setupOakBranchInputs(longConfig);
		const longBranches = generateBranches(
			longInputs.rng,
			longInputs.trunkTop,
			longInputs.trunkBottom,
			longInputs.trunkTopWidth,
			longConfig,
			longInputs.trunkJunctions,
			longInputs.blobs,
		);
		const branchLen = (b: BranchSegment): number => Math.hypot(b.x2 - b.x1, b.y2 - b.y1);
		const maxShort = Math.max(...shortBranches.map(branchLen));
		const maxLong = Math.max(...longBranches.map(branchLen));
		expect(maxLong).toBeGreaterThan(maxShort * 1.2);
	});

	it('same seed + same config → identical branch list across two runs', () => {
		const config = makeConfig({ shape: 'oak', branchCount: 6, seed: 33 });
		const a = setupOakBranchInputs(config);
		const bA = generateBranches(
			a.rng,
			a.trunkTop,
			a.trunkBottom,
			a.trunkTopWidth,
			config,
			a.trunkJunctions,
			a.blobs,
		);
		const b = setupOakBranchInputs(config);
		const bB = generateBranches(
			b.rng,
			b.trunkTop,
			b.trunkBottom,
			b.trunkTopWidth,
			config,
			b.trunkJunctions,
			b.blobs,
		);
		expect(bA).toEqual(bB);
	});
});

// ============================================================================
// REQ-C-18: oak non-primary blobs distributed radially (full 360°)
// ============================================================================

describe('REQ-C-18: oak radial blob distribution', () => {
	const shapeDef = getShapeDefinition('oak');
	const W = VIEWBOX_WIDTH;
	const minAxisDistance = W * 0.15;

	it('at most one blob sits on the trunk axis (the primary anchor)', () => {
		// REQ-C-18: non-primary blobs are pushed at least 0.15·W off-axis.
		// The primary blob is kept anchored on the axis. Because
		// ensureLargestBlobInBottomHalf may swap array positions, we check the
		// overall count of axis-hugging blobs rather than index 1..N.
		for (let seed = 1; seed <= 40; seed++) {
			const rng = createPrng(seed);
			const blobs = shapeDef.generateBlobs(rng, 6);
			expect(blobs.length).toBe(6);
			const onAxisCount = blobs.filter(
				(b) => Math.abs(b.cx - W / 2) < minAxisDistance - 1e-9,
			).length;
			expect(onAxisCount).toBeLessThanOrEqual(1);
		}
	});

	it('across multiple seeds, at least one non-primary blob lies above the primary (cy<primary.cy)', () => {
		// Full 360° sampling must allow blobs above the primary; the old
		// half-axis distribution only placed them in a 180° arc below.
		let sawAbove = false;
		for (let seed = 1; seed <= 60 && !sawAbove; seed++) {
			const rng = createPrng(seed);
			const blobs = shapeDef.generateBlobs(rng, 6);
			const primary = blobs[0]!;
			for (let i = 1; i < blobs.length; i++) {
				if (blobs[i]!.cy < primary.cy) {
					sawAbove = true;
					break;
				}
			}
		}
		expect(sawAbove).toBe(true);
	});

	it('primary blob stays anchored on the trunk axis', () => {
		const rng = createPrng(42);
		const blobs = shapeDef.generateBlobs(rng, 5);
		expect(blobs[0]!.cx).toBe(W / 2);
	});

	it('non-primary blobs land on both sides of the trunk across seeds', () => {
		let sawLeft = false;
		let sawRight = false;
		for (let seed = 1; seed <= 40 && !(sawLeft && sawRight); seed++) {
			const rng = createPrng(seed);
			const blobs = shapeDef.generateBlobs(rng, 6);
			for (let i = 1; i < blobs.length; i++) {
				if (blobs[i]!.cx < W / 2) {
					sawLeft = true;
				}
				if (blobs[i]!.cx > W / 2) {
					sawRight = true;
				}
			}
		}
		expect(sawLeft && sawRight).toBe(true);
	});

	it('every blob carries boundary=circle', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 5);
		for (const b of blobs) {
			expect(b.boundary).toBe(BOUNDARY_KINDS.circle);
		}
	});
});

// ============================================================================
// REQ-C-19: birch canopy rx doubled (W*0.12 .. W*0.24)
// ============================================================================

describe('REQ-C-19: birch canopy rx range (#62 redesign)', () => {
	const shapeDef = getShapeDefinition('birch');
	const W = VIEWBOX_WIDTH;

	it('birch blobs at seed 42 include at least one rx ≥ W*0.1', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 6);
		const hasMinRx = blobs.some((b) => b.rx >= W * 0.1 - 1e-9);
		expect(hasMinRx).toBe(true);
	});

	it('all birch blobs have rx within [W*0.1, W*0.22]', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 6);
		for (const b of blobs) {
			expect(b.rx).toBeGreaterThanOrEqual(W * 0.1 - 1e-9);
			expect(b.rx).toBeLessThanOrEqual(W * 0.22 + 1e-9);
		}
	});

	it('across many seeds, max rx approaches W*0.2', () => {
		let maxRx = -Infinity;
		for (let seed = 1; seed <= 100; seed++) {
			const blobs = shapeDef.generateBlobs(createPrng(seed), 6);
			for (const b of blobs) {
				if (b.rx > maxRx) {
					maxRx = b.rx;
				}
			}
		}
		expect(maxRx).toBeGreaterThan(W * 0.18);
	});
});

// ============================================================================
// REQ-C-20: fir canopy — teardrop top + circle bottom blobs
// ============================================================================

describe('REQ-C-20: fir canopy (tier-based after #62)', () => {
	const shapeDef = getShapeDefinition('fir');

	it('fir generateBlobs returns empty array (tiers used instead)', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 4);
		expect(blobs.length).toBe(0);
	});

	it('fir has a short trunk (defaultTrunkTop >= H*0.75)', () => {
		expect(shapeDef.defaultTrunkTop).toBeGreaterThanOrEqual(VIEWBOX_HEIGHT * 0.75);
	});

	it('fir trunk is narrower than pine', () => {
		const pineDef = getShapeDefinition('pine');
		expect(shapeDef.trunkBaseWidth).toBeLessThan(pineDef.trunkBaseWidth);
	});

	it('fir is deterministic across runs', () => {
		const a = shapeDef.generateBlobs(createPrng(42), 4);
		const b = shapeDef.generateBlobs(createPrng(42), 4);
		expect(a).toEqual(b);
	});
});

// ============================================================================
// REQ-C-21: maple canopy — 5 blobs in a 180° arc above the trunk
// ============================================================================

describe('REQ-C-21: maple canopy arc layout', () => {
	const shapeDef = getShapeDefinition('maple');
	const W = VIEWBOX_WIDTH;

	it('maple at seed 42 with blobCount=5 produces exactly 5 blobs', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 5);
		expect(blobs.length).toBe(5);
	});

	it('maple blobs span at least 0.30·W horizontally (full arc)', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 5);
		const minCx = Math.min(...blobs.map((b) => b.cx));
		const maxCx = Math.max(...blobs.map((b) => b.cx));
		expect(minCx).toBeLessThan(W / 2 - 0.15 * W);
		expect(maxCx).toBeGreaterThan(W / 2 + 0.15 * W);
	});

	it('every maple blob uses circle boundary', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 5);
		for (const b of blobs) {
			expect(b.boundary).toBe(BOUNDARY_KINDS.circle);
		}
	});

	it('maple is deterministic', () => {
		const a = shapeDef.generateBlobs(createPrng(42), 5);
		const b = shapeDef.generateBlobs(createPrng(42), 5);
		expect(a).toEqual(b);
	});
});

// ============================================================================
// REQ-C-22: willow canopy — reuses oak radial with scaled secondary blobs
// ============================================================================

describe('REQ-C-22: willow canopy (#62 redesign — weeping silhouette)', () => {
	const shapeDef = getShapeDefinition('willow');

	it('willow with blobCount=6 produces 6 blobs', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 6);
		expect(blobs.length).toBe(6);
	});

	it('willow secondary blobs are smaller on average than primary', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 6);
		const primaryArea = blobs[0]!.rx * blobs[0]!.ry;
		const secondaryMeanArea =
			blobs.slice(1).reduce((s, b) => s + b.rx * b.ry, 0) / (blobs.length - 1);
		expect(primaryArea).toBeGreaterThan(secondaryMeanArea);
	});

	it('every willow blob uses circle boundary', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 6);
		for (const b of blobs) {
			expect(b.boundary).toBe(BOUNDARY_KINDS.circle);
		}
	});

	it('willow is deterministic', () => {
		const a = shapeDef.generateBlobs(createPrng(42), 6);
		const b = shapeDef.generateBlobs(createPrng(42), 6);
		expect(a).toEqual(b);
	});
});

// ============================================================================
// Issue #10: custom shape — generateCustomBlobs + growCustomBlobs
// ============================================================================

function makeCustomBlob(overrides: Partial<CustomBlob> = {}): CustomBlob {
	return {
		...CUSTOM_BLOB_DEFAULT,
		...overrides,
		position: {
			...CUSTOM_BLOB_DEFAULT.position,
			...overrides.position,
		},
	};
}

describe('Issue #10: generateCustomBlobs', () => {
	const canopyCenterX = CUSTOM_BLOB_CANOPY_CENTER_X;
	const canopyCenterY = CUSTOM_BLOB_CANOPY_CENTER_Y;
	const spreadRadius = CUSTOM_BLOB_SPREAD_RADIUS;

	it('returns an empty array when customBlobs is empty', () => {
		const blobs = generateCustomBlobs([], 3, canopyCenterX, canopyCenterY, spreadRadius);
		expect(blobs).toEqual([]);
	});

	it('returns an empty array when blobCount is 0', () => {
		const customBlobs = [makeCustomBlob()];
		const blobs = generateCustomBlobs(
			customBlobs,
			0,
			canopyCenterX,
			canopyCenterY,
			spreadRadius,
		);
		expect(blobs).toEqual([]);
	});

	it('copies boundaryKind and rotationDeg from the custom blob entry', () => {
		const customBlobs: CustomBlob[] = [
			makeCustomBlob({
				boundaryKind: CUSTOM_BLOB_BOUNDARY_KINDS.egg,
				rotationDeg: 45,
			}),
		];
		const blobs = generateCustomBlobs(
			customBlobs,
			1,
			canopyCenterX,
			canopyCenterY,
			spreadRadius,
		);
		expect(blobs[0]!.boundary).toBe(BOUNDARY_KINDS.egg);
		expect(blobs[0]!.rotationDeg).toBe(45);
	});

	it('maps position {x:0, y:0} to (canopyCenterX, canopyCenterY)', () => {
		const blobs = generateCustomBlobs(
			[makeCustomBlob()],
			1,
			canopyCenterX,
			canopyCenterY,
			spreadRadius,
		);
		expect(blobs[0]!.cx).toBe(canopyCenterX);
		expect(blobs[0]!.cy).toBe(canopyCenterY);
	});

	it('maps position {x:1, y:0} to (canopyCenterX + spreadRadius, canopyCenterY)', () => {
		const blobs = generateCustomBlobs(
			[makeCustomBlob({ position: { x: 1, y: 0 } })],
			1,
			canopyCenterX,
			canopyCenterY,
			spreadRadius,
		);
		expect(blobs[0]!.cx).toBe(canopyCenterX + spreadRadius);
		expect(blobs[0]!.cy).toBe(canopyCenterY);
	});

	it('maps position {x:-1, y:0} to (canopyCenterX - spreadRadius, canopyCenterY)', () => {
		const blobs = generateCustomBlobs(
			[makeCustomBlob({ position: { x: -1, y: 0 } })],
			1,
			canopyCenterX,
			canopyCenterY,
			spreadRadius,
		);
		expect(blobs[0]!.cx).toBe(canopyCenterX - spreadRadius);
	});

	it('maps position {x:0, y:1} to (canopyCenterX, canopyCenterY + spreadRadius)', () => {
		const blobs = generateCustomBlobs(
			[makeCustomBlob({ position: { x: 0, y: 1 } })],
			1,
			canopyCenterX,
			canopyCenterY,
			spreadRadius,
		);
		expect(blobs[0]!.cy).toBe(canopyCenterY + spreadRadius);
	});

	it('sizeScale = 2.0 doubles rx and ry vs sizeScale = 1.0', () => {
		const a = generateCustomBlobs(
			[makeCustomBlob({ sizeScale: 1.0 })],
			1,
			canopyCenterX,
			canopyCenterY,
			spreadRadius,
		);
		const b = generateCustomBlobs(
			[makeCustomBlob({ sizeScale: 2.0 })],
			1,
			canopyCenterX,
			canopyCenterY,
			spreadRadius,
		);
		expect(b[0]!.rx).toBeCloseTo(a[0]!.rx * 2, 10);
		expect(b[0]!.ry).toBeCloseTo(a[0]!.ry * 2, 10);
	});

	it('when blobCount < customBlobs.length, only uses the first blobCount entries', () => {
		const customBlobs: CustomBlob[] = [
			makeCustomBlob({ position: { x: 0, y: 0 } }),
			makeCustomBlob({ position: { x: 0.5, y: 0 } }),
			makeCustomBlob({ position: { x: -0.5, y: 0 } }),
		];
		const blobs = generateCustomBlobs(
			customBlobs,
			2,
			canopyCenterX,
			canopyCenterY,
			spreadRadius,
		);
		expect(blobs.length).toBe(2);
		expect(blobs[0]!.cx).toBe(canopyCenterX);
		expect(blobs[1]!.cx).toBe(canopyCenterX + 0.5 * spreadRadius);
	});

	it('when blobCount > customBlobs.length, clamps to customBlobs.length', () => {
		const customBlobs: CustomBlob[] = [makeCustomBlob()];
		const blobs = generateCustomBlobs(
			customBlobs,
			5,
			canopyCenterX,
			canopyCenterY,
			spreadRadius,
		);
		expect(blobs.length).toBe(1);
	});
});

describe('Issue #10: growCustomBlobs', () => {
	const seed = 42;
	const closeness = 50;

	it('growing an empty array to 3 returns 3 deterministic entries', () => {
		const result = growCustomBlobs([], 3, seed, closeness);
		expect(result.length).toBe(3);
		const again = growCustomBlobs([], 3, seed, closeness);
		expect(result).toEqual(again);
	});

	it('newly-seeded entries carry the default boundary/rotation/size', () => {
		const result = growCustomBlobs([], 3, seed, closeness);
		for (const entry of result) {
			expect(entry.boundaryKind).toBe(CUSTOM_BLOB_BOUNDARY_KINDS.circle);
			expect(entry.rotationDeg).toBe(0);
			expect(entry.sizeScale).toBe(1.0);
		}
	});

	it('newly-seeded positions stay within [-1, +1]', () => {
		const result = growCustomBlobs([], 8, seed, closeness);
		for (const entry of result) {
			expect(entry.position.x).toBeGreaterThanOrEqual(-1);
			expect(entry.position.x).toBeLessThanOrEqual(1);
			expect(entry.position.y).toBeGreaterThanOrEqual(-1);
			expect(entry.position.y).toBeLessThanOrEqual(1);
		}
	});

	it('growing past existing length preserves existing entries', () => {
		const existing: CustomBlob[] = [
			makeCustomBlob({
				boundaryKind: CUSTOM_BLOB_BOUNDARY_KINDS.egg,
				rotationDeg: 90,
				sizeScale: 1.5,
				position: { x: 0.3, y: -0.2 },
			}),
			makeCustomBlob({
				boundaryKind: CUSTOM_BLOB_BOUNDARY_KINDS.teardrop,
				rotationDeg: 180,
				sizeScale: 0.8,
				position: { x: -0.5, y: 0.4 },
			}),
		];
		const result = growCustomBlobs(existing, 5, seed, closeness);
		expect(result.length).toBe(5);
		expect(result[0]).toEqual(existing[0]);
		expect(result[1]).toEqual(existing[1]);
	});

	it('never truncates: target < existing.length returns existing unchanged', () => {
		const existing: CustomBlob[] = [
			makeCustomBlob({ position: { x: 0.1, y: 0.1 } }),
			makeCustomBlob({ position: { x: 0.2, y: 0.2 } }),
			makeCustomBlob({ position: { x: 0.3, y: 0.3 } }),
			makeCustomBlob({ position: { x: 0.4, y: 0.4 } }),
			makeCustomBlob({ position: { x: 0.5, y: 0.5 } }),
		];
		const result = growCustomBlobs(existing, 2, seed, closeness);
		expect(result).toBe(existing);
	});

	it('is deterministic: same arguments produce .toEqual results', () => {
		const a = growCustomBlobs([], 4, seed, closeness);
		const b = growCustomBlobs([], 4, seed, closeness);
		expect(a).toEqual(b);
	});
});

describe('DRAWS_PER_BLOB accuracy', () => {
	it('DRAWS_PER_BLOB matches actual rng consumption: stepwise grow equals one-shot grow', () => {
		const seed = 42;
		const closeness = 50;

		// growCustomBlobs uses DRAWS_PER_BLOB to skip past existing entries.
		// If the constant is wrong, growing [0→1] then [1→3] will produce
		// different blobs at indices 1-2 than growing [0→3] in one call.
		const oneShot = growCustomBlobs([], 3, seed, closeness);
		const stepwise1 = growCustomBlobs([], 1, seed, closeness);
		const stepwise3 = growCustomBlobs(stepwise1, 3, seed, closeness);
		expect(stepwise3).toEqual(oneShot);
	});

	it('DRAWS_PER_BLOB constant equals 2', () => {
		expect(DRAWS_PER_BLOB).toBe(2);
	});
});

// ============================================================================
// B2: Oak redesign — tuned defaults + blob generator
// ============================================================================

describe('B2: oak redesign', () => {
	const W = VIEWBOX_WIDTH;
	const H = VIEWBOX_HEIGHT;
	const shapeDef = getShapeDefinition('oak');

	it('oak blob generator with blobCount=5 returns 5 blobs all with circle boundary', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 5);
		expect(blobs.length).toBe(5);
		for (const b of blobs) {
			expect(b.boundary).toBe(BOUNDARY_KINDS.circle);
		}
	});

	it('oak primary blob (index 0) is centered near W/2, canopy center y ~H*0.3', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 5);
		expect(Math.abs(blobs[0]!.cx - W / 2)).toBeLessThan(5);
		expect(Math.abs(blobs[0]!.cy - H * 0.3)).toBeLessThan(H * 0.1);
	});

	it('all oak blobs have rx >= W*0.2 (large blobs)', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 5);
		for (const b of blobs) {
			expect(b.rx).toBeGreaterThanOrEqual(W * 0.2);
		}
	});

	it('oak trunkBaseWidth is 32 (thick trunk)', () => {
		expect(shapeDef.trunkBaseWidth).toBe(32);
	});
});

// ============================================================================
// B3: Birch redesign — thin trunk, wider blobs
// ============================================================================

describe('B3: birch redesign', () => {
	const W = VIEWBOX_WIDTH;
	const shapeDef = getShapeDefinition('birch');

	it('birch blob generator with blobCount=6 returns 6 blobs', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 6);
		expect(blobs.length).toBe(6);
	});

	it('birch blobs spread wider horizontally: max cx - min cx > W*0.15', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 6);
		const minCx = Math.min(...blobs.map((b) => b.cx));
		const maxCx = Math.max(...blobs.map((b) => b.cx));
		expect(maxCx - minCx).toBeGreaterThan(W * 0.15);
	});

	it('birch ShapeDefinition: trunkBaseWidth <= 18 (thin trunk)', () => {
		expect(shapeDef.trunkBaseWidth).toBeLessThanOrEqual(18);
	});
});

// ============================================================================
// B4: Maple redesign — Y-fork trunk, similar-sized blobs
// ============================================================================

describe('B4: maple redesign', () => {
	const H = VIEWBOX_HEIGHT;
	const shapeDef = getShapeDefinition('maple');

	it('maple blob generator with blobCount=5 returns 5 blobs', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 5);
		expect(blobs.length).toBe(5);
	});

	it('all maple blobs are circle boundary', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 5);
		for (const b of blobs) {
			expect(b.boundary).toBe(BOUNDARY_KINDS.circle);
		}
	});

	it('maple blobs: most spread across upper half (cy < H*0.5)', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 5);
		const upperCount = blobs.filter((b) => b.cy < H * 0.5).length;
		expect(upperCount).toBeGreaterThanOrEqual(3);
	});
});

// ============================================================================
// B5: Pine redesign — short trunk
// ============================================================================

describe('B5: pine redesign', () => {
	const H = VIEWBOX_HEIGHT;
	const shapeDef = getShapeDefinition('pine');

	it('pine ShapeDefinition: defaultTrunkTop >= H*0.75 (short trunk)', () => {
		expect(shapeDef.defaultTrunkTop).toBeGreaterThanOrEqual(H * 0.75);
	});
});

// ============================================================================
// B7: Willow redesign — drooping branches, small clusters
// ============================================================================

describe('B7: willow redesign', () => {
	const shapeDef = getShapeDefinition('willow');
	const oakDef = getShapeDefinition('oak');

	it('willow blob generator with blobCount=6 returns 6 blobs', () => {
		const blobs = shapeDef.generateBlobs(createPrng(42), 6);
		expect(blobs.length).toBe(6);
	});

	it('willow non-primary blobs have smaller rx/ry than oak equivalents', () => {
		const willowBlobs = shapeDef.generateBlobs(createPrng(42), 6);
		const oakBlobs = oakDef.generateBlobs(createPrng(42), 6);
		// Compare mean rx of non-primary blobs
		const willowMeanRx =
			willowBlobs.slice(1).reduce((s, b) => s + b.rx, 0) / (willowBlobs.length - 1);
		const oakMeanRx = oakBlobs.slice(1).reduce((s, b) => s + b.rx, 0) / (oakBlobs.length - 1);
		expect(willowMeanRx).toBeLessThan(oakMeanRx);
	});

	it('willow canopy center is lower than oak (cy closer to H*0.4)', () => {
		const willowBlobs = shapeDef.generateBlobs(createPrng(42), 6);
		const oakBlobs = oakDef.generateBlobs(createPrng(42), 6);
		const willowMeanCy = willowBlobs.reduce((s, b) => s + b.cy, 0) / willowBlobs.length;
		const oakMeanCy = oakBlobs.reduce((s, b) => s + b.cy, 0) / oakBlobs.length;
		expect(willowMeanCy).toBeGreaterThan(oakMeanCy);
	});
});
