import { describe, it, expect } from 'vitest';
import { generateTree } from './generate.js';
import { generateBranches } from './shapes/branch_generation.js';
import type { TreeConfig } from './types.js';
import {
	BRANCH_MIRRORING,
	CROOKEDNESS_MODES,
	DEFAULT_TREE_CONFIG,
	SHAPE_DEFAULTS,
	TREE_SHAPES,
} from './types.js';
import { createPrng } from './prng.js';
import { buildTrunkPath } from './shapes/trunk.js';

function makeConfig(overrides: Partial<TreeConfig> = {}): TreeConfig {
	return { ...DEFAULT_TREE_CONFIG, ...overrides };
}

// ============================================================================
// Species defaults
// ============================================================================

describe('Branch symmetry species defaults', () => {
	it('cherry defaults to branchMirroring=preferred, trunkFork=false', () => {
		const defaults = SHAPE_DEFAULTS[TREE_SHAPES.cherry];
		expect(defaults.branchMirroring).toBe(BRANCH_MIRRORING.preferred);
		expect(defaults.trunkFork).toBe(false);
	});

	it('acacia defaults to branchMirroring=preferred, trunkFork=true', () => {
		const defaults = SHAPE_DEFAULTS[TREE_SHAPES.acacia];
		expect(defaults.branchMirroring).toBe(BRANCH_MIRRORING.preferred);
		expect(defaults.trunkFork).toBe(true);
	});

	it('oak, birch, maple, willow, apple, baobab default to branchMirroring=allowed', () => {
		const allowedShapes = [
			TREE_SHAPES.oak,
			TREE_SHAPES.birch,
			TREE_SHAPES.maple,
			TREE_SHAPES.willow,
			TREE_SHAPES.apple,
			TREE_SHAPES.baobab,
		] as const;
		for (const shape of allowedShapes) {
			const defaults = SHAPE_DEFAULTS[shape];
			expect(defaults.branchMirroring).toBe(BRANCH_MIRRORING.allowed);
			expect(defaults.trunkFork).toBe(false);
		}
	});

	it('pine, fir, cypress, bush default to branchMirroring=off, trunkFork=false', () => {
		const offShapes = [
			TREE_SHAPES.pine,
			TREE_SHAPES.fir,
			TREE_SHAPES.cypress,
			TREE_SHAPES.bush,
		] as const;
		for (const shape of offShapes) {
			const defaults = SHAPE_DEFAULTS[shape];
			expect(defaults.branchMirroring).toBe(BRANCH_MIRRORING.off);
			expect(defaults.trunkFork).toBe(false);
		}
	});
});

// ============================================================================
// Config migration
// ============================================================================

describe('Config migration', () => {
	it('DEFAULT_TREE_CONFIG includes branchMirroring and trunkFork', () => {
		expect(DEFAULT_TREE_CONFIG.branchMirroring).toBe(BRANCH_MIRRORING.off);
		expect(DEFAULT_TREE_CONFIG.trunkFork).toBe(false);
	});

	it('old config without new fields gets defaults via spread', () => {
		const oldConfig = { ...DEFAULT_TREE_CONFIG } as Record<string, unknown>;
		delete oldConfig['branchMirroring'];
		delete oldConfig['trunkFork'];
		const migrated = { ...DEFAULT_TREE_CONFIG, ...oldConfig };
		expect(migrated.branchMirroring).toBe(BRANCH_MIRRORING.off);
		expect(migrated.trunkFork).toBe(false);
	});
});

// ============================================================================
// Mirroring = off (no regression)
// ============================================================================

describe('branchMirroring=off', () => {
	it('produces branches identical to default behavior', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.off,
			trunkFork: false,
			branchDepth: 2,
			branchesLevel1Range: [2, 4],
			branchesLevel2Range: [1, 2],
			trunkSegments: 5,
			seed: 42,
		});
		const configDefault = makeConfig({
			branchDepth: 2,
			branchesLevel1Range: [2, 4],
			branchesLevel2Range: [1, 2],
			trunkSegments: 5,
			seed: 42,
		});

		const rng1 = createPrng(config.seed + 7777);
		const trunkJunctions1 = buildTrunkPath(
			rng1,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const rng2 = createPrng(configDefault.seed + 7777);
		const trunkJunctions2 = buildTrunkPath(
			rng2,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);

		const result1 = generateBranches(rng1, 100, 250, 10, config, trunkJunctions1, [], 20);
		const result2 = generateBranches(
			rng2,
			100,
			250,
			10,
			configDefault,
			trunkJunctions2,
			[],
			20,
		);

		expect(result1.branches.length).toBe(result2.branches.length);
		for (let i = 0; i < result1.branches.length; i++) {
			expect(result1.branches[i]!.segment.x1).toBeCloseTo(result2.branches[i]!.segment.x1, 5);
			expect(result1.branches[i]!.segment.y1).toBeCloseTo(result2.branches[i]!.segment.y1, 5);
		}
	});
});

// ============================================================================
// Mirroring = preferred (paired branches)
// ============================================================================

describe('branchMirroring=preferred', () => {
	it('generates at least 2 L1 branches even with range [1,1]', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.preferred,
			trunkFork: false,
			branchDepth: 1,
			branchesLevel1Range: [1, 1],
			trunkSegments: 5,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
		expect(result.branches.filter((b) => b.depth === 1).length).toBeGreaterThanOrEqual(2);
	});

	it('generates L1 branches in left/right pairs from shared junctions', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.preferred,
			trunkFork: false,
			branchDepth: 1,
			branchesLevel1Range: [4, 4],
			trunkSegments: 5,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
		const l1Branches = result.branches.filter((b) => b.depth === 1);

		expect(l1Branches.length).toBeGreaterThanOrEqual(4);

		// Branches should come in pairs sharing the same origin Y
		for (let i = 0; i < l1Branches.length - 1; i += 2) {
			const a = l1Branches[i]!;
			const b = l1Branches[i + 1]!;
			expect(a.segment.y1).toBeCloseTo(b.segment.y1, 0);
		}
	});

	it('paired branches go to opposite sides of trunk', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.preferred,
			trunkFork: false,
			branchDepth: 1,
			branchesLevel1Range: [4, 4],
			trunkSegments: 5,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
		const l1Branches = result.branches.filter((b) => b.depth === 1);

		for (let i = 0; i < l1Branches.length - 1; i += 2) {
			const a = l1Branches[i]!;
			const b = l1Branches[i + 1]!;
			const aSide = Math.sign(a.segment.x2 - a.segment.x1);
			const bSide = Math.sign(b.segment.x2 - b.segment.x1);
			expect(aSide).not.toBe(bSide);
		}
	});

	it('generates L2 branches in pairs when branchDepth >= 2', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.preferred,
			trunkFork: false,
			branchDepth: 2,
			branchesLevel1Range: [2, 2],
			branchesLevel2Range: [2, 2],
			trunkSegments: 5,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
		const l2Branches = result.branches.filter((b) => b.depth === 2);

		expect(l2Branches.length).toBeGreaterThanOrEqual(2);
	});

	it('bumps L2 minimum to 2 when preferred (aggregate across seeds)', () => {
		let totalL2 = 0;
		let totalParentsWithChildren = 0;
		for (let seed = 0; seed < 10; seed++) {
			const config = makeConfig({
				branchMirroring: BRANCH_MIRRORING.preferred,
				trunkFork: false,
				branchDepth: 2,
				branchesLevel1Range: [2, 2],
				branchesLevel2Range: [1, 1],
				trunkSegments: 5,
				seed,
			});
			const rng = createPrng(config.seed + 7777);
			const trunkJunctions = buildTrunkPath(
				rng,
				0,
				5,
				0,
				100,
				250,
				CROOKEDNESS_MODES.alternating,
			);
			const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
			const l1Branches = result.branches.filter((b) => b.depth === 1);
			for (const parent of l1Branches) {
				const parentIdx = result.branches.indexOf(parent);
				const children = result.branches.filter((b) => b.parentIndex === parentIdx);
				if (children.length > 0) {
					totalParentsWithChildren++;
					totalL2 += children.length;
				}
			}
		}
		// On average, each parent with children should have >= 2 L2 (paired generation)
		expect(totalParentsWithChildren).toBeGreaterThan(0);
		expect(totalL2 / totalParentsWithChildren).toBeGreaterThanOrEqual(1.5);
	});
});

// ============================================================================
// Mirroring = allowed (relaxed overlap)
// ============================================================================

describe('branchMirroring=allowed', () => {
	it('generates branches without error', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.allowed,
			trunkFork: false,
			branchDepth: 2,
			branchesLevel1Range: [3, 5],
			branchesLevel2Range: [1, 2],
			trunkSegments: 5,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
		expect(result.branches.length).toBeGreaterThan(0);
	});

	it('allows more same-junction pairs than off mode (statistical)', () => {
		let allowedSameJunctionCount = 0;
		let offSameJunctionCount = 0;

		for (let seed = 0; seed < 20; seed++) {
			for (const mode of [BRANCH_MIRRORING.allowed, BRANCH_MIRRORING.off] as const) {
				const config = makeConfig({
					branchMirroring: mode,
					trunkFork: false,
					branchDepth: 1,
					branchesLevel1Range: [3, 5],
					trunkSegments: 5,
					seed,
				});
				const rng = createPrng(config.seed + 7777);
				const trunkJunctions = buildTrunkPath(
					rng,
					0,
					5,
					0,
					100,
					250,
					CROOKEDNESS_MODES.alternating,
				);
				const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
				const l1 = result.branches.filter((b) => b.depth === 1);

				let sameJunction = 0;
				for (let i = 0; i < l1.length; i++) {
					for (let j = i + 1; j < l1.length; j++) {
						if (Math.abs(l1[i]!.segment.y1 - l1[j]!.segment.y1) < 1) {
							sameJunction++;
						}
					}
				}

				if (mode === BRANCH_MIRRORING.allowed) {
					allowedSameJunctionCount += sameJunction;
				} else {
					offSameJunctionCount += sameJunction;
				}
			}
		}

		expect(allowedSameJunctionCount).toBeGreaterThanOrEqual(offSameJunctionCount);
	});
});

// ============================================================================
// Trunk fork
// ============================================================================

describe('trunkFork', () => {
	it('generates at least 2 L1 branches from topmost trunk junction', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.off,
			trunkFork: true,
			branchDepth: 1,
			branchesLevel1Range: [2, 3],
			trunkSegments: 5,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
		const l1Branches = result.branches.filter((b) => b.depth === 1);

		expect(l1Branches.length).toBeGreaterThanOrEqual(2);

		// The first two branches should originate near the topmost trunk junction
		const topJunctionY = trunkJunctions[trunkJunctions.length - 2]!.y;
		const forkArm1 = l1Branches[0]!;
		const forkArm2 = l1Branches[1]!;
		expect(Math.abs(forkArm1.segment.y1 - topJunctionY)).toBeLessThan(5);
		expect(Math.abs(forkArm2.segment.y1 - topJunctionY)).toBeLessThan(5);
	});

	it('fork arms have thick widths (0.6-0.7 × trunkTopWidth)', () => {
		const trunkTopWidth = 10;
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.off,
			trunkFork: true,
			branchDepth: 1,
			branchesLevel1Range: [2, 3],
			trunkSegments: 5,
			trunkThickness: 100,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(
			rng,
			100,
			250,
			trunkTopWidth,
			config,
			trunkJunctions,
			[],
			20,
		);
		const l1Branches = result.branches.filter((b) => b.depth === 1);

		// Fork arms should be thicker than normal branches
		const forkArm1 = l1Branches[0]!;
		const forkArm2 = l1Branches[1]!;
		expect(forkArm1.segment.widthStart).toBeGreaterThanOrEqual(trunkTopWidth * 0.6);
		expect(forkArm2.segment.widthStart).toBeGreaterThanOrEqual(trunkTopWidth * 0.6);
	});

	it('fork arms diverge to opposite sides', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.off,
			trunkFork: true,
			branchDepth: 1,
			branchesLevel1Range: [2, 3],
			trunkSegments: 5,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
		const l1Branches = result.branches.filter((b) => b.depth === 1);

		const arm1Side = Math.sign(l1Branches[0]!.segment.x2 - l1Branches[0]!.segment.x1);
		const arm2Side = Math.sign(l1Branches[1]!.segment.x2 - l1Branches[1]!.segment.x1);
		expect(arm1Side).not.toBe(arm2Side);
	});

	it('bumps L1 minimum to 2 when trunkFork is true', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.off,
			trunkFork: true,
			branchDepth: 1,
			branchesLevel1Range: [1, 1],
			trunkSegments: 5,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
		const l1Branches = result.branches.filter((b) => b.depth === 1);
		expect(l1Branches.length).toBeGreaterThanOrEqual(2);
	});

	it('fork arms support L2 sub-branches', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.off,
			trunkFork: true,
			branchDepth: 2,
			branchesLevel1Range: [2, 3],
			branchesLevel2Range: [1, 2],
			trunkSegments: 5,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
		const l2Branches = result.branches.filter((b) => b.depth === 2);
		expect(l2Branches.length).toBeGreaterThan(0);
	});
});

// ============================================================================
// Trunk fork + preferred mirror combined
// ============================================================================

describe('trunkFork + preferred mirror combined', () => {
	it('fork arms serve as primary mirror pair, additional L1s also mirror', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.preferred,
			trunkFork: true,
			branchDepth: 1,
			branchesLevel1Range: [4, 4],
			trunkSegments: 5,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
		const l1Branches = result.branches.filter((b) => b.depth === 1);

		expect(l1Branches.length).toBeGreaterThanOrEqual(4);

		// First pair should be fork arms from topmost junction
		const topJunctionY = trunkJunctions[trunkJunctions.length - 2]!.y;
		expect(Math.abs(l1Branches[0]!.segment.y1 - topJunctionY)).toBeLessThan(5);
		expect(Math.abs(l1Branches[1]!.segment.y1 - topJunctionY)).toBeLessThan(5);
	});
});

// ============================================================================
// Trunk fork flare (trunk geometry)
// ============================================================================

describe('trunk fork flare', () => {
	it('trunkFork=true produces visually distinct trunk (wider at top)', () => {
		const configWithFork = makeConfig({
			trunkFork: true,
			branchMirroring: BRANCH_MIRRORING.off,
			branchDepth: 1,
			branchesLevel1Range: [2, 3],
			trunkSegments: 5,
			seed: 42,
		});
		const configNoFork = makeConfig({
			trunkFork: false,
			branchMirroring: BRANCH_MIRRORING.off,
			branchDepth: 1,
			branchesLevel1Range: [2, 3],
			trunkSegments: 5,
			seed: 42,
		});

		const geoFork = generateTree(configWithFork);
		const geoNoFork = generateTree(configNoFork);

		// Fork version has fewer trunk quads (topmost segment removed)
		expect(geoFork.trunkQuads.length).toBeLessThan(geoNoFork.trunkQuads.length);

		// Compare the topmost remaining quads — fork version should be wider due to flare
		const jd = geoFork.junctionData!;
		const midY = (jd[0]!.position.y + jd[jd.length - 1]!.position.y) / 2;
		const topForkQuads = geoFork.trunkQuads.filter((q) => q.points.some((p) => p.y < midY));
		const topNoForkQuads = geoNoFork.trunkQuads.filter((q) => q.points.some((p) => p.y < midY));

		if (topForkQuads.length > 0 && topNoForkQuads.length > 0) {
			const forkMaxWidth = Math.max(
				...topForkQuads.map((q) => {
					const xs = q.points.map((p) => p.x);
					return Math.max(...xs) - Math.min(...xs);
				}),
			);
			const noForkMaxWidth = Math.max(
				...topNoForkQuads.map((q) => {
					const xs = q.points.map((p) => p.x);
					return Math.max(...xs) - Math.min(...xs);
				}),
			);
			expect(forkMaxWidth).toBeGreaterThan(noForkMaxWidth);
		}
	});
});

// ============================================================================
// Trunk fork termination (REQ-PRD7-02)
// ============================================================================

describe('trunk fork termination', () => {
	it('trunkFork=true produces no trunk quads above fork junction Y', () => {
		const config = makeConfig({
			trunkFork: true,
			branchMirroring: BRANCH_MIRRORING.off,
			branchDepth: 1,
			branchesLevel1Range: [2, 3],
			trunkSegments: 5,
			seed: 42,
		});
		const geo = generateTree(config);

		const forkJunctionY = geo.junctionData![geo.junctionData!.length - 2]!.position.y;

		for (const quad of geo.trunkQuads) {
			const allAbove = quad.points.every((p) => p.y < forkJunctionY);
			expect(allAbove).toBe(false);
		}
	});

	it('trunkFork=false still has trunk quads above second-from-top junction', () => {
		const config = makeConfig({
			trunkFork: false,
			branchMirroring: BRANCH_MIRRORING.off,
			branchDepth: 1,
			branchesLevel1Range: [2, 3],
			trunkSegments: 5,
			seed: 42,
		});
		const geo = generateTree(config);

		const secondFromTopY = geo.junctionData![geo.junctionData!.length - 2]!.position.y;
		const hasQuadAbove = geo.trunkQuads.some((q) =>
			q.points.every((p) => p.y < secondFromTopY),
		);
		expect(hasQuadAbove).toBe(true);
	});
});

// ============================================================================
// Slider combinations work without error
// ============================================================================

describe('all slider combinations work', () => {
	const mirrorModes = [
		BRANCH_MIRRORING.off,
		BRANCH_MIRRORING.allowed,
		BRANCH_MIRRORING.preferred,
	] as const;

	for (const mirror of mirrorModes) {
		for (const trunkFork of [false, true]) {
			for (const depth of [0, 1, 2, 3]) {
				it(`mirror=${mirror} fork=${trunkFork} depth=${depth} generates without error`, () => {
					const config = makeConfig({
						branchMirroring: mirror,
						trunkFork,
						branchDepth: depth,
						branchesLevel1Range: [1, 3],
						branchesLevel2Range: [1, 2],
						branchesLevel3Range: [0, 1],
						trunkSegments: 5,
						branchAngle: 50,
						seed: 42,
					});
					expect(() => generateTree(config)).not.toThrow();
				});
			}
		}
	}
});

// ============================================================================
// Total branch cap still respected
// ============================================================================

describe('branch cap', () => {
	it('MAX_TOTAL_BRANCHES=25 still respected with preferred mirroring', () => {
		const config = makeConfig({
			branchMirroring: BRANCH_MIRRORING.preferred,
			trunkFork: true,
			branchDepth: 3,
			branchesLevel1Range: [6, 8],
			branchesLevel2Range: [3, 5],
			branchesLevel3Range: [2, 3],
			trunkSegments: 5,
			seed: 42,
		});
		const rng = createPrng(config.seed + 7777);
		const trunkJunctions = buildTrunkPath(
			rng,
			0,
			5,
			0,
			100,
			250,
			CROOKEDNESS_MODES.alternating,
		);
		const result = generateBranches(rng, 100, 250, 10, config, trunkJunctions, [], 20);
		expect(result.branches.length).toBeLessThanOrEqual(25);
	});
});
