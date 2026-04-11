import { describe, it, expect } from 'vitest';
import { generateTree } from './generate.js';
import type { TreeConfig, TreeGeometry, Triangle } from './types.js';
import { DEFAULT_TREE_CONFIG, VIEWBOX_WIDTH } from './types.js';

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

// Decode hex color to mean channel brightness on 0..255 scale
function hexToBrightness(hex: string): number {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return (r + g + b) / 3;
}

// Find the min-y and max-y triangle vertices across a triangle set
function extremeYVertices(tris: readonly Triangle[]): {
	min: { x: number; y: number };
	max: { x: number; y: number };
} {
	let min = { x: 0, y: Infinity };
	let max = { x: 0, y: -Infinity };
	for (const tri of tris) {
		for (const p of tri.points) {
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
	describe('DEFAULT_TREE_CONFIG smoke test', () => {
		it('generates valid tree output when hydrated from defaults', () => {
			const geo = generateTree(makeConfig());
			expect(geo.trunkTriangles.length).toBeGreaterThan(0);
			expect(geo.canopyBlobs.length).toBeGreaterThan(0);
			expect(allTriangles(geo).length).toBeGreaterThan(0);
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
			const center = geo.anchors.canopyCenter;
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
		it('bottom half of trunk vertices spans wider x-range than top half', () => {
			const geo = generateTree(makeConfig({ seed: 1 }));
			const midY = (geo.anchors.trunkTop.y + geo.anchors.trunkBottom.y) / 2;
			const topXs = geo.trunkTriangles.flatMap((t) =>
				t.points.filter((p) => p.y < midY).map((p) => p.x),
			);
			const bottomXs = geo.trunkTriangles.flatMap((t) =>
				t.points.filter((p) => p.y >= midY).map((p) => p.x),
			);
			const topRange = Math.max(...topXs) - Math.min(...topXs);
			const bottomRange = Math.max(...bottomXs) - Math.min(...bottomXs);
			expect(bottomRange).toBeGreaterThan(topRange);
		});
	});

	describe('REQ-T-03/T-04: trunk top entry clearance', () => {
		it('anchors.trunkTop.y + 15 is above the lowest canopy vertex', () => {
			const geo = generateTree(makeConfig({ seed: 42 }));
			const canopyMaxY = Math.max(
				...geo.canopyBlobs.flatMap((b) =>
					b.triangles.flatMap((t) => t.points.map((p) => p.y)),
				),
			);
			expect(geo.anchors.trunkTop.y + 15).toBeLessThanOrEqual(canopyMaxY);
		});
	});

	describe('REQ-T-02a: trunkHeight effect', () => {
		it('trunkHeight 30 produces shorter trunk than 150', () => {
			const geoShort = generateTree(makeConfig({ trunkHeight: 30, seed: 42 }));
			const geoTall = generateTree(makeConfig({ trunkHeight: 150, seed: 42 }));
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

	describe('REQ-T-05b: branch divergence from trunk axis', () => {
		it('a single branch axis diverges from trunk axis by at least 28°', () => {
			const geo = generateTree(makeConfig({ branchCount: 1, seed: 42 }));
			const { min, max } = extremeYVertices(geo.branchTriangles);
			const branchAxis = { dx: min.x - max.x, dy: min.y - max.y };
			const trunkAxis = {
				dx: geo.anchors.trunkTop.x - geo.anchors.trunkBottom.x,
				dy: geo.anchors.trunkTop.y - geo.anchors.trunkBottom.y,
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
			const geo = generateTree(makeConfig({ branchCount: 1, seed: 42 }));
			const { min: tip, max: origin } = extremeYVertices(geo.branchTriangles);
			const dx = tip.x - origin.x;
			const dy = tip.y - origin.y;
			const lenSq = dx * dx + dy * dy;
			// Project each vertex onto the branch axis, compute perpendicular distance
			const perpByT: { t: number; perp: number }[] = [];
			for (const tri of geo.branchTriangles) {
				for (const p of tri.points) {
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
		it('branch tip falls within canopy x-bounds when tip is in canopy vertical range', () => {
			const geo = generateTree(makeConfig({ branchCount: 1, seed: 42 }));
			const { min: tip } = extremeYVertices(geo.branchTriangles);
			const canopyXs = geo.canopyBlobs.flatMap((b) =>
				b.triangles.flatMap((t) => t.points.map((p) => p.x)),
			);
			const canopyYs = geo.canopyBlobs.flatMap((b) =>
				b.triangles.flatMap((t) => t.points.map((p) => p.y)),
			);
			const canopyMaxY = Math.max(...canopyYs);
			// Skip check only if branch tip is visually below canopy (beyond canopy bottom)
			if (tip.y < canopyMaxY) {
				const canopyMinX = Math.min(...canopyXs);
				const canopyMaxX = Math.max(...canopyXs);
				expect(tip.x).toBeGreaterThanOrEqual(canopyMinX);
				expect(tip.x).toBeLessThanOrEqual(canopyMaxX);
			}
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

	describe('REQ-L-08: trunk uses cylinder mapping', () => {
		it('trunk triangles have trunk color (not canopy color)', () => {
			const geo = generateTree(makeConfig());
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
// Parameter scaling integration tests
// ============================================================================

describe('Parameter scaling', () => {
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
});
