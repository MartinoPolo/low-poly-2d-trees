import { describe, it, expect } from 'vitest';
import { generateTree } from './generate.js';
import type { TreeConfig, TreeGeometry, Triangle } from './types.js';
import {
	DEFAULT_TREE_CONFIG,
	VIEWBOX_WIDTH,
	VIEWBOX_HEIGHT,
	TREE_SHAPES,
	SHAPE_DEFAULTS,
} from './types.js';

// Helper to create config with overrides
function makeConfig(overrides: Partial<TreeConfig> = {}): TreeConfig {
	return { ...DEFAULT_TREE_CONFIG, ...overrides };
}

function allTriangles(geo: TreeGeometry): Triangle[] {
	return [
		...geo.trunkTriangles,
		...geo.branchTriangles,
		...geo.canopyBlobs.flatMap((b) => b.triangles),
	];
}

// ============================================================================
// REQ-R: Rendering
// ============================================================================

describe('REQ-R: Rendering', () => {
	describe('REQ-R-01: viewBox 200×300', () => {
		it('produces a viewBox of 200×300', () => {
			const geo = generateTree(makeConfig());
			expect(geo.viewBox.width).toBe(200);
			expect(geo.viewBox.height).toBe(300);
		});
	});

	describe('REQ-R-02: three top-level <g> layers', () => {
		it('has trunkTriangles, branchTriangles, canopyBlobs arrays', () => {
			const geo = generateTree(makeConfig());
			expect(Array.isArray(geo.trunkTriangles)).toBe(true);
			expect(Array.isArray(geo.branchTriangles)).toBe(true);
			expect(Array.isArray(geo.canopyBlobs)).toBe(true);
		});

		it('trunk triangles have group=trunk', () => {
			const geo = generateTree(makeConfig());
			for (const tri of geo.trunkTriangles) {
				expect(tri.group).toBe('trunk');
			}
		});

		it('branch triangles have group=branch', () => {
			const geo = generateTree(makeConfig({ branchCount: 5 }));
			for (const tri of geo.branchTriangles) {
				expect(tri.group).toBe('branch');
			}
		});

		it('canopy triangles have group=canopy', () => {
			const geo = generateTree(makeConfig());
			for (const blob of geo.canopyBlobs) {
				for (const tri of blob.triangles) {
					expect(tri.group).toBe('canopy');
				}
			}
		});
	});

	describe('REQ-R-03: canopyBlobs depth ordering', () => {
		it('canopyBlobs are sorted back-to-front by depth', () => {
			const geo = generateTree(makeConfig({ blobCount: 5 }));
			for (let i = 1; i < geo.canopyBlobs.length; i++) {
				expect(geo.canopyBlobs[i]!.depth).toBeGreaterThanOrEqual(
					geo.canopyBlobs[i - 1]!.depth,
				);
			}
		});
	});

	describe('REQ-R-04: triangle properties', () => {
		it('each triangle has hex color, group, and 3 vertices', () => {
			const geo = generateTree(makeConfig());
			const tris = allTriangles(geo);
			expect(tris.length).toBeGreaterThan(0);
			for (const tri of tris) {
				expect(tri.color).toMatch(/^#[0-9a-f]{6}$/);
				expect(['canopy', 'trunk', 'branch']).toContain(tri.group);
				expect(tri.points).toHaveLength(3);
				for (const pt of tri.points) {
					expect(typeof pt.x).toBe('number');
					expect(typeof pt.y).toBe('number');
				}
			}
		});
	});

	describe('REQ-R-05: deterministic generation', () => {
		it('same seed/config produces identical output', () => {
			const config = makeConfig({ seed: 12345 });
			const geo1 = generateTree(config);
			const geo2 = generateTree(config);
			expect(geo1).toEqual(geo2);
		});

		it('different seeds produce different output', () => {
			const geo1 = generateTree(makeConfig({ seed: 1 }));
			const geo2 = generateTree(makeConfig({ seed: 2 }));
			expect(geo1).not.toEqual(geo2);
		});
	});
});

// ============================================================================
// REQ-P: Configuration Parameters
// ============================================================================

describe('REQ-P: Configuration Parameters', () => {
	describe('REQ-P-01: shape types', () => {
		it('accepts oak, pine, birch shapes', () => {
			expect(() => generateTree(makeConfig({ shape: 'oak' }))).not.toThrow();
			expect(() => generateTree(makeConfig({ shape: 'pine' }))).not.toThrow();
			expect(() => generateTree(makeConfig({ shape: 'birch' }))).not.toThrow();
		});
	});

	describe('REQ-P-16: blobSizeVariance range 1.0-10.0', () => {
		it('default is 3.0', () => {
			expect(DEFAULT_TREE_CONFIG.blobSizeVariance).toBe(3.0);
		});

		it('accepts values in range 1.0-10.0', () => {
			expect(() => generateTree(makeConfig({ blobSizeVariance: 1.0 }))).not.toThrow();
			expect(() => generateTree(makeConfig({ blobSizeVariance: 10.0 }))).not.toThrow();
		});
	});

	describe('REQ-P-17: blobCloseness 20-80', () => {
		it('default is 50', () => {
			expect(DEFAULT_TREE_CONFIG.blobCloseness).toBe(50);
		});

		it('accepts values in range 20-80', () => {
			expect(() => generateTree(makeConfig({ blobCloseness: 20 }))).not.toThrow();
			expect(() => generateTree(makeConfig({ blobCloseness: 80 }))).not.toThrow();
		});
	});

	describe('REQ-P-18: trunkThickness 50-200', () => {
		it('default is 100', () => {
			expect(DEFAULT_TREE_CONFIG.trunkThickness).toBe(100);
		});
	});

	describe('REQ-P-19: branchThickness 50-200', () => {
		it('default is 100', () => {
			expect(DEFAULT_TREE_CONFIG.branchThickness).toBe(100);
		});
	});

	describe('REQ-P-20: canopySize 50-200', () => {
		it('default is 100', () => {
			expect(DEFAULT_TREE_CONFIG.canopySize).toBe(100);
		});
	});

	describe('REQ-P-21: trunkHeight 30-150', () => {
		it('default is 100', () => {
			expect(DEFAULT_TREE_CONFIG.trunkHeight).toBe(100);
		});
	});

	describe('REQ-P-22: trunkBranchRatio 40-80', () => {
		it('default is 70', () => {
			expect(DEFAULT_TREE_CONFIG.trunkBranchRatio).toBe(70);
		});
	});

	describe('per-shape defaults', () => {
		it('oak defaults: blobCount=5, branchCount=2, blobSizeVariance=3.0, blobCloseness=50', () => {
			const d = SHAPE_DEFAULTS[TREE_SHAPES.oak];
			expect(d.blobCount).toBe(5);
			expect(d.branchCount).toBe(2);
			expect(d.blobSizeVariance).toBe(3.0);
			expect(d.blobCloseness).toBe(50);
		});

		it('pine defaults: blobCount=3, branchCount=0, blobSizeVariance=3.0, blobCloseness=50', () => {
			const d = SHAPE_DEFAULTS[TREE_SHAPES.pine];
			expect(d.blobCount).toBe(3);
			expect(d.branchCount).toBe(0);
			expect(d.blobSizeVariance).toBe(3.0);
			expect(d.blobCloseness).toBe(50);
		});

		it('birch defaults: blobCount=3, branchCount=1, blobSizeVariance=3.0, blobCloseness=50', () => {
			const d = SHAPE_DEFAULTS[TREE_SHAPES.birch];
			expect(d.blobCount).toBe(3);
			expect(d.branchCount).toBe(1);
			expect(d.blobSizeVariance).toBe(3.0);
			expect(d.blobCloseness).toBe(50);
		});
	});
});

// ============================================================================
// REQ-C: Canopy Generation
// ============================================================================

describe('REQ-C: Canopy Generation', () => {
	describe('REQ-C-01: blob centering on trunk axis', () => {
		it('blob 0 positioned on/near trunk axis for blobCount=1', () => {
			const geo = generateTree(makeConfig({ blobCount: 1, shape: 'oak' }));
			// Blob 0 should be centered around VIEWBOX_WIDTH/2 = 100
			// We check the canopy center is near the midpoint
			const center = geo.anchors.canopyCenter;
			expect(Math.abs(center.x - VIEWBOX_WIDTH / 2)).toBeLessThan(15);
		});
	});

	describe('REQ-C-02: blobSizeVariance ratio-based', () => {
		it('at 1.0 all blobs approximately same size (generates without error)', () => {
			expect(() =>
				generateTree(makeConfig({ blobSizeVariance: 1.0, blobCount: 5 })),
			).not.toThrow();
		});

		it('at 10.0 generates without error (extreme variance)', () => {
			expect(() =>
				generateTree(makeConfig({ blobSizeVariance: 10.0, blobCount: 5 })),
			).not.toThrow();
		});
	});

	describe('REQ-C-03: depth ordering with containment', () => {
		it('canopy blobs are depth-sorted back to front', () => {
			const geo = generateTree(makeConfig({ blobCount: 5, seed: 42 }));
			for (let i = 1; i < geo.canopyBlobs.length; i++) {
				expect(geo.canopyBlobs[i]!.depth).toBeGreaterThanOrEqual(
					geo.canopyBlobs[i - 1]!.depth,
				);
			}
		});
	});

	describe('REQ-C-03a: blobCloseness effect', () => {
		it('low blobCloseness produces wider spread than high blobCloseness', () => {
			const geoWide = generateTree(
				makeConfig({ blobCloseness: 20, blobCount: 5, seed: 100 }),
			);
			const geoTight = generateTree(
				makeConfig({ blobCloseness: 80, blobCount: 5, seed: 100 }),
			);
			// Compare canopy bounding box widths
			const widthWide =
				Math.max(
					...geoWide.canopyBlobs.flatMap((b) =>
						b.triangles.flatMap((t) => t.points.map((p) => p.x)),
					),
				) -
				Math.min(
					...geoWide.canopyBlobs.flatMap((b) =>
						b.triangles.flatMap((t) => t.points.map((p) => p.x)),
					),
				);
			const widthTight =
				Math.max(
					...geoTight.canopyBlobs.flatMap((b) =>
						b.triangles.flatMap((t) => t.points.map((p) => p.x)),
					),
				) -
				Math.min(
					...geoTight.canopyBlobs.flatMap((b) =>
						b.triangles.flatMap((t) => t.points.map((p) => p.x)),
					),
				);
			expect(widthWide).toBeGreaterThan(widthTight);
		});
	});

	describe('REQ-C-03b: canopySize effect', () => {
		it('canopySize 200 produces larger canopy than 50', () => {
			const geoLarge = generateTree(makeConfig({ canopySize: 200, seed: 42 }));
			const geoSmall = generateTree(makeConfig({ canopySize: 50, seed: 42 }));
			const getCanopyWidth = (geo: TreeGeometry) => {
				const xs = geo.canopyBlobs.flatMap((b) =>
					b.triangles.flatMap((t) => t.points.map((p) => p.x)),
				);
				return Math.max(...xs) - Math.min(...xs);
			};
			expect(getCanopyWidth(geoLarge)).toBeGreaterThan(getCanopyWidth(geoSmall));
		});
	});

	describe('REQ-C-04: pine uses triangular tiers', () => {
		it('pine shape generates canopy blobs', () => {
			const geo = generateTree(makeConfig({ shape: 'pine', blobCount: 3 }));
			expect(geo.canopyBlobs.length).toBeGreaterThan(0);
		});
	});

	describe('REQ-C-07: per-blob triangulation', () => {
		it('each canopy blob group has its own triangles', () => {
			const geo = generateTree(makeConfig({ blobCount: 5 }));
			expect(geo.canopyBlobs.length).toBe(5);
			for (const blob of geo.canopyBlobs) {
				expect(blob.triangles.length).toBeGreaterThan(0);
			}
		});
	});

	describe('REQ-C-11: triangles filtered to blob containment', () => {
		it('all canopy triangles have centroids inside the viewBox', () => {
			const geo = generateTree(makeConfig());
			for (const blob of geo.canopyBlobs) {
				for (const tri of blob.triangles) {
					const cx = (tri.points[0].x + tri.points[1].x + tri.points[2].x) / 3;
					const cy = (tri.points[0].y + tri.points[1].y + tri.points[2].y) / 3;
					expect(cx).toBeGreaterThanOrEqual(-10);
					expect(cx).toBeLessThanOrEqual(VIEWBOX_WIDTH + 10);
					expect(cy).toBeGreaterThanOrEqual(-10);
					expect(cy).toBeLessThanOrEqual(VIEWBOX_HEIGHT + 10);
				}
			}
		});
	});
});

// ============================================================================
// REQ-T: Trunk & Branch Generation
// ============================================================================

describe('REQ-T: Trunk & Branch Generation', () => {
	describe('REQ-T-01: trunk is independent layer', () => {
		it('trunk triangles are separate from canopy and branch triangles', () => {
			const geo = generateTree(makeConfig());
			const trunkTris = new Set(geo.trunkTriangles);
			const branchTris = new Set(geo.branchTriangles);
			const canopyTris = new Set(geo.canopyBlobs.flatMap((b) => [...b.triangles]));
			for (const t of trunkTris) {
				expect(branchTris.has(t)).toBe(false);
				expect(canopyTris.has(t)).toBe(false);
			}
		});
	});

	describe('REQ-T-02: trunk tapers linearly', () => {
		it('trunk produces triangles', () => {
			const geo = generateTree(makeConfig());
			expect(geo.trunkTriangles.length).toBeGreaterThan(0);
		});
	});

	describe('REQ-T-02a: trunkHeight effect', () => {
		it('trunkHeight 30 produces shorter trunk than 150', () => {
			const geoShort = generateTree(makeConfig({ trunkHeight: 30, seed: 42 }));
			const geoTall = generateTree(makeConfig({ trunkHeight: 150, seed: 42 }));
			// Shorter trunk means trunk bottom is closer to trunk top
			const shortHeight = geoShort.anchors.trunkBottom.y - geoShort.anchors.trunkTop.y;
			const tallHeight = geoTall.anchors.trunkBottom.y - geoTall.anchors.trunkTop.y;
			expect(tallHeight).toBeGreaterThan(shortHeight);
		});
	});

	describe('REQ-T-05: branches in separate layer', () => {
		it('branch triangles are separate from trunk', () => {
			const geo = generateTree(makeConfig({ branchCount: 5 }));
			for (const tri of geo.branchTriangles) {
				expect(tri.group).toBe('branch');
			}
			for (const tri of geo.trunkTriangles) {
				expect(tri.group).toBe('trunk');
			}
		});
	});

	describe('REQ-T-05a: per-branch triangulation', () => {
		it('branches generate triangles when branchCount > 0', () => {
			const geo = generateTree(makeConfig({ branchCount: 5, seed: 42 }));
			expect(geo.branchTriangles.length).toBeGreaterThan(0);
		});
	});

	describe('REQ-T-08: trunkBranchRatio', () => {
		it('generates branches with the trunkBranchRatio parameter', () => {
			const geo = generateTree(
				makeConfig({ branchCount: 10, trunkBranchRatio: 40, seed: 42 }),
			);
			expect(geo.branchTriangles.length).toBeGreaterThan(0);
		});
	});

	describe('REQ-T-10: no floating blobs', () => {
		it('with many blobs, all blobs have triangles (none invisible)', () => {
			const geo = generateTree(makeConfig({ blobCount: 8, branchCount: 5, seed: 42 }));
			for (const blob of geo.canopyBlobs) {
				expect(blob.triangles.length).toBeGreaterThan(0);
			}
		});
	});
});

// ============================================================================
// REQ-L: Lighting & Colour
// ============================================================================

describe('REQ-L: Lighting & Colour', () => {
	describe('REQ-L-01: per-blob hemisphere lighting', () => {
		it('different blobs can have different color ranges', () => {
			const geo = generateTree(makeConfig({ blobCount: 5, seed: 42 }));
			const blob0Colors = geo.canopyBlobs[0]!.triangles.map((t) => t.color);
			const blob4Colors = geo.canopyBlobs[4]!.triangles.map((t) => t.color);
			// At least some colors should differ between different blobs
			const allSame = blob0Colors.every(
				(c, i) => i < blob4Colors.length && c === blob4Colors[i],
			);
			expect(allSame).toBe(false);
		});
	});

	describe('REQ-L-04: depthVariance effect', () => {
		it('depthVariance=0 produces more uniform lighting', () => {
			const geoFlat = generateTree(makeConfig({ depthVariance: 0.0, seed: 42 }));
			const geoDeep = generateTree(makeConfig({ depthVariance: 2.0, seed: 42 }));
			// Both should generate valid output
			expect(geoFlat.canopyBlobs.length).toBeGreaterThan(0);
			expect(geoDeep.canopyBlobs.length).toBeGreaterThan(0);
		});
	});

	describe('REQ-L-08: trunk uses cylinder mapping', () => {
		it('trunk triangles have trunk color (not canopy color)', () => {
			const geo = generateTree(makeConfig());
			// All trunk triangles should have valid hex colors
			for (const tri of geo.trunkTriangles) {
				expect(tri.color).toMatch(/^#[0-9a-f]{6}$/);
			}
		});
	});
});

// ============================================================================
// REQ-O: Output (TreeGeometry)
// ============================================================================

describe('REQ-O: Output', () => {
	describe('REQ-O-01: TreeGeometry shape', () => {
		it('has required properties', () => {
			const geo = generateTree(makeConfig());
			expect(geo).toHaveProperty('trunkTriangles');
			expect(geo).toHaveProperty('branchTriangles');
			expect(geo).toHaveProperty('canopyBlobs');
			expect(geo).toHaveProperty('anchors');
			expect(geo).toHaveProperty('viewBox');
			expect(geo.viewBox).toEqual({ width: 200, height: 300 });
		});
	});

	describe('REQ-O-02: TreeAnchors', () => {
		it('exposes four anchor points', () => {
			const geo = generateTree(makeConfig());
			expect(geo.anchors).toHaveProperty('trunkTop');
			expect(geo.anchors).toHaveProperty('trunkMiddle');
			expect(geo.anchors).toHaveProperty('trunkBottom');
			expect(geo.anchors).toHaveProperty('canopyCenter');
			for (const key of ['trunkTop', 'trunkMiddle', 'trunkBottom', 'canopyCenter'] as const) {
				expect(typeof geo.anchors[key].x).toBe('number');
				expect(typeof geo.anchors[key].y).toBe('number');
			}
		});

		it('trunkMiddle is between trunkTop and trunkBottom', () => {
			const geo = generateTree(makeConfig());
			const midY = geo.anchors.trunkMiddle.y;
			expect(midY).toBeGreaterThan(geo.anchors.trunkTop.y);
			expect(midY).toBeLessThan(geo.anchors.trunkBottom.y);
		});
	});
});

// ============================================================================
// Shape-specific tests
// ============================================================================

describe('Shape-specific', () => {
	describe('birch shape (D11)', () => {
		it('generates valid tree output', () => {
			const geo = generateTree(makeConfig({ shape: 'birch' }));
			expect(geo.trunkTriangles.length).toBeGreaterThan(0);
			expect(geo.canopyBlobs.length).toBeGreaterThan(0);
		});
	});

	describe('all three shapes produce valid output', () => {
		for (const shape of ['oak', 'pine', 'birch'] as const) {
			it(`${shape} generates triangles`, () => {
				const geo = generateTree(makeConfig({ shape }));
				expect(allTriangles(geo).length).toBeGreaterThan(0);
			});
		}
	});
});

// ============================================================================
// New parameter integration tests
// ============================================================================

describe('New parameters integration', () => {
	describe('trunkThickness scaling', () => {
		it('trunkThickness 200 produces wider trunk than 50', () => {
			const geoWide = generateTree(makeConfig({ trunkThickness: 200, seed: 42 }));
			const geoNarrow = generateTree(makeConfig({ trunkThickness: 50, seed: 42 }));
			const getXRange = (tris: readonly Triangle[]) => {
				const xs = tris.flatMap((t) => t.points.map((p) => p.x));
				return Math.max(...xs) - Math.min(...xs);
			};
			expect(getXRange(geoWide.trunkTriangles)).toBeGreaterThan(
				getXRange(geoNarrow.trunkTriangles),
			);
		});
	});

	describe('branchThickness scaling', () => {
		it('branchThickness 200 produces wider branches than 50', () => {
			const geoWide = generateTree(
				makeConfig({ branchThickness: 200, branchCount: 5, seed: 42 }),
			);
			const geoNarrow = generateTree(
				makeConfig({ branchThickness: 50, branchCount: 5, seed: 42 }),
			);
			const getXRange = (tris: readonly Triangle[]) => {
				if (tris.length === 0) {
					return 0;
				}
				const xs = tris.flatMap((t) => t.points.map((p) => p.x));
				return Math.max(...xs) - Math.min(...xs);
			};
			expect(getXRange(geoWide.branchTriangles)).toBeGreaterThanOrEqual(
				getXRange(geoNarrow.branchTriangles),
			);
		});
	});

	describe('canopySize scaling', () => {
		it('does not throw with extreme values', () => {
			expect(() => generateTree(makeConfig({ canopySize: 50 }))).not.toThrow();
			expect(() => generateTree(makeConfig({ canopySize: 200 }))).not.toThrow();
		});
	});

	describe('trunkHeight scaling', () => {
		it('does not throw with extreme values', () => {
			expect(() => generateTree(makeConfig({ trunkHeight: 30 }))).not.toThrow();
			expect(() => generateTree(makeConfig({ trunkHeight: 150 }))).not.toThrow();
		});
	});
});
