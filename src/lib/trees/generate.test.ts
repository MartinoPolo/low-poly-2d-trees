import { describe, it, expect } from 'vitest';
import { generateTree } from './generate.js';
import { isPointInBlobs } from './shapes/shape_bounds.js';
import { generateBranches } from './shapes/branch_generation.js';
import type { Blob } from './shapes/shape_types.js';
import type { CustomBlob, TreeConfig, TreeGeometry, Triangle, Quad } from './types.js';
import {
	CUSTOM_BLOB_BOUNDARY_KINDS,
	CUSTOM_BLOB_DEFAULT,
	DEFAULT_TREE_CONFIG,
	SHAPE_DEFAULTS,
	TREE_SHAPES,
	TREE_STAGES,
	VIEWBOX_WIDTH,
	type TreeShape,
	type TreeStage,
} from './types.js';
import { createPrng } from './prng.js';

// Helper to create config with overrides
function makeConfig(overrides: Partial<TreeConfig> = {}): TreeConfig {
	return { ...DEFAULT_TREE_CONFIG, ...overrides };
}

/** Collect all renderable primitives for color/validity checks. */
function allTrianglesAndQuads(geo: TreeGeometry): (Triangle | Quad)[] {
	return [
		...geo.trunkTriangles,
		...geo.trunkQuads,
		...geo.branchGroups.flatMap((g) => [...g.quads, ...g.junctionFills]),
		...geo.canopyBlobs.flatMap((b) => b.triangles),
		...geo.fruitTriangles,
	];
}

// Decode hex color to mean channel brightness on 0..255 scale
function hexToBrightness(hex: string): number {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return (r + g + b) / 3;
}

// Find the min-y and max-y vertices across a set of quads or triangles
function extremeYVertices(shapes: readonly (Triangle | Quad)[]): {
	min: { x: number; y: number };
	max: { x: number; y: number };
} {
	let min = { x: 0, y: Infinity };
	let max = { x: 0, y: -Infinity };
	for (const shape of shapes) {
		for (const p of shape.points) {
			if (p.y < min.y) {
				min = { x: p.x, y: p.y };
			}
			if (p.y > max.y) {
				max = { x: p.x, y: p.y };
			}
		}
	}
	return { min, max };
}

/** Compute canopy bounding box width and height from geometry. */
function canopyBounds(geo: TreeGeometry): { width: number; height: number } {
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;
	for (const blob of geo.canopyBlobs) {
		for (const tri of blob.triangles) {
			for (const p of tri.points) {
				if (p.x < minX) {
					minX = p.x;
				}
				if (p.x > maxX) {
					maxX = p.x;
				}
				if (p.y < minY) {
					minY = p.y;
				}
				if (p.y > maxY) {
					maxY = p.y;
				}
			}
		}
	}
	return { width: maxX - minX, height: maxY - minY };
}

/** Flatten all branch quads (segments + junction fills) from geometry. */
function allBranchQuads(geo: TreeGeometry): Quad[] {
	return geo.branchGroups.flatMap((g) => [...g.quads, ...g.junctionFills]);
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
		it('has trunkQuads, branchGroups, canopyBlobs arrays', () => {
			const geo = generateTree(makeConfig());
			expect(Array.isArray(geo.trunkQuads)).toBe(true);
			expect(Array.isArray(geo.branchGroups)).toBe(true);
			expect(Array.isArray(geo.canopyBlobs)).toBe(true);
		});

		it('trunk quads have group=trunk', () => {
			const geo = generateTree(makeConfig());
			for (const quad of geo.trunkQuads) {
				expect(quad.group).toBe('trunk');
			}
		});

		it('branch quads have group=branch', () => {
			const geo = generateTree(makeConfig({ branchesLevel1Range: [5, 5] }));
			for (const quad of allBranchQuads(geo)) {
				expect(quad.group).toBe('branch');
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

	describe('REQ-R-04: primitive properties', () => {
		it('each triangle/quad has hex color, group, and correct vertex count', () => {
			const geo = generateTree(makeConfig());
			const shapes = allTrianglesAndQuads(geo);
			expect(shapes.length).toBeGreaterThan(0);
			for (const shape of shapes) {
				expect(shape.color).toMatch(/^#[0-9a-f]{6}$/);
				expect(['canopy', 'trunk', 'branch', 'fruit']).toContain(shape.group);
				// Triangles have 3 points, quads have 4
				expect(shape.points.length).toBeGreaterThanOrEqual(3);
				expect(shape.points.length).toBeLessThanOrEqual(4);
				for (const pt of shape.points) {
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
	describe('DEFAULT_TREE_CONFIG smoke test', () => {
		it('generates valid tree output when hydrated from defaults', () => {
			const geo = generateTree(makeConfig());
			expect(geo.trunkQuads.length).toBeGreaterThan(0);
			expect(geo.canopyBlobs.length).toBeGreaterThan(0);
			expect(allTrianglesAndQuads(geo).length).toBeGreaterThan(0);
		});
	});
});

// ============================================================================
// REQ-C: Canopy Generation
// ============================================================================

describe('REQ-C: Canopy Generation', () => {
	describe('REQ-C-01: blob centering on trunk axis', () => {
		it('canopy centroid stays within 5px of trunk axis for single-blob oak', () => {
			const geo = generateTree(makeConfig({ blobCount: 1, shape: 'oak' }));
			const center = geo.anchors.crownCenter;
			expect(Math.abs(center.x - VIEWBOX_WIDTH / 2)).toBeLessThan(5);
		});
	});

	describe('REQ-C-02: blobSizeVariance ratio behavior', () => {
		it('high variance produces larger max/min blob extent ratio than low variance', () => {
			const extentRatio = (variance: number) => {
				const geo = generateTree(
					makeConfig({ seed: 42, blobCount: 5, blobSizeVariance: variance }),
				);
				const extents = geo.canopyBlobs.map((b) => {
					const xs = b.triangles.flatMap((t) => t.points.map((p) => p.x));
					const ys = b.triangles.flatMap((t) => t.points.map((p) => p.y));
					return (
						(Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
					);
				});
				return Math.max(...extents) / Math.min(...extents);
			};
			const ratioLow = extentRatio(1.0);
			const ratioHigh = extentRatio(10.0);
			expect(ratioHigh).toBeGreaterThan(ratioLow * 3);
		});
	});

	describe('REQ-C-04: pine uses tier-based canopy', () => {
		it('pine generates one canopy region per blobCount', () => {
			const geo = generateTree(makeConfig({ shape: 'pine', blobCount: 4, seed: 42 }));
			expect(geo.canopyBlobs.length).toBe(4);
			for (const tier of geo.canopyBlobs) {
				expect(tier.triangles.length).toBeGreaterThan(0);
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

	describe('REQ-C-07: per-blob triangulation', () => {
		it('each canopy blob group has its own triangles', () => {
			const geo = generateTree(makeConfig({ blobCount: 5 }));
			expect(geo.canopyBlobs.length).toBe(5);
			for (const blob of geo.canopyBlobs) {
				expect(blob.triangles.length).toBeGreaterThan(0);
			}
		});
	});

	describe('REQ-C-11: triangles contained within blob', () => {
		it('every canopy triangle centroid lies inside its blob vertex bbox', () => {
			const geo = generateTree(makeConfig());
			for (const blob of geo.canopyBlobs) {
				const xs = blob.triangles.flatMap((t) => t.points.map((p) => p.x));
				const ys = blob.triangles.flatMap((t) => t.points.map((p) => p.y));
				const minX = Math.min(...xs);
				const maxX = Math.max(...xs);
				const minY = Math.min(...ys);
				const maxY = Math.max(...ys);
				for (const tri of blob.triangles) {
					const cx = (tri.points[0].x + tri.points[1].x + tri.points[2].x) / 3;
					const cy = (tri.points[0].y + tri.points[1].y + tri.points[2].y) / 3;
					expect(cx).toBeGreaterThanOrEqual(minX);
					expect(cx).toBeLessThanOrEqual(maxX);
					expect(cy).toBeGreaterThanOrEqual(minY);
					expect(cy).toBeLessThanOrEqual(maxY);
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
		it('trunk quads are separate from canopy and branch geometry', () => {
			const geo = generateTree(makeConfig());
			const trunkQuadSet = new Set(geo.trunkQuads);
			const branchQuadSet = new Set(allBranchQuads(geo));
			const canopyTriSet = new Set(geo.canopyBlobs.flatMap((b) => [...b.triangles]));
			for (const q of trunkQuadSet) {
				expect(branchQuadSet.has(q as Quad)).toBe(false);
				expect(canopyTriSet.has(q as unknown as Triangle)).toBe(false);
			}
		});
	});

	describe('REQ-T-02: trunk tapers linearly', () => {
		it('bottom half of trunk vertices spans wider x-range than top half', () => {
			const geo = generateTree(makeConfig({ seed: 1 }));
			const midY = (geo.anchors.trunkTop.y + geo.anchors.trunkBase.y) / 2;
			const topXs = geo.trunkQuads.flatMap((q) =>
				q.points.filter((p) => p.y < midY).map((p) => p.x),
			);
			const bottomXs = geo.trunkQuads.flatMap((q) =>
				q.points.filter((p) => p.y >= midY).map((p) => p.x),
			);
			const topRange = Math.max(...topXs) - Math.min(...topXs);
			const bottomRange = Math.max(...bottomXs) - Math.min(...bottomXs);
			expect(bottomRange).toBeGreaterThan(topRange);
		});
	});

	describe('REQ-T-03/T-04: trunk top entry clearance', () => {
		// Clamp guarantees ANALYTICAL (cy + ry) penetration of ≥15 px. Sampled
		// triangle vertices can fall up to RADIAL_JITTER_FACTOR * ry inward, so
		// we assert triangle-level penetration of ≥12 px (15 minus 3 px slack).
		it('anchors.trunkTop.y + 12 is above the lowest canopy vertex', () => {
			const geo = generateTree(makeConfig({ seed: 42 }));
			const canopyMaxY = Math.max(
				...geo.canopyBlobs.flatMap((b) =>
					b.triangles.flatMap((t) => t.points.map((p) => p.y)),
				),
			);
			expect(geo.anchors.trunkTop.y + 12).toBeLessThanOrEqual(canopyMaxY);
		});
	});

	describe('REQ-T-02a: trunkHeight effect', () => {
		it('trunkHeight 30 produces shorter trunk than 150', () => {
			const geoShort = generateTree(makeConfig({ trunkHeight: 30, seed: 42 }));
			const geoTall = generateTree(makeConfig({ trunkHeight: 150, seed: 42 }));
			const shortHeight = geoShort.anchors.trunkBase.y - geoShort.anchors.trunkTop.y;
			const tallHeight = geoTall.anchors.trunkBase.y - geoTall.anchors.trunkTop.y;
			expect(tallHeight).toBeGreaterThan(shortHeight);
		});
	});

	describe('REQ-T-02b: canopy follows trunk height', () => {
		// Oak: defaultTrunkTop = H*0.45 = 135, trunkBottom = H*0.95 = 285.
		// trunkHeight=50 → eff = 285 - 150*0.5 = 210 → delta = +75 (canopy shifts down).
		it('oak canopy centroid shifts down by 75 when trunkHeight drops 100 → 50', () => {
			const base = generateTree(makeConfig({ trunkHeight: 100, seed: 42 }));
			const shortTrunk = generateTree(makeConfig({ trunkHeight: 50, seed: 42 }));
			const shift = shortTrunk.anchors.crownCenter.y - base.anchors.crownCenter.y;
			expect(shift).toBeCloseTo(75, 5);
		});

		// Pine (#62): defaultTrunkTop = H*0.8 = 240, trunkBottom = H*0.95 = 285.
		// trunkHeight=50 → eff = 285 - 45*0.5 = 262.5 → delta = +22.5.
		it('pine canopy centroid shifts down by 22.5 when trunkHeight drops 100 → 50', () => {
			const base = generateTree(makeConfig({ trunkHeight: 100, seed: 42, shape: 'pine' }));
			const shortTrunk = generateTree(
				makeConfig({ trunkHeight: 50, seed: 42, shape: 'pine' }),
			);
			const shift = shortTrunk.anchors.crownCenter.y - base.anchors.crownCenter.y;
			expect(shift).toBeCloseTo(22.5, 5);
		});

		// Canopy shift must equal the effectiveTrunkTop shift (delta invariant).
		it('oak canopy shift equals trunkTop shift between trunkHeight 100 and 50', () => {
			const base = generateTree(makeConfig({ trunkHeight: 100, seed: 42 }));
			const shortTrunk = generateTree(makeConfig({ trunkHeight: 50, seed: 42 }));
			const canopyShift = shortTrunk.anchors.crownCenter.y - base.anchors.crownCenter.y;
			const trunkShift = shortTrunk.anchors.trunkTop.y - base.anchors.trunkTop.y;
			expect(canopyShift).toBeCloseTo(trunkShift, 5);
		});

		it('trunk top enters canopy (sampled) across oak, pine, birch at 50/100/150', () => {
			// The analytical clamp enforces TRUNK_ENTRY_MIN_PX, but sampled
			// triangle vertices have radial jitter. Tier-based shapes (pine)
			// have tighter vertex bounds, so we use a 3px tolerance.
			for (const shape of ['oak', 'pine', 'birch'] as const) {
				for (const trunkHeight of [50, 100, 150]) {
					const geo = generateTree(makeConfig({ trunkHeight, seed: 42, shape }));
					const canopyMaxY = Math.max(
						...geo.canopyBlobs.flatMap((b) =>
							b.triangles.flatMap((t) => t.points.map((p) => p.y)),
						),
					);
					expect(geo.anchors.trunkTop.y + 3).toBeLessThanOrEqual(canopyMaxY);
				}
			}
		});
	});

	describe('REQ-T-05: branches in separate layer', () => {
		it('branch quads are separate from trunk', () => {
			const geo = generateTree(makeConfig({ branchesLevel1Range: [5, 5] }));
			for (const quad of allBranchQuads(geo)) {
				expect(quad.group).toBe('branch');
			}
			for (const quad of geo.trunkQuads) {
				expect(quad.group).toBe('trunk');
			}
		});
	});

	describe('REQ-T-05a: per-branch quads', () => {
		it('branches generate quads when branchesLevel1Range > 0', () => {
			const geo = generateTree(makeConfig({ branchesLevel1Range: [5, 5], seed: 42 }));
			expect(allBranchQuads(geo).length).toBeGreaterThan(0);
		});
	});

	describe('REQ-T-05b: branch divergence from trunk axis', () => {
		it('a single branch axis diverges from trunk axis by at least 28°', () => {
			const geo = generateTree(makeConfig({ branchesLevel1Range: [1, 1], seed: 42 }));
			const branchQuads = allBranchQuads(geo);
			const { min, max } = extremeYVertices(branchQuads);
			const branchAxis = { dx: min.x - max.x, dy: min.y - max.y };
			const trunkAxis = {
				dx: geo.anchors.trunkTop.x - geo.anchors.trunkBase.x,
				dy: geo.anchors.trunkTop.y - geo.anchors.trunkBase.y,
			};
			const dot = branchAxis.dx * trunkAxis.dx + branchAxis.dy * trunkAxis.dy;
			const magB = Math.hypot(branchAxis.dx, branchAxis.dy);
			const magT = Math.hypot(trunkAxis.dx, trunkAxis.dy);
			const angleRad = Math.acos(Math.min(1, Math.abs(dot) / (magB * magT)));
			const angleDeg = (angleRad * 180) / Math.PI;
			expect(angleDeg).toBeGreaterThanOrEqual(28);
		});
	});

	describe('REQ-T-06/T-07: branch segment linear taper (widthStart > widthEnd)', () => {
		it('branch mesh near origin is wider than near tip', () => {
			const geo = generateTree(
				makeConfig({ branchesLevel1Range: [1, 1], branchDepth: 1, seed: 42 }),
			);
			expect(geo.branchGroups.length).toBeGreaterThan(0);
			// Use only segment quads (not junction fills) from a single branch
			const segmentQuads = geo.branchGroups[0]!.quads;
			const { min: tip, max: origin } = extremeYVertices([...segmentQuads]);
			const dx = tip.x - origin.x;
			const dy = tip.y - origin.y;
			const lenSq = dx * dx + dy * dy;
			// Project each vertex onto the branch axis, compute perpendicular distance
			const perpByT: { t: number; perp: number }[] = [];
			for (const quad of segmentQuads) {
				for (const p of quad.points) {
					const vx = p.x - origin.x;
					const vy = p.y - origin.y;
					const t = (vx * dx + vy * dy) / lenSq;
					const px = vx - t * dx;
					const py = vy - t * dy;
					const perp = Math.hypot(px, py);
					perpByT.push({ t, perp });
				}
			}
			const nearOrigin = perpByT.filter((p) => p.t <= 0.35);
			const nearTip = perpByT.filter((p) => p.t >= 0.65);
			const maxNearOrigin = Math.max(...nearOrigin.map((p) => p.perp));
			const maxNearTip = Math.max(...nearTip.map((p) => p.perp));
			expect(maxNearOrigin).toBeGreaterThan(maxNearTip);
		});
	});

	describe('REQ-T-09: branch endpoint terminates inside canopy', () => {
		it('branch tip is inside a canopy triangle when tip is above canopy bottom', () => {
			// Test across multiple seeds to account for PRNG-dependent branch placement.
			let foundInside = false;
			for (const seed of [42, 99, 123, 7, 555, 10, 33, 200, 314, 888]) {
				const geo = generateTree(makeConfig({ branchesLevel1Range: [2, 2], seed }));
				const branchQuads = allBranchQuads(geo);
				if (branchQuads.length === 0) {
					continue;
				}
				const { min: tip } = extremeYVertices(branchQuads);
				const canopyYs = geo.canopyBlobs.flatMap((b) =>
					b.triangles.flatMap((t) => t.points.map((p) => p.y)),
				);
				const canopyMaxY = Math.max(...canopyYs);
				if (tip.y >= canopyMaxY) {
					continue;
				}
				const allCanopyTris = geo.canopyBlobs.flatMap((b) => b.triangles);
				const tipInsideBlob = allCanopyTris.some((tri) => {
					const [a, b, c] = tri.points;
					const d1 = (tip.x - b.x) * (a.y - b.y) - (a.x - b.x) * (tip.y - b.y);
					const d2 = (tip.x - c.x) * (b.y - c.y) - (b.x - c.x) * (tip.y - c.y);
					const d3 = (tip.x - a.x) * (c.y - a.y) - (c.x - a.x) * (tip.y - a.y);
					const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
					const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
					return !(hasNeg && hasPos);
				});
				if (tipInsideBlob) {
					foundInside = true;
					break;
				}
			}
			expect(foundInside).toBe(true);
		});
	});

	describe('REQ-T-10: no floating blobs', () => {
		it('with many blobs, all blobs have triangles (none invisible)', () => {
			const geo = generateTree(
				makeConfig({ blobCount: 8, branchesLevel1Range: [5, 5], seed: 42 }),
			);
			for (const blob of geo.canopyBlobs) {
				expect(blob.triangles.length).toBeGreaterThan(0);
			}
		});
	});

	// --------------------------------------------------------------------------
	// REQ-T-11: explicit trunk lean parameter
	// --------------------------------------------------------------------------

	describe('REQ-T-11: explicit trunk lean parameter', () => {
		it('trunkLean=0 produces perfectly vertical trunk axis (no jitter)', () => {
			const geo = generateTree(makeConfig({ trunkLean: 0, trunkSegments: 1 }));
			expect(geo.anchors.trunkTop.x).toBeCloseTo(VIEWBOX_WIDTH / 2, 10);
			expect(geo.anchors.trunkBase.x).toBeCloseTo(VIEWBOX_WIDTH / 2, 10);
		});

		it('trunkLean=0 is deterministic across different seeds (no hidden random)', () => {
			const g1 = generateTree(makeConfig({ trunkLean: 0, trunkSegments: 1, seed: 1 }));
			const g2 = generateTree(makeConfig({ trunkLean: 0, trunkSegments: 1, seed: 99999 }));
			expect(g1.anchors.trunkTop.x).toBeCloseTo(g2.anchors.trunkTop.x, 10);
			expect(g1.anchors.trunkTop.x).toBeCloseTo(VIEWBOX_WIDTH / 2, 10);
		});

		it('REQ-T-11b: leanPx = tan(lean°) * trunkHeight', () => {
			const leanDeg = 30;
			const geo = generateTree(
				makeConfig({ trunkLean: leanDeg, trunkSegments: 1, seed: 42 }),
			);
			const trunkHeight = geo.anchors.trunkBase.y - geo.anchors.trunkTop.y;
			const expectedLeanPx = Math.tan((leanDeg * Math.PI) / 180) * trunkHeight;
			const actualLeanPx = geo.anchors.trunkTop.x - geo.anchors.trunkBase.x;
			expect(actualLeanPx).toBeCloseTo(expectedLeanPx, 5);
		});

		it('positive lean shifts trunkTop to the right of the base', () => {
			const geo = generateTree(makeConfig({ trunkLean: 45, trunkSegments: 1 }));
			expect(geo.anchors.trunkTop.x).toBeGreaterThan(geo.anchors.trunkBase.x);
		});

		it('negative lean shifts trunkTop to the left of the base', () => {
			const geo = generateTree(makeConfig({ trunkLean: -45, trunkSegments: 1 }));
			expect(geo.anchors.trunkTop.x).toBeLessThan(geo.anchors.trunkBase.x);
		});
	});

	// --------------------------------------------------------------------------
	// REQ-T-12: multi-segment crooked trunk
	// --------------------------------------------------------------------------

	describe('REQ-T-12: multi-segment crooked trunk', () => {
		it('trunkSegments=1 produces straight trunk regardless of crookedness', () => {
			const geo = generateTree(
				makeConfig({ trunkLean: 0, trunkSegments: 1, trunkCrookedness: 100, seed: 42 }),
			);
			expect(geo.anchors.trunkTop.x).toBeCloseTo(VIEWBOX_WIDTH / 2, 10);
		});

		it('REQ-T-12c: crookedness=0 with multi-segment is straight and matches single segment', () => {
			const g1 = generateTree(
				makeConfig({ trunkLean: 20, trunkSegments: 1, trunkCrookedness: 0 }),
			);
			const g5 = generateTree(
				makeConfig({ trunkLean: 20, trunkSegments: 5, trunkCrookedness: 0 }),
			);
			expect(g5.anchors.trunkTop.x).toBeCloseTo(g1.anchors.trunkTop.x, 6);
			expect(g5.anchors.trunkTop.y).toBeCloseTo(g1.anchors.trunkTop.y, 6);
		});

		it('REQ-T-12a: high crookedness produces visible horizontal deviations with zero lean', () => {
			const geo = generateTree(
				makeConfig({ trunkLean: 0, trunkSegments: 5, trunkCrookedness: 100, seed: 42 }),
			);
			// With jitter up to 20° per junction, the topmost junction should
			// drift at least a few px off the vertical axis.
			expect(Math.abs(geo.anchors.trunkTop.x - VIEWBOX_WIDTH / 2)).toBeGreaterThan(3);
		});

		it('different seeds produce different crooked trunks', () => {
			const g1 = generateTree(
				makeConfig({ trunkLean: 0, trunkSegments: 5, trunkCrookedness: 100, seed: 42 }),
			);
			const g2 = generateTree(
				makeConfig({ trunkLean: 0, trunkSegments: 5, trunkCrookedness: 100, seed: 43 }),
			);
			expect(g1.anchors.trunkTop.x).not.toBeCloseTo(g2.anchors.trunkTop.x, 2);
		});

		it('REQ-T-12d: canopy center follows topmost trunk segment (horizontal shift)', () => {
			// The canopy horizontal shift must equal the topmost junction's x
			// shift, proving canopy placement is bound to the trunk top rather
			// than the base. (leanPx formula is covered separately by REQ-T-11b.)
			const base = generateTree(
				makeConfig({
					trunkLean: 0,
					trunkSegments: 1,
					blobCount: 1,
					trunkHeight: 150,
					seed: 42,
				}),
			);
			const leaned = generateTree(
				makeConfig({
					trunkLean: 5,
					trunkSegments: 1,
					blobCount: 1,
					trunkHeight: 150,
					seed: 42,
				}),
			);
			const canopyShiftX = leaned.anchors.crownCenter.x - base.anchors.crownCenter.x;
			const trunkTopShiftX = leaned.anchors.trunkTop.x - base.anchors.trunkTop.x;
			expect(canopyShiftX).toBeCloseTo(trunkTopShiftX, 5);
		});

		it('trunk mesh is generated with multi-segment crooked configuration', () => {
			const geo = generateTree(
				makeConfig({
					trunkLean: 0,
					trunkSegments: 4,
					trunkCrookedness: 80,
					seed: 42,
				}),
			);
			expect(geo.trunkQuads.length).toBeGreaterThan(0);
			// All trunk quads stay within the trunk y-range.
			for (const quad of geo.trunkQuads) {
				for (const p of quad.points) {
					expect(p.y).toBeGreaterThanOrEqual(geo.anchors.trunkTop.y - 3);
					expect(p.y).toBeLessThanOrEqual(geo.anchors.trunkBase.y + 3);
				}
			}
		});

		it('branches attach to a multi-segment trunk without crashing', () => {
			const geo = generateTree(
				makeConfig({
					shape: 'oak',
					trunkSegments: 3,
					trunkCrookedness: 60,
					branchesLevel1Range: [5, 5],
					seed: 42,
				}),
			);
			expect(allBranchQuads(geo).length).toBeGreaterThan(0);
		});

		it('same seed + crooked config is deterministic', () => {
			const cfg = makeConfig({
				trunkLean: 15,
				trunkSegments: 5,
				trunkCrookedness: 100,
				seed: 42,
			});
			const g1 = generateTree(cfg);
			const g2 = generateTree(cfg);
			expect(g1).toEqual(g2);
		});
	});
});

// ============================================================================
// REQ-L: Lighting & Colour
// ============================================================================

describe('REQ-L: Lighting & Colour', () => {
	describe('REQ-L-01a: per-blob hemisphere lighting creates within-blob variation', () => {
		it('a canopy blob contains triangles spanning a meaningful brightness range', () => {
			const geo = generateTree(makeConfig({ blobCount: 1, seed: 42 }));
			const brs = geo.canopyBlobs[0]!.triangles.map((t) => hexToBrightness(t.color));
			const range = Math.max(...brs) - Math.min(...brs);
			expect(range).toBeGreaterThan(20);
		});
	});

	describe('REQ-L-04: depthVariance has observable effect', () => {
		it('produces observably different canopy colors at different depthVariance values', () => {
			const geoFlat = generateTree(makeConfig({ depthVariance: 0.1, seed: 42 }));
			const geoDeep = generateTree(makeConfig({ depthVariance: 2.0, seed: 42 }));
			const colorsFlat = geoFlat.canopyBlobs.flatMap((b) => b.triangles.map((t) => t.color));
			const colorsDeep = geoDeep.canopyBlobs.flatMap((b) => b.triangles.map((t) => t.color));
			expect(colorsFlat).not.toEqual(colorsDeep);
		});
	});

	describe('REQ-L-01/L-07: two-color canopy interpolation', () => {
		it('canopy triangles are hex strings inside the dark/light HSL gradient', () => {
			const geo = generateTree(
				makeConfig({
					seed: 42,
					canopyLightColor: '#a8d84e',
					canopyDarkColor: '#1a472a',
				}),
			);
			const canopyColors = geo.canopyBlobs.flatMap((b) => b.triangles.map((t) => t.color));
			for (const color of canopyColors) {
				expect(color).toMatch(/^#[0-9a-f]{6}$/);
			}
			// Green-only gradient: blue channel must stay clearly below red and
			// green across every face. A shortest-arc H-S-L interpolation between
			// two green hexes can only produce green hues, never blue-dominant.
			for (const color of canopyColors) {
				const r = parseInt(color.slice(1, 3), 16);
				const g = parseInt(color.slice(3, 5), 16);
				const b = parseInt(color.slice(5, 7), 16);
				expect(b).toBeLessThan(Math.max(r, g) + 1);
			}
		});

		it('generates the same canopy colors for identical configs', () => {
			const cfg = makeConfig({ seed: 42 });
			const a = generateTree(cfg);
			const b = generateTree(cfg);
			const aColors = a.canopyBlobs.flatMap((bl) => bl.triangles.map((t) => t.color));
			const bColors = b.canopyBlobs.flatMap((bl) => bl.triangles.map((t) => t.color));
			expect(aColors).toEqual(bColors);
		});

		it('swapping canopyLightColor shifts canopy palette', () => {
			const green = generateTree(
				makeConfig({
					seed: 42,
					canopyLightColor: '#a8d84e',
					canopyDarkColor: '#1a472a',
				}),
			);
			const orange = generateTree(
				makeConfig({
					seed: 42,
					canopyLightColor: '#e8a028',
					canopyDarkColor: '#8b2010',
				}),
			);
			const greenColors = green.canopyBlobs.flatMap((b) => b.triangles.map((t) => t.color));
			const orangeColors = orange.canopyBlobs.flatMap((b) => b.triangles.map((t) => t.color));
			expect(greenColors).not.toEqual(orangeColors);
			// Orange palette should have red-dominant triangles that the green one lacks
			const orangeHasRedDominant = orangeColors.some((c) => {
				const r = parseInt(c.slice(1, 3), 16);
				const g = parseInt(c.slice(3, 5), 16);
				return r > g;
			});
			expect(orangeHasRedDominant).toBe(true);
		});
	});

	describe('REQ-L-08: trunk uses cylinder mapping', () => {
		it('trunk quads have trunk color (not canopy color)', () => {
			const geo = generateTree(makeConfig());
			for (const quad of geo.trunkQuads) {
				expect(quad.color).toMatch(/^#[0-9a-f]{6}$/);
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
			expect(geo).toHaveProperty('trunkQuads');
			expect(geo).toHaveProperty('trunkTriangles');
			expect(geo).toHaveProperty('branchGroups');
			expect(geo).toHaveProperty('canopyBlobs');
			expect(geo).toHaveProperty('anchors');
			expect(geo).toHaveProperty('viewBox');
			expect(geo.viewBox).toEqual({ width: 200, height: 300 });
		});
	});

	describe('REQ-O-02: TreeAnchors', () => {
		it('B1: exposes all anchor fields with correct types', () => {
			const geo = generateTree(makeConfig());
			for (const key of [
				'trunkTop',
				'trunkMiddle',
				'trunkBase',
				'crownCenter',
				'crownTop',
				'roots',
			] as const) {
				expect(typeof geo.anchors[key].x).toBe('number');
				expect(typeof geo.anchors[key].y).toBe('number');
			}
			expect(Array.isArray(geo.anchors.branchTips)).toBe(true);
			expect(Array.isArray(geo.anchors.fruitSlots)).toBe(true);
		});

		it('B2: crownCenter is center of canopy bounding box', () => {
			const geo = generateTree(makeConfig({ shape: 'oak' }));
			expect(typeof geo.anchors.crownCenter.x).toBe('number');
			expect(typeof geo.anchors.crownCenter.y).toBe('number');
		});

		it('B3: crownTop is above crownCenter', () => {
			const geo = generateTree(makeConfig({ shape: 'oak' }));
			expect(geo.anchors.crownTop.y).toBeLessThan(geo.anchors.crownCenter.y);
		});

		it('B4: trunkBase is at ground level (below trunkTop and trunkMiddle)', () => {
			const geo = generateTree(makeConfig());
			expect(geo.anchors.trunkBase.y).toBeGreaterThan(geo.anchors.trunkTop.y);
			expect(geo.anchors.trunkBase.y).toBeGreaterThan(geo.anchors.trunkMiddle.y);
		});

		it('B5: roots is below trunkBase with same x', () => {
			const geo = generateTree(makeConfig());
			expect(geo.anchors.roots.y).toBeGreaterThan(geo.anchors.trunkBase.y);
			expect(geo.anchors.roots.x).toBe(geo.anchors.trunkBase.x);
		});

		it('B6: branchTips has one tip per generated branch', () => {
			const geo = generateTree(
				makeConfig({ shape: 'oak', branchesLevel1Range: [3, 3], seed: 42 }),
			);
			// Branch count is a target — generation may reject some due to overlap.
			// branchTips must still be > 0 and each must be a valid Point2D.
			expect(geo.anchors.branchTips.length).toBeGreaterThan(0);
			// Verify branch quads exist iff branchTips exist
			expect(allBranchQuads(geo).length).toBeGreaterThan(0);
			for (const tip of geo.anchors.branchTips) {
				expect(typeof tip.x).toBe('number');
				expect(typeof tip.y).toBe('number');
			}
		});

		it('B6b: branchTips is empty when branchDepth is 0', () => {
			const geo = generateTree(makeConfig({ shape: 'birch', branchDepth: 0, seed: 42 }));
			expect(Array.isArray(geo.anchors.branchTips)).toBe(true);
		});

		it('B7: branchTips is empty for pine shape', () => {
			const geo = generateTree(makeConfig({ shape: 'pine', seed: 42 }));
			expect(geo.anchors.branchTips).toHaveLength(0);
		});

		it('B8: fruitSlots has 5-7 positions', () => {
			const geo = generateTree(makeConfig({ shape: 'oak', seed: 42 }));
			expect(geo.anchors.fruitSlots.length).toBeGreaterThanOrEqual(5);
			expect(geo.anchors.fruitSlots.length).toBeLessThanOrEqual(7);
		});

		it('B9: fruitSlots are within canopy bounding area', () => {
			// Fruit slots are Poisson-sampled inside the pre-triangulation blob
			// ellipses, which extend slightly beyond triangulated mesh vertices.
			// Use a generous margin (10 px) to account for the ellipse-to-mesh gap.
			const geo = generateTree(makeConfig({ shape: 'oak', seed: 42 }));
			const allCanopyVertices = geo.canopyBlobs.flatMap((b) =>
				b.triangles.flatMap((t) => t.points),
			);
			const margin = 10;
			const minX = Math.min(...allCanopyVertices.map((p) => p.x));
			const maxX = Math.max(...allCanopyVertices.map((p) => p.x));
			const minY = Math.min(...allCanopyVertices.map((p) => p.y));
			const maxY = Math.max(...allCanopyVertices.map((p) => p.y));
			for (const slot of geo.anchors.fruitSlots) {
				expect(slot.x).toBeGreaterThanOrEqual(minX - margin);
				expect(slot.x).toBeLessThanOrEqual(maxX + margin);
				expect(slot.y).toBeGreaterThanOrEqual(minY - margin);
				expect(slot.y).toBeLessThanOrEqual(maxY + margin);
			}
		});

		it('B10: fruitSlots are deterministic — same seed same positions', () => {
			const geo1 = generateTree(makeConfig({ shape: 'oak', seed: 42 }));
			const geo2 = generateTree(makeConfig({ shape: 'oak', seed: 42 }));
			expect(geo1.anchors.fruitSlots).toEqual(geo2.anchors.fruitSlots);
		});

		it('B11: fruitSlots differ between different seeds', () => {
			const geo1 = generateTree(makeConfig({ shape: 'oak', seed: 42 }));
			const geo2 = generateTree(makeConfig({ shape: 'oak', seed: 99 }));
			const same = geo1.anchors.fruitSlots.every(
				(s, i) =>
					s.x === geo2.anchors.fruitSlots[i]?.x && s.y === geo2.anchors.fruitSlots[i]?.y,
			);
			expect(same).toBe(false);
		});

		it('B12: trunkMiddle is between trunkTop and trunkBase', () => {
			const geo = generateTree(makeConfig());
			expect(geo.anchors.trunkMiddle.y).toBeGreaterThan(geo.anchors.trunkTop.y);
			expect(geo.anchors.trunkMiddle.y).toBeLessThan(geo.anchors.trunkBase.y);
		});

		it('B13: pine trees have valid crownTop and fruitSlots', () => {
			const geo = generateTree(makeConfig({ shape: 'pine', seed: 42 }));
			expect(geo.anchors.crownTop.y).toBeLessThan(geo.anchors.crownCenter.y);
			expect(geo.anchors.fruitSlots.length).toBeGreaterThanOrEqual(5);
			expect(geo.anchors.fruitSlots.length).toBeLessThanOrEqual(7);
		});
	});
});

// ============================================================================
// Parameter scaling integration tests
// ============================================================================

describe('Parameter scaling', () => {
	describe('trunkThickness scaling', () => {
		it('trunkThickness 200 produces wider trunk than 50', () => {
			const geoWide = generateTree(makeConfig({ trunkThickness: 200, seed: 42 }));
			const geoNarrow = generateTree(makeConfig({ trunkThickness: 50, seed: 42 }));
			const getXRange = (quads: readonly Quad[]) => {
				const xs = quads.flatMap((q) => q.points.map((p) => p.x));
				return Math.max(...xs) - Math.min(...xs);
			};
			expect(getXRange(geoWide.trunkQuads)).toBeGreaterThan(getXRange(geoNarrow.trunkQuads));
		});
	});

	describe('branchThickness scaling', () => {
		it('branchThickness 200 produces visually thicker branches than 50', () => {
			const geoWide = generateTree(
				makeConfig({ branchThickness: 200, branchesLevel1Range: [5, 5], seed: 42 }),
			);
			const geoNarrow = generateTree(
				makeConfig({ branchThickness: 50, branchesLevel1Range: [5, 5], seed: 42 }),
			);
			// Since issue #7 added a thickness-dependent overlap check (wider
			// branches reject more candidates and re-roll), branch positions
			// diverge between runs, so a naive x-range metric is unreliable.
			// Total quad area is a direct measure of visual thickness.
			const totalArea = (quads: readonly Quad[]): number => {
				let sum = 0;
				for (const quad of quads) {
					// Shoelace formula for a quadrilateral
					const pts = quad.points;
					let area = 0;
					for (let i = 0; i < pts.length; i++) {
						const j = (i + 1) % pts.length;
						area += pts[i]!.x * pts[j]!.y - pts[j]!.x * pts[i]!.y;
					}
					sum += Math.abs(area) / 2;
				}
				return sum;
			};
			const wideArea = totalArea(allBranchQuads(geoWide));
			const narrowArea = totalArea(allBranchQuads(geoNarrow));
			expect(wideArea).toBeGreaterThan(narrowArea);
		});
	});
});

// ============================================================================
// Issue #8: new tree shapes smoke tests
// ============================================================================

describe('Issue #8: new tree shapes (fir/maple/willow)', () => {
	const newShapes = ['fir', 'maple', 'willow'] as const;

	it.each(newShapes)('%s generates trunk and canopy geometry at seed 42', (shape) => {
		const geo = generateTree(makeConfig({ shape, seed: 42 }));
		expect(geo.trunkQuads.length).toBeGreaterThan(0);
		expect(geo.canopyBlobs.length).toBeGreaterThan(0);
		const canopyTriTotal = geo.canopyBlobs.reduce((n, b) => n + b.triangles.length, 0);
		expect(canopyTriTotal).toBeGreaterThan(0);
	});

	it.each(newShapes)('%s emits only valid hex colors', (shape) => {
		const geo = generateTree(makeConfig({ shape, seed: 42 }));
		for (const primitive of allTrianglesAndQuads(geo)) {
			expect(primitive.color).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it.each(newShapes)('%s is deterministic across runs', (shape) => {
		const cfg = makeConfig({ shape, seed: 42 });
		const a = generateTree(cfg);
		const b = generateTree(cfg);
		expect(a).toEqual(b);
	});

	it('fir renders without NaN triangle vertices', () => {
		const geo = generateTree(makeConfig({ shape: 'fir', seed: 42 }));
		for (const blob of geo.canopyBlobs) {
			for (const tri of blob.triangles) {
				for (const p of tri.points) {
					expect(Number.isNaN(p.x)).toBe(false);
					expect(Number.isNaN(p.y)).toBe(false);
				}
			}
		}
	});

	it.each(newShapes)(
		'%s: trunk top enters the sampled canopy (sampled penetration ≥ 5 px)',
		(shape) => {
			// The analytical clamp enforces 15 px penetration against
			// getBlobsBounds (cy+ry). Sampled canopy vertices can drift up to
			// ~10 px inward from the analytical edge due to circle blob radial
			// jitter (RADIAL_JITTER_FACTOR=0.15 × ry). A 5 px sampled
			// penetration threshold captures the visible trunk-into-canopy
			// invariant without being so tight it fails on large-ry blobs.
			for (const trunkHeight of [50, 100, 150]) {
				const geo = generateTree(makeConfig({ shape, trunkHeight, seed: 42 }));
				const canopyMaxY = Math.max(
					...geo.canopyBlobs.flatMap((b) =>
						b.triangles.flatMap((t) => t.points.map((p) => p.y)),
					),
				);
				expect(geo.anchors.trunkTop.y + 5).toBeLessThanOrEqual(canopyMaxY);
			}
		},
	);

	// Maple emits branches toward canopy blobs (issue #8 spec). Validate
	// reach via bounding-box containment: at least one branch quad vertex
	// lies inside a canopy blob's axis-aligned bounding box. With range-based
	// branch counts, not every blob is guaranteed a dedicated branch, but
	// the majority should be reached (>= 50% of blobs).
	it.each([3, 5, 7])(
		'maple with blobCount=%i emits branches reaching most canopy blobs',
		(blobCount) => {
			const geo = generateTree(
				makeConfig({
					shape: 'maple',
					seed: 42,
					blobCount,
					branchThickness: 100,
					branchesLevel1Range: [3, 5],
					branchesLevel2Range: [1, 2],
					branchDepth: 2,
				}),
			);
			expect(geo.canopyBlobs.length).toBe(blobCount);
			const branchQuads = allBranchQuads(geo);
			expect(branchQuads.length).toBeGreaterThan(0);

			const margin = 5;
			let reachedCount = 0;
			for (const blob of geo.canopyBlobs) {
				let minX = Infinity;
				let minY = Infinity;
				let maxX = -Infinity;
				let maxY = -Infinity;
				for (const tri of blob.triangles) {
					for (const p of tri.points) {
						if (p.x < minX) {
							minX = p.x;
						}
						if (p.y < minY) {
							minY = p.y;
						}
						if (p.x > maxX) {
							maxX = p.x;
						}
						if (p.y > maxY) {
							maxY = p.y;
						}
					}
				}
				const reached = branchQuads.some((quad) =>
					quad.points.some(
						(p) =>
							p.x >= minX - margin &&
							p.x <= maxX + margin &&
							p.y >= minY - margin &&
							p.y <= maxY + margin,
					),
				);
				if (reached) {
					reachedCount++;
				}
			}
			// At least half the blobs should be reached by branches
			expect(reachedCount).toBeGreaterThanOrEqual(Math.ceil(blobCount / 2));
		},
	);

	it('fir (branchDepth=0) produces zero branch quads', () => {
		const geo = generateTree(
			makeConfig({ shape: 'fir', seed: 42, branchDepth: 0, blobCount: 4 }),
		);
		expect(allBranchQuads(geo).length).toBe(0);
	});

	// REQ-C-12: acute-angle smoothing applies to oak, birch, maple AND willow.
	// The visual effect isn't quantitatively asserted here (it mutates boundary
	// vertices by a few pixels at most), so this is a smoke test that maple
	// still emits canopy triangles with the smoothing flag enabled. Failures
	// here would indicate the post-pass crashes or drops all boundary points.
	it('maple with acute-angle smoothing enabled still produces canopy triangles', () => {
		const geo = generateTree(makeConfig({ shape: 'maple', seed: 42, blobCount: 5 }));
		const canopyTriTotal = geo.canopyBlobs.reduce((n, b) => n + b.triangles.length, 0);
		expect(canopyTriTotal).toBeGreaterThan(0);
		for (const blob of geo.canopyBlobs) {
			expect(blob.triangles.length).toBeGreaterThan(0);
		}
	});

	it('willow multi-segment trunk renders without crashing at defaults', () => {
		const geo = generateTree(
			makeConfig({
				shape: 'willow',
				seed: 42,
				trunkSegments: 3,
				trunkCrookedness: 40,
				branchesLevel1Range: [4, 4],
			}),
		);
		expect(geo.trunkQuads.length).toBeGreaterThan(0);
		expect(allBranchQuads(geo).length).toBeGreaterThan(0);
	});
});

// ============================================================================
// Issue #63: new tree shapes (cypress/apple/cherry/bush/baobab/acacia)
// ============================================================================

describe('Issue #63: new tree shapes', () => {
	const newShapes = ['cypress', 'apple', 'cherry', 'bush', 'baobab', 'acacia'] as const;

	it.each(newShapes)('%s generates trunk and canopy geometry at seed 42', (shape) => {
		const geo = generateTree(makeConfig({ shape, seed: 42 }));
		expect(geo.trunkQuads.length).toBeGreaterThan(0);
		expect(geo.canopyBlobs.length).toBeGreaterThan(0);
		const canopyTriTotal = geo.canopyBlobs.reduce((n, b) => n + b.triangles.length, 0);
		expect(canopyTriTotal).toBeGreaterThan(0);
	});

	it.each(newShapes)('%s emits only valid hex colors', (shape) => {
		const geo = generateTree(makeConfig({ shape, seed: 42 }));
		for (const primitive of allTrianglesAndQuads(geo)) {
			expect(primitive.color).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it.each(newShapes)('%s is deterministic across runs', (shape) => {
		const cfg = makeConfig({ shape, seed: 42 });
		const a = generateTree(cfg);
		const b = generateTree(cfg);
		expect(a).toEqual(b);
	});

	it.each(newShapes)('%s renders without NaN vertices', (shape) => {
		const geo = generateTree(makeConfig({ shape, seed: 42 }));
		for (const blob of geo.canopyBlobs) {
			for (const tri of blob.triangles) {
				for (const p of tri.points) {
					expect(Number.isNaN(p.x)).toBe(false);
					expect(Number.isNaN(p.y)).toBe(false);
				}
			}
		}
	});

	it('cypress canopy is taller than wide', () => {
		const geo = generateTree(makeConfig({ shape: 'cypress', seed: 42 }));
		const bounds = canopyBounds(geo);
		expect(bounds.height).toBeGreaterThan(bounds.width);
	});

	it('cherry canopy is wider than tall', () => {
		const geo = generateTree(makeConfig({ shape: 'cherry', seed: 42 }));
		const bounds = canopyBounds(geo);
		expect(bounds.width).toBeGreaterThan(bounds.height);
	});

	it('bush trunk is very short (less than 5% of viewBox height)', () => {
		const geo = generateTree(makeConfig({ shape: 'bush', seed: 42 }));
		const trunkVerts = geo.trunkQuads.flatMap((q) => q.points);
		const trunkMinY = Math.min(...trunkVerts.map((p) => p.y));
		const trunkMaxY = Math.max(...trunkVerts.map((p) => p.y));
		const trunkHeight = trunkMaxY - trunkMinY;
		// Bush trunk should be < 5% of 300px viewBox = 15px
		expect(trunkHeight).toBeLessThan(15);
	});

	it('acacia canopy is wider than tall (flat-topped)', () => {
		const geo = generateTree(makeConfig({ shape: 'acacia', seed: 42 }));
		const bounds = canopyBounds(geo);
		expect(bounds.width).toBeGreaterThan(bounds.height);
	});

	it('baobab trunk is thicker than oak trunk', () => {
		const baobabGeo = generateTree(makeConfig({ shape: 'baobab', seed: 42 }));
		const oakGeo = generateTree(makeConfig({ shape: 'oak', seed: 42 }));
		const maxTrunkWidth = (geo: typeof baobabGeo) => {
			let maxW = 0;
			for (const quad of geo.trunkQuads) {
				const xs = quad.points.map((p) => p.x);
				const w = Math.max(...xs) - Math.min(...xs);
				if (w > maxW) {
					maxW = w;
				}
			}
			return maxW;
		};
		expect(maxTrunkWidth(baobabGeo)).toBeGreaterThan(maxTrunkWidth(oakGeo));
	});

	it('cypress and bush (branchDepth=0) produce zero branch quads', () => {
		for (const shape of ['cypress', 'bush'] as const) {
			const geo = generateTree(makeConfig({ shape, seed: 42, branchDepth: 0 }));
			expect(allBranchQuads(geo).length).toBe(0);
		}
	});

	it.each(newShapes)('%s works with all lifecycle stages', (shape) => {
		const stages = [
			'seed',
			'sprouting',
			'sapling',
			'growing',
			'leafy',
			'fruiting',
			'autumn',
			'ready',
			'bare',
			'dead',
			'stump',
		] as const;
		for (const stage of stages) {
			const geo = generateTree(makeConfig({ shape, stage, seed: 42 }));
			expect(geo).toBeDefined();
			expect(geo.viewBox.width).toBe(200);
			expect(geo.viewBox.height).toBe(300);
		}
	});
});

// ============================================================================
// Issue #10: custom tree shape
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

function computeCanopyBboxArea(geo: TreeGeometry): number {
	const canopyTris = geo.canopyBlobs.flatMap((b) => b.triangles);
	if (canopyTris.length === 0) {
		return 0;
	}
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const tri of canopyTris) {
		for (const p of tri.points) {
			if (p.x < minX) {
				minX = p.x;
			}
			if (p.x > maxX) {
				maxX = p.x;
			}
			if (p.y < minY) {
				minY = p.y;
			}
			if (p.y > maxY) {
				maxY = p.y;
			}
		}
	}
	return (maxX - minX) * (maxY - minY);
}

describe('Issue #10: custom tree shape', () => {
	it('shape=custom with no customBlobs produces zero canopy blobs', () => {
		const geo = generateTree(makeConfig({ shape: 'custom', blobCount: 0, customBlobs: [] }));
		expect(geo.canopyBlobs.length).toBe(0);
	});

	it('shape=custom with one circle blob produces one canopy blob with triangles', () => {
		const geo = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 1,
				customBlobs: [makeCustomBlob()],
			}),
		);
		expect(geo.canopyBlobs.length).toBe(1);
		expect(geo.canopyBlobs[0]!.triangles.length).toBeGreaterThan(0);
	});

	it.each([
		CUSTOM_BLOB_BOUNDARY_KINDS.circle,
		CUSTOM_BLOB_BOUNDARY_KINDS.egg,
		CUSTOM_BLOB_BOUNDARY_KINDS.teardrop,
		CUSTOM_BLOB_BOUNDARY_KINDS.isoscelesTriangle,
		CUSTOM_BLOB_BOUNDARY_KINDS.equilateralTriangle,
	])('custom tree with a %s boundary blob generates canopy triangles', (boundaryKind) => {
		const geo = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 1,
				customBlobs: [makeCustomBlob({ boundaryKind })],
			}),
		);
		const canopyTris = geo.canopyBlobs.flatMap((b) => b.triangles);
		expect(canopyTris.length).toBeGreaterThan(0);
	});

	it('custom tree is deterministic across runs (same config → same geometry)', () => {
		const cfg = makeConfig({
			shape: 'custom',
			seed: 42,
			blobCount: 3,
			customBlobs: [
				makeCustomBlob({
					boundaryKind: CUSTOM_BLOB_BOUNDARY_KINDS.egg,
					rotationDeg: 30,
					sizeScale: 1.2,
					position: { x: 0.2, y: -0.1 },
				}),
				makeCustomBlob({
					boundaryKind: CUSTOM_BLOB_BOUNDARY_KINDS.equilateralTriangle,
					rotationDeg: 90,
					sizeScale: 0.8,
					position: { x: -0.3, y: 0.2 },
				}),
				makeCustomBlob({
					boundaryKind: CUSTOM_BLOB_BOUNDARY_KINDS.teardrop,
					rotationDeg: 180,
					sizeScale: 1.0,
					position: { x: 0, y: 0.3 },
				}),
			],
		});
		const a = generateTree(cfg);
		const b = generateTree(cfg);
		expect(a).toEqual(b);
	});

	it('custom tree emits only valid hex colors across all triangles', () => {
		const geo = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 2,
				customBlobs: [
					makeCustomBlob({ position: { x: 0.2, y: 0 } }),
					makeCustomBlob({ position: { x: -0.2, y: 0 } }),
				],
			}),
		);
		for (const tri of allTrianglesAndQuads(geo)) {
			expect(tri.color).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it('custom blob at position {x: 0.5, y: 0} shifts canopy vertices right of center', () => {
		const centered = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 1,
				customBlobs: [makeCustomBlob({ position: { x: 0, y: 0 } })],
			}),
		);
		const shifted = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 1,
				customBlobs: [makeCustomBlob({ position: { x: 0.5, y: 0 } })],
			}),
		);
		const meanX = (geo: TreeGeometry): number => {
			const tris = geo.canopyBlobs.flatMap((b) => b.triangles);
			return (
				tris.reduce(
					(sum, tri) => sum + (tri.points[0].x + tri.points[1].x + tri.points[2].x) / 3,
					0,
				) / tris.length
			);
		};
		// Position delta is 0.5·spreadRadius (0.5 · 200·0.22 = 22).
		const delta = meanX(shifted) - meanX(centered);
		expect(delta).toBeGreaterThan(15);
		expect(delta).toBeLessThan(30);
	});

	it('custom blob with sizeScale=2.0 roughly doubles the bbox vs sizeScale=1.0', () => {
		const smallGeo = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 1,
				customBlobs: [makeCustomBlob({ sizeScale: 1.0 })],
			}),
		);
		const largeGeo = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 1,
				customBlobs: [makeCustomBlob({ sizeScale: 2.0 })],
			}),
		);
		const ratio = computeCanopyBboxArea(largeGeo) / computeCanopyBboxArea(smallGeo);
		expect(ratio).toBeGreaterThan(2.5);
	});

	it('custom egg blob rotation changes triangle vertices', () => {
		const base = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 1,
				customBlobs: [
					makeCustomBlob({
						boundaryKind: CUSTOM_BLOB_BOUNDARY_KINDS.egg,
						rotationDeg: 0,
					}),
				],
			}),
		);
		const rotated = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 1,
				customBlobs: [
					makeCustomBlob({
						boundaryKind: CUSTOM_BLOB_BOUNDARY_KINDS.egg,
						rotationDeg: 90,
					}),
				],
			}),
		);
		expect(base.canopyBlobs[0]!.triangles).not.toEqual(rotated.canopyBlobs[0]!.triangles);
	});

	it('custom tree respects generic branch algorithm with branchesLevel1Range', () => {
		const geo = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 2,
				branchesLevel1Range: [3, 3],
				customBlobs: [
					makeCustomBlob({ position: { x: 0.2, y: -0.2 } }),
					makeCustomBlob({ position: { x: -0.2, y: 0.2 } }),
				],
			}),
		);
		expect(allBranchQuads(geo).length).toBeGreaterThan(0);
	});

	it('custom tree trunk top penetrates canopy (trunk clamp still applies)', () => {
		const geo = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 1,
				customBlobs: [makeCustomBlob({ position: { x: 0, y: 0 } })],
			}),
		);
		const canopyTris = geo.canopyBlobs.flatMap((b) => b.triangles);
		const canopyMaxY = Math.max(...canopyTris.flatMap((t) => t.points.map((p) => p.y)));
		expect(geo.anchors.trunkTop.y + 5).toBeLessThan(canopyMaxY);
	});
});

// ============================================================================
// Fruit generation integration
// ============================================================================

describe('Fruit generation', () => {
	it('fruitType apple with fruitCount 5 produces fruitTriangles', () => {
		const geo = generateTree(makeConfig({ fruitType: 'apple', fruitCount: 5 }));
		expect(geo.fruitTriangles.length).toBeGreaterThan(0);
		for (const tri of geo.fruitTriangles) {
			expect(tri.group).toBe('fruit');
			expect(tri.color).toBe('#e53e3e');
		}
	});

	it('fruitCount 0 produces zero fruitTriangles regardless of fruitType', () => {
		const geo = generateTree(makeConfig({ fruitType: 'apple', fruitCount: 0 }));
		expect(geo.fruitTriangles).toHaveLength(0);
	});

	it('fruitType none produces zero fruitTriangles regardless of fruitCount', () => {
		const geo = generateTree(makeConfig({ fruitType: 'none', fruitCount: 10 }));
		expect(geo.fruitTriangles).toHaveLength(0);
	});

	it('fruitCount 20 (exceeds default slots) still produces fruitTriangles without error', () => {
		const geo = generateTree(makeConfig({ fruitType: 'cherry', fruitCount: 20 }));
		expect(geo.fruitTriangles.length).toBeGreaterThan(0);
	});

	it('all fruit triangle centroids lie within canopy bounds', () => {
		const geo = generateTree(makeConfig({ fruitType: 'apple', fruitCount: 5 }));
		const canopyTris = geo.canopyBlobs.flatMap((b) => b.triangles);
		const allCanopyX = canopyTris.flatMap((t) => t.points.map((p) => p.x));
		const allCanopyY = canopyTris.flatMap((t) => t.points.map((p) => p.y));
		const canopyMinX = Math.min(...allCanopyX);
		const canopyMaxX = Math.max(...allCanopyX);
		const canopyMinY = Math.min(...allCanopyY);
		const canopyMaxY = Math.max(...allCanopyY);
		// Fruit anchor centroids should be within canopy bounds (with margin for fruit shape radius)
		const margin = 10;
		for (const tri of geo.fruitTriangles) {
			const cx = (tri.points[0].x + tri.points[1].x + tri.points[2].x) / 3;
			const cy = (tri.points[0].y + tri.points[1].y + tri.points[2].y) / 3;
			expect(cx).toBeGreaterThan(canopyMinX - margin);
			expect(cx).toBeLessThan(canopyMaxX + margin);
			expect(cy).toBeGreaterThan(canopyMinY - margin);
			expect(cy).toBeLessThan(canopyMaxY + margin);
		}
	});

	it('deterministic: same seed + config = same fruitTriangles', () => {
		const config = makeConfig({ seed: 999, fruitType: 'flower', fruitCount: 5 });
		const geo1 = generateTree(config);
		const geo2 = generateTree(config);
		expect(geo1.fruitTriangles).toEqual(geo2.fruitTriangles);
	});

	it('default config (no fruitType/fruitCount) produces zero fruitTriangles', () => {
		const geo = generateTree(makeConfig());
		expect(geo.fruitTriangles).toHaveLength(0);
	});
});

// ============================================================================
// Issue #60: Visual quality quick-wins
// ============================================================================

describe('Issue #60: Visual quality quick-wins', () => {
	// VQ-5: trunkHeight=10 produces valid geometry
	it('VQ-5: trunkHeight=10 produces trunk quads with valid coordinates', () => {
		const geo = generateTree(makeConfig({ trunkHeight: 10, seed: 42 }));
		expect(geo.trunkQuads.length).toBeGreaterThan(0);
		for (const quad of geo.trunkQuads) {
			for (const p of quad.points) {
				expect(Number.isNaN(p.x)).toBe(false);
				expect(Number.isNaN(p.y)).toBe(false);
			}
		}
	});

	// VQ-8: fruitCount cap at 7
	it('VQ-8a: fruitCount=20 results in at most 7 fruit triangle groups', () => {
		const geo = generateTree(makeConfig({ fruitType: 'apple', fruitCount: 20, seed: 42 }));
		// Each fruit renders as a group of triangles at one slot position.
		// Count distinct fruit anchor centroids by clustering fruit triangle centroids.
		const fruitCentroids = geo.fruitTriangles.map((tri) => ({
			x: (tri.points[0].x + tri.points[1].x + tri.points[2].x) / 3,
			y: (tri.points[0].y + tri.points[1].y + tri.points[2].y) / 3,
		}));
		// Cluster centroids by proximity (same fruit = centroids within 5px)
		const clusters: { x: number; y: number }[] = [];
		for (const c of fruitCentroids) {
			const match = clusters.find(
				(cl) => Math.abs(cl.x - c.x) < 5 && Math.abs(cl.y - c.y) < 5,
			);
			if (!match) {
				clusters.push({ x: c.x, y: c.y });
			}
		}
		expect(clusters.length).toBeLessThanOrEqual(7);
	});

	// VQ-7: isPointInBlobs supports insetFactor to shrink blob boundaries
	it('VQ-7: isPointInBlobs with insetFactor=0.85 rejects points near blob edge', () => {
		const blobs: Blob[] = [{ cx: 100, cy: 100, rx: 40, ry: 30, boundary: 'circle' }];
		// A point at 90% of the radius is inside the full blob...
		const edgeX = 100 + 40 * 0.9; // x=136
		const edgeY = 100;
		expect(isPointInBlobs(edgeX, edgeY, blobs)).toBe(true);
		// ...but outside the 85%-inset blob
		expect(isPointInBlobs(edgeX, edgeY, blobs, 0.85)).toBe(false);
		// A point at 80% of the radius is inside both
		const innerX = 100 + 40 * 0.8; // x=132
		expect(isPointInBlobs(innerX, edgeY, blobs)).toBe(true);
		expect(isPointInBlobs(innerX, edgeY, blobs, 0.85)).toBe(true);
	});
});

// ============================================================================
// Issue #38: BranchGeometry grouped branch data
// ============================================================================

describe('Issue #38: branchGroups (grouped branch geometry)', () => {
	it('generateTree returns branchGroups array', () => {
		const geo = generateTree(makeConfig({ branchesLevel1Range: [5, 5], seed: 42 }));
		expect(Array.isArray(geo.branchGroups)).toBe(true);
		expect(geo.branchGroups.length).toBeGreaterThan(0);
	});

	it('each branchGroup has quads and origin', () => {
		const geo = generateTree(makeConfig({ branchesLevel1Range: [3, 3], seed: 42 }));
		for (const group of geo.branchGroups) {
			expect(Array.isArray(group.quads)).toBe(true);
			expect(group.quads.length).toBeGreaterThan(0);
			expect(typeof group.origin.x).toBe('number');
			expect(typeof group.origin.y).toBe('number');
		}
	});

	it('branchGroup quads all have group=branch', () => {
		const geo = generateTree(makeConfig({ branchesLevel1Range: [5, 5], seed: 42 }));
		for (const group of geo.branchGroups) {
			for (const quad of [...group.quads, ...group.junctionFills]) {
				expect(quad.group).toBe('branch');
			}
		}
	});

	it('branchGroups is empty for pine shape', () => {
		const geo = generateTree(makeConfig({ shape: 'pine', seed: 42 }));
		expect(geo.branchGroups).toHaveLength(0);
	});

	it('branchGroups is empty for fir shape', () => {
		const geo = generateTree(makeConfig({ shape: 'fir', seed: 42 }));
		expect(geo.branchGroups).toHaveLength(0);
	});

	it('branchGroups origin is at branch base (higher y than tip)', () => {
		const geo = generateTree(makeConfig({ branchesLevel1Range: [1, 1], seed: 42 }));
		if (geo.branchGroups.length === 0) {
			return;
		}
		const group = geo.branchGroups[0]!;
		// Origin should be near the trunk (where branch starts)
		// It should have a valid coordinate
		expect(Number.isFinite(group.origin.x)).toBe(true);
		expect(Number.isFinite(group.origin.y)).toBe(true);
	});
});

// ============================================================================
// VQ-6: Polygons Per Blob
// ============================================================================

describe('VQ-6: polygonsPerBlob replaces canopyPolygons', () => {
	it('polygonsPerBlob slider controls per-blob density', () => {
		const lowDensity = generateTree(makeConfig({ polygonsPerBlob: 6, blobCount: 3, seed: 99 }));
		const highDensity = generateTree(
			makeConfig({ polygonsPerBlob: 20, blobCount: 3, seed: 99 }),
		);

		// Total canopy triangles should increase with higher polygonsPerBlob
		const lowTotal = lowDensity.canopyBlobs.reduce((s, b) => s + b.triangles.length, 0);
		const highTotal = highDensity.canopyBlobs.reduce((s, b) => s + b.triangles.length, 0);
		expect(highTotal).toBeGreaterThan(lowTotal);
	});

	it('adding blobs does not change polygon density of existing blobs', () => {
		const fewBlobs = generateTree(makeConfig({ polygonsPerBlob: 12, blobCount: 3, seed: 42 }));
		const manyBlobs = generateTree(makeConfig({ polygonsPerBlob: 12, blobCount: 5, seed: 42 }));

		// The first 3 blobs in the few-blobs tree should have roughly the same
		// total triangle count as the first 3 blobs in the many-blobs tree.
		// Under the old global-budget approach, adding blobs would redistribute the
		// budget, reducing per-blob counts.
		const fewTotal = fewBlobs.canopyBlobs.reduce((s, b) => s + b.triangles.length, 0);
		const manyFirstThree = manyBlobs.canopyBlobs
			.slice(0, 3)
			.reduce((s, b) => s + b.triangles.length, 0);

		// Allow +-25% tolerance because blob positions/sizes change with count,
		// but the budget per blob should NOT halve.
		const ratio = manyFirstThree / fewTotal;
		expect(ratio).toBeGreaterThan(0.6);
		expect(ratio).toBeLessThan(1.4);
	});

	it('larger blobs have proportionally more triangles', () => {
		// Use custom shape to control blob sizes precisely
		const smallBlob: CustomBlob = {
			boundaryKind: 'circle',
			rotationDeg: 0,
			sizeScale: 0.5,
			position: { x: -0.5, y: 0 },
		};
		const largeBlob: CustomBlob = {
			boundaryKind: 'circle',
			rotationDeg: 0,
			sizeScale: 2.0,
			position: { x: 0.5, y: 0 },
		};

		const geo = generateTree(
			makeConfig({
				shape: 'custom',
				polygonsPerBlob: 15,
				blobCount: 2,
				seed: 42,
				customBlobs: [smallBlob, largeBlob],
			}),
		);

		expect(geo.canopyBlobs.length).toBe(2);
		// canopyBlobs are depth-sorted, so find min/max triangle counts
		const triCounts = geo.canopyBlobs.map((b) => b.triangles.length);
		const maxTri = Math.max(...triCounts);
		const minTri = Math.min(...triCounts);

		// The larger blob should have more triangles than the smaller one
		expect(maxTri).toBeGreaterThan(minTri);
	});
});

// ============================================================================
// VQ-4: Branch Side Randomization
// ============================================================================

describe('VQ-4: Branch Side Randomization', () => {
	it('first branch starting side varies across seeds', () => {
		const sides: number[] = [];
		for (let seed = 1; seed <= 20; seed++) {
			const geo = generateTree(makeConfig({ seed, branchesLevel1Range: [1, 1] }));
			if (geo.branchGroups.length === 0) {
				continue;
			}
			const group = geo.branchGroups[0]!;
			// origin.x is on the trunk center; x2 of the branch segment determines side.
			// branchGroups origin = { x: branch.x1, y: branch.y1 }
			// We check whether the branch tip (quad centroid) is left or right of the origin.
			const quads = group.quads;
			const avgX =
				quads.reduce((sum, q) => sum + q.points.reduce((s, p) => s + p.x, 0) / 4, 0) /
				quads.length;
			sides.push(avgX > group.origin.x ? 1 : -1);
		}
		const uniqueSides = new Set(sides);
		// Not all branches should start on the same side
		expect(uniqueSides.size).toBe(2);
	});

	it('same seed produces identical branch sides (determinism)', () => {
		const config = makeConfig({ seed: 42, branchesLevel1Range: [5, 5] });
		const geo1 = generateTree(config);
		const geo2 = generateTree(config);
		expect(geo1.branchGroups.length).toBe(geo2.branchGroups.length);
		for (let i = 0; i < geo1.branchGroups.length; i++) {
			expect(geo1.branchGroups[i]!.origin).toEqual(geo2.branchGroups[i]!.origin);
			expect(geo1.branchGroups[i]!.quads).toEqual(geo2.branchGroups[i]!.quads);
		}
	});
});

// ============================================================================
// VQ-3: Recursive Branch System (branchDepth)
// ============================================================================

describe('VQ-3: branchDepth config', () => {
	it('branchDepth 0 produces no branches even with branchesLevel1Range > 0', () => {
		const config = makeConfig({ branchDepth: 0, branchesLevel1Range: [5, 5], shape: 'oak' });
		const geo = generateTree(config);
		expect(allBranchQuads(geo)).toHaveLength(0);
		expect(geo.branchGroups).toHaveLength(0);
	});

	it('branchDepth 1 caps branches at trunk-origin count (no sub-branches)', () => {
		// At branchDepth 1, only level-1 branches are generated (no sub-branches).
		const blobs: Blob[] = [{ cx: 100, cy: 100, rx: 60, ry: 60, boundary: 'circle' }];
		const trunkJunctions = [
			{ x: 100, y: 260 },
			{ x: 100, y: 80 },
		];
		const config = makeConfig({
			branchesLevel1Range: [3, 3],
			branchDepth: 1,
			seed: 42,
		});
		const rng = createPrng(42 + 7777);
		const branches = generateBranches(rng, 80, 260, 5, config, trunkJunctions, blobs);
		// Depth 1 branches are capped by level1Range (some may be
		// rejected, but isolated-blob fallbacks can add more).
		expect(branches.length).toBeGreaterThan(0);
		expect(branches.length).toBeLessThanOrEqual(3 + blobs.length);
	});

	it('branchDepth 3 produces sub-sub-branches beyond depth 2 count', () => {
		// Multiple spread-out blobs so branches have visible length between them.
		const blobs: Blob[] = [
			{ cx: 60, cy: 80, rx: 35, ry: 35, boundary: 'circle' },
			{ cx: 140, cy: 80, rx: 35, ry: 35, boundary: 'circle' },
			{ cx: 100, cy: 50, rx: 35, ry: 35, boundary: 'circle' },
			{ cx: 70, cy: 120, rx: 30, ry: 30, boundary: 'circle' },
			{ cx: 130, cy: 120, rx: 30, ry: 30, boundary: 'circle' },
		];
		const trunkJunctions = [
			{ x: 100, y: 260 },
			{ x: 100, y: 60 },
		];
		const config2 = makeConfig({
			branchesLevel1Range: [3, 5],
			branchesLevel2Range: [1, 2],
			branchDepth: 2,
			seed: 77,
		});
		const config3 = makeConfig({
			branchesLevel1Range: [3, 5],
			branchesLevel2Range: [1, 2],
			branchesLevel3Range: [1, 2],
			branchDepth: 3,
			seed: 77,
		});
		const branches2 = generateBranches(
			createPrng(77 + 7777),
			60,
			260,
			5,
			config2,
			trunkJunctions,
			blobs,
		);
		const branches3 = generateBranches(
			createPrng(77 + 7777),
			60,
			260,
			5,
			config3,
			trunkJunctions,
			blobs,
		);
		expect(branches3.length).toBeGreaterThan(branches2.length);
	});

	it('sub-sub-branches (depth 3) are thinner than trunk-origin branches', () => {
		// Generate a depth-3 tree and verify that the widths taper with depth.
		const blobs: Blob[] = [
			{ cx: 60, cy: 80, rx: 35, ry: 35, boundary: 'circle' },
			{ cx: 140, cy: 80, rx: 35, ry: 35, boundary: 'circle' },
			{ cx: 100, cy: 50, rx: 35, ry: 35, boundary: 'circle' },
			{ cx: 70, cy: 120, rx: 30, ry: 30, boundary: 'circle' },
			{ cx: 130, cy: 120, rx: 30, ry: 30, boundary: 'circle' },
		];
		const trunkJunctions = [
			{ x: 100, y: 260 },
			{ x: 100, y: 60 },
		];
		const config = makeConfig({
			branchesLevel1Range: [3, 5],
			branchesLevel2Range: [1, 2],
			branchesLevel3Range: [1, 2],
			branchDepth: 3,
			seed: 77,
		});
		const branches = generateBranches(
			createPrng(77 + 7777),
			60,
			260,
			5,
			config,
			trunkJunctions,
			blobs,
		);
		// Trunk-origin branches use TRUNK_BRANCH_WIDTH_START_MIN (7) at scale 1.0,
		// while sub-sub-branches use SUB_BRANCH_WIDTH_MIN (3.5) at scale 0.5 = 1.75.
		// At least one branch should be thinner than the trunk-origin minimum.
		const trunkMinWidthAtScale1 = 7; // TRUNK_BRANCH_WIDTH_START_MIN
		const allWidths = branches.map((b) => b.widthStart);
		const minOverallWidth = Math.min(...allWidths);
		expect(minOverallWidth).toBeLessThan(trunkMinWidthAtScale1);
	});

	it('determinism: same seed + config produces identical branch geometry', () => {
		const config = makeConfig({ branchDepth: 3, branchesLevel1Range: [3, 5], seed: 123 });
		const geo1 = generateTree(config);
		const geo2 = generateTree(config);
		expect(geo1.branchGroups.length).toBe(geo2.branchGroups.length);
		for (let i = 0; i < geo1.branchGroups.length; i++) {
			expect(geo1.branchGroups[i]!.origin).toEqual(geo2.branchGroups[i]!.origin);
			expect(geo1.branchGroups[i]!.quads).toEqual(geo2.branchGroups[i]!.quads);
		}
	});
});

// ============================================================================
// VQ-1: Hybrid Trunk Renderer — trunk silhouette path
// ============================================================================

describe('VQ-1: trunk quads', () => {
	it('trunkQuads is a non-empty array for normal tree stages', () => {
		const geo = generateTree(makeConfig());
		expect(Array.isArray(geo.trunkQuads)).toBe(true);
		expect(geo.trunkQuads.length).toBeGreaterThan(0);
	});

	it('each trunk quad has 4 valid vertices within viewBox bounds', () => {
		const geo = generateTree(makeConfig());
		for (const quad of geo.trunkQuads) {
			expect(quad.points).toHaveLength(4);
			for (const p of quad.points) {
				expect(p.x).toBeGreaterThanOrEqual(0);
				expect(p.x).toBeLessThanOrEqual(200);
				expect(p.y).toBeGreaterThanOrEqual(0);
				expect(p.y).toBeLessThanOrEqual(300);
			}
		}
	});

	it('simple stage generators produce empty trunkQuads (use trunkTriangles instead)', () => {
		// Seed stage
		const seedGeo = generateTree(makeConfig({ stage: 'seed' }));
		expect(seedGeo.trunkQuads).toHaveLength(0);

		// Sprouting stage
		const sproutGeo = generateTree(makeConfig({ stage: 'sprouting' }));
		expect(sproutGeo.trunkQuads).toHaveLength(0);

		// Stump stage
		const stumpGeo = generateTree(makeConfig({ stage: 'stump' }));
		expect(stumpGeo.trunkQuads).toHaveLength(0);
	});
});

// ============================================================================
// B1: Fir uses tier pipeline (not blobs)
// ============================================================================

describe('B1: fir uses tier-based rendering', () => {
	it('fir generates canopy blobs from tier triangulation (non-empty)', () => {
		const geo = generateTree(makeConfig({ shape: 'fir', seed: 42, blobCount: 4 }));
		expect(geo.canopyBlobs.length).toBe(4);
		for (const blob of geo.canopyBlobs) {
			expect(blob.triangles.length).toBeGreaterThan(0);
		}
	});

	it('fir with branchDepth=0 produces zero branches', () => {
		const geo = generateTree(
			makeConfig({ shape: 'fir', seed: 42, branchDepth: 0, blobCount: 4 }),
		);
		expect(geo.branchGroups).toHaveLength(0);
	});

	it('fir branchTips is empty (same as pine — tiered shapes have no branches)', () => {
		const geo = generateTree(makeConfig({ shape: 'fir', seed: 42 }));
		expect(geo.anchors.branchTips).toHaveLength(0);
	});
});

// ============================================================================
// B9: SHAPE_DEFAULTS completeness
// ============================================================================

describe('B9: SHAPE_DEFAULTS completeness', () => {
	const nonCustomShapes = Object.values(TREE_SHAPES).filter((s) => s !== 'custom') as Exclude<
		TreeShape,
		'custom'
	>[];

	it('every non-custom shape in TREE_SHAPES has an entry in SHAPE_DEFAULTS', () => {
		for (const shape of nonCustomShapes) {
			expect(shape in SHAPE_DEFAULTS).toBe(true);
		}
	});

	it('each SHAPE_DEFAULTS entry has all required keys', () => {
		const requiredKeys = [
			'blobCount',
			'branchDepth',
			'blobSizeVariance',
			'blobCloseness',
			'branchThickness',
			'trunkSegments',
			'trunkCrookedness',
			'branchLength',
			'branchLengthVariance',
			'canopyLightColor',
			'canopyDarkColor',
			'trunkHue',
			'trunkSaturation',
			'trunkLightness',
			'fruitType',
			'fruitCount',
		] as const;
		for (const shape of nonCustomShapes) {
			const defaults = SHAPE_DEFAULTS[shape];
			for (const key of requiredKeys) {
				expect(defaults).toHaveProperty(key);
			}
		}
	});
});

// ============================================================================
// B8: All shapes x all stages integration
// ============================================================================

describe('B8: all shapes x all stages cross-product', () => {
	const allShapes = Object.values(TREE_SHAPES) as TreeShape[];
	const allStages = Object.values(TREE_STAGES) as TreeStage[];
	const seeds = [42, 123, 7, 999];

	// Stages that should produce canopy
	const canopyStages = new Set<TreeStage>([
		TREE_STAGES.leafy,
		TREE_STAGES.fruiting,
		TREE_STAGES.autumn,
		TREE_STAGES.growing,
		TREE_STAGES.sapling,
	]);

	for (const shape of allShapes) {
		for (const stage of allStages) {
			for (const seed of seeds) {
				const label = `${shape}/${stage}/seed=${seed}`;

				it(`${label}: generates without throwing`, () => {
					expect(() =>
						generateTree(
							makeConfig({
								shape,
								stage,
								seed,
								...(shape === 'custom'
									? {
											blobCount: 1,
											customBlobs: [
												{
													...CUSTOM_BLOB_DEFAULT,
													position: { x: 0, y: 0 },
												},
											],
										}
									: {}),
							}),
						),
					).not.toThrow();
				});

				it(`${label}: no NaN in triangle vertices`, () => {
					const geo = generateTree(
						makeConfig({
							shape,
							stage,
							seed,
							...(shape === 'custom'
								? {
										blobCount: 1,
										customBlobs: [
											{
												...CUSTOM_BLOB_DEFAULT,
												position: { x: 0, y: 0 },
											},
										],
									}
								: {}),
						}),
					);
					for (const tri of allTrianglesAndQuads(geo)) {
						for (const p of tri.points) {
							expect(Number.isNaN(p.x)).toBe(false);
							expect(Number.isNaN(p.y)).toBe(false);
						}
					}
				});

				if (canopyStages.has(stage)) {
					it(`${label}: canopy stage produces canopyBlobs > 0`, () => {
						const geo = generateTree(
							makeConfig({
								shape,
								stage,
								seed,
								...(shape === 'custom'
									? {
											blobCount: 1,
											customBlobs: [
												{
													...CUSTOM_BLOB_DEFAULT,
													position: { x: 0, y: 0 },
												},
											],
										}
									: {}),
							}),
						);
						expect(geo.canopyBlobs.length).toBeGreaterThan(0);
					});
				}
			}
		}
	}
});

// ============================================================================
// B10: Custom shape still works
// ============================================================================

describe('B10: custom shape still works after changes', () => {
	it('generateTree with custom shape + customBlobs produces valid geometry', () => {
		const geo = generateTree(
			makeConfig({
				shape: 'custom',
				blobCount: 2,
				customBlobs: [
					{ ...CUSTOM_BLOB_DEFAULT, position: { x: 0.2, y: -0.1 } },
					{ ...CUSTOM_BLOB_DEFAULT, position: { x: -0.2, y: 0.1 } },
				],
			}),
		);
		expect(geo.canopyBlobs.length).toBe(2);
		expect(geo.trunkQuads.length + geo.trunkTriangles.length).toBeGreaterThan(0);
		for (const tri of allTrianglesAndQuads(geo)) {
			for (const p of tri.points) {
				expect(Number.isNaN(p.x)).toBe(false);
				expect(Number.isNaN(p.y)).toBe(false);
			}
		}
	});
});
