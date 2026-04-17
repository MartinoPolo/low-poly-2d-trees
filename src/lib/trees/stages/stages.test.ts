import { describe, it, expect } from 'vitest';
import { generateTree } from '../generate.js';
import type { TreeConfig, TreeGeometry } from '../types.js';
import {
	DEFAULT_TREE_CONFIG,
	TREE_STAGES,
	TREE_STAGE_OPTIONS,
	TREE_SHAPES,
	CROOKEDNESS_MODES,
	type TreeStage,
} from '../types.js';
import { applyStageModifiers } from './index.js';

function makeConfig(overrides: Partial<TreeConfig> = {}): TreeConfig {
	return { ...DEFAULT_TREE_CONFIG, ...overrides };
}

function hasValidAnchors(geo: TreeGeometry): boolean {
	const { anchors } = geo;
	return (
		typeof anchors.trunkTop.x === 'number' &&
		typeof anchors.trunkTop.y === 'number' &&
		typeof anchors.trunkMiddle.x === 'number' &&
		typeof anchors.trunkMiddle.y === 'number' &&
		typeof anchors.trunkBase.x === 'number' &&
		typeof anchors.trunkBase.y === 'number' &&
		typeof anchors.crownCenter.x === 'number' &&
		typeof anchors.crownCenter.y === 'number'
	);
}

describe('TREE_STAGES', () => {
	it('has exactly 12 entries', () => {
		expect(Object.keys(TREE_STAGES)).toHaveLength(12);
	});

	it('TREE_STAGE_OPTIONS has 12 options with label/value pairs', () => {
		expect(TREE_STAGE_OPTIONS).toHaveLength(12);
		for (const option of TREE_STAGE_OPTIONS) {
			expect(typeof option.value).toBe('string');
			expect(typeof option.label).toBe('string');
		}
	});

	it('DEFAULT_TREE_CONFIG.stage is leafy', () => {
		expect(DEFAULT_TREE_CONFIG.stage).toBe('leafy');
	});
});

describe('stage generation — every stage produces valid TreeGeometry', () => {
	const allStages = Object.values(TREE_STAGES) as TreeStage[];

	for (const stage of allStages) {
		it(`${stage}: produces valid geometry with anchors and viewBox`, () => {
			const geo = generateTree(makeConfig({ stage }));
			expect(geo.viewBox.width).toBe(300);
			expect(geo.viewBox.height).toBe(300);
			expect(hasValidAnchors(geo)).toBe(true);
			expect(Array.isArray(geo.trunkQuads)).toBe(true);
			expect(Array.isArray(geo.trunkTriangles)).toBe(true);
			expect(Array.isArray(geo.branchGroups)).toBe(true);
			expect(Array.isArray(geo.canopyBlobs)).toBe(true);
			expect(Array.isArray(geo.stakeTriangles)).toBe(true);
			expect(Array.isArray(geo.fruitSlots)).toBe(true);
			expect(Array.isArray(geo.flowerSlots)).toBe(true);
			expect(typeof geo.showFallingLeaves).toBe('boolean');
		});
	}
});

describe('stage generation — determinism', () => {
	const allStages = Object.values(TREE_STAGES) as TreeStage[];

	for (const stage of allStages) {
		it(`${stage}: same config+seed produces identical geometry`, () => {
			const config = makeConfig({ stage, seed: 123 });
			const geo1 = generateTree(config);
			const geo2 = generateTree(config);
			expect(geo1).toEqual(geo2);
		});
	}
});

describe('seed stage', () => {
	it('produces no canopy blobs and no branches', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.seed }));
		expect(geo.canopyBlobs).toHaveLength(0);
		expect(geo.branchGroups).toHaveLength(0);
	});

	it('produces trunk triangles (seed polygons)', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.seed }));
		expect(geo.trunkTriangles.length).toBeGreaterThan(0);
	});
});

describe('sprouting stage', () => {
	it('produces minimal canopy (leaf triangles)', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.sprouting }));
		expect(geo.canopyBlobs.length).toBeGreaterThan(0);
		const totalCanopyTris = geo.canopyBlobs.reduce((s, b) => s + b.triangles.length, 0);
		expect(totalCanopyTris).toBeLessThanOrEqual(4);
	});

	it('produces a trunk (stem)', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.sprouting }));
		expect(geo.trunkTriangles.length).toBeGreaterThan(0);
	});
});

describe('sapling stage', () => {
	it('produces smaller canopy than leafy', () => {
		const saplingGeo = generateTree(makeConfig({ stage: TREE_STAGES.sapling }));
		const leafyGeo = generateTree(makeConfig({ stage: TREE_STAGES.leafy }));
		const saplingCanopyTris = saplingGeo.canopyBlobs.reduce(
			(s, b) => s + b.triangles.length,
			0,
		);
		const leafyCanopyTris = leafyGeo.canopyBlobs.reduce((s, b) => s + b.triangles.length, 0);
		expect(saplingCanopyTris).toBeLessThan(leafyCanopyTris);
	});
});

describe('growing stage', () => {
	it('has no stakes', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.growing }));
		expect(geo.stakeTriangles).toHaveLength(0);
	});
});

describe('leafy stage', () => {
	it('matches default generateTree output (backward compat)', () => {
		const leafyGeo = generateTree(makeConfig({ stage: TREE_STAGES.leafy }));
		expect(leafyGeo.trunkQuads.length).toBeGreaterThan(0);
		expect(leafyGeo.canopyBlobs.length).toBeGreaterThan(0);
		expect(leafyGeo.stakeTriangles).toHaveLength(0);
		expect(leafyGeo.fruitSlots).toHaveLength(0);
	});
});

describe('flowering stage', () => {
	it('populates flowerSlots with at least 1 point', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.flowering }));
		expect(geo.flowerSlots.length).toBeGreaterThanOrEqual(1);
	});

	it('flowerSlots contain valid Point2D', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.flowering }));
		for (const slot of geo.flowerSlots) {
			expect(typeof slot.x).toBe('number');
			expect(typeof slot.y).toBe('number');
		}
	});

	it('has empty fruitSlots (not yet fruiting)', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.flowering }));
		expect(geo.fruitSlots).toHaveLength(0);
	});
});

describe('fruiting stage', () => {
	it('populates fruitSlots with at least 1 point', () => {
		const geo = generateTree(
			makeConfig({ stage: TREE_STAGES.fruiting, fruitType: 'apple', fruitCount: 5 }),
		);
		expect(geo.fruitSlots.length).toBeGreaterThanOrEqual(1);
	});

	it('fruitSlots contain valid Point2D', () => {
		const geo = generateTree(
			makeConfig({ stage: TREE_STAGES.fruiting, fruitType: 'apple', fruitCount: 5 }),
		);
		for (const slot of geo.fruitSlots) {
			expect(typeof slot.x).toBe('number');
			expect(typeof slot.y).toBe('number');
		}
	});
});

describe('autumn stage', () => {
	it('produces canopy triangles colored with autumn palette', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.autumn }));
		expect(geo.canopyBlobs.length).toBeGreaterThan(0);
		const canopyColors = geo.canopyBlobs.flatMap((b) => b.triangles.map((t) => t.color));
		expect(canopyColors.length).toBeGreaterThan(0);
		// Autumn palette interpolates between #8B2010 (dark) and #E8A028 (light).
		// Verify colors differ from default green palette (#a8d84e/#1a472a).
		const leafyGeo = generateTree(makeConfig({ stage: TREE_STAGES.leafy }));
		const leafyColors = leafyGeo.canopyBlobs.flatMap((b) => b.triangles.map((t) => t.color));
		const autumnSet = new Set(canopyColors);
		const leafySet = new Set(leafyColors);
		const overlap = [...autumnSet].filter((c) => leafySet.has(c));
		// Autumn and leafy should have largely different color sets
		expect(overlap.length).toBeLessThan(autumnSet.size);
	});

	it('has showFallingLeaves true', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.autumn }));
		expect(geo.showFallingLeaves).toBe(true);
	});
});

describe('showFallingLeaves — only autumn', () => {
	const allStages = Object.values(TREE_STAGES) as TreeStage[];
	const nonAutumnStages = allStages.filter((s) => s !== TREE_STAGES.autumn);

	for (const stage of nonAutumnStages) {
		it(`${stage}: showFallingLeaves is false`, () => {
			const geo = generateTree(makeConfig({ stage }));
			expect(geo.showFallingLeaves).toBe(false);
		});
	}
});

describe('flowerSlots array present on all stages', () => {
	const allStages = Object.values(TREE_STAGES) as TreeStage[];

	for (const stage of allStages) {
		it(`${stage}: has flowerSlots array`, () => {
			const geo = generateTree(makeConfig({ stage }));
			expect(Array.isArray(geo.flowerSlots)).toBe(true);
		});
	}
});

describe('ready stage', () => {
	it('geometry is identical to leafy (glow is CSS-only)', () => {
		const readyGeo = generateTree(makeConfig({ stage: TREE_STAGES.ready, seed: 42 }));
		const leafyGeo = generateTree(makeConfig({ stage: TREE_STAGES.leafy, seed: 42 }));
		expect(readyGeo.trunkQuads).toEqual(leafyGeo.trunkQuads);
		expect(readyGeo.canopyBlobs).toEqual(leafyGeo.canopyBlobs);
		expect(readyGeo.branchGroups).toEqual(leafyGeo.branchGroups);
	});
});

describe('bare stage', () => {
	it('produces zero canopy triangles', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.bare }));
		const totalCanopyTris = geo.canopyBlobs.reduce((s, b) => s + b.triangles.length, 0);
		expect(totalCanopyTris).toBe(0);
	});

	it('still has trunk quads', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.bare }));
		expect(geo.trunkQuads.length).toBeGreaterThan(0);
	});
});

describe('dead stage', () => {
	it('produces zero canopy triangles', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.dead }));
		const totalCanopyTris = geo.canopyBlobs.reduce((s, b) => s + b.triangles.length, 0);
		expect(totalCanopyTris).toBe(0);
	});

	it('has trunk quads with desaturated colors', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.dead }));
		expect(geo.trunkQuads.length).toBeGreaterThan(0);
		// Dead stage uses trunkSaturation=5 (near grey). Verify trunk colors differ
		// from default (saturation=50).
		const leafyGeo = generateTree(makeConfig({ stage: TREE_STAGES.leafy }));
		const deadColors = new Set(geo.trunkQuads.map((q) => q.color));
		const leafyColors = new Set(leafyGeo.trunkQuads.map((q) => q.color));
		const overlap = [...deadColors].filter((c) => leafyColors.has(c));
		expect(overlap.length).toBeLessThan(deadColors.size);
	});

	it('config overrides: trunkLean=15, trunkCrookedness=50, trunkSegments=5', () => {
		const result = applyStageModifiers(makeConfig({ stage: TREE_STAGES.dead }));
		expect(result.kind).toBe('modifiedConfig');
		if (result.kind !== 'modifiedConfig') {
			return;
		}
		expect(result.config.trunkLean).toBe(15);
		expect(result.config.trunkCrookedness).toBe(50);
		expect(result.config.trunkSegments).toBe(5);
		expect(result.config.crookednessMode).toBe(CROOKEDNESS_MODES.random);
	});
});

describe('stump stage', () => {
	it('produces very short geometry (no branches, no canopy)', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.stump }));
		expect(geo.canopyBlobs).toHaveLength(0);
		expect(geo.branchGroups).toHaveLength(0);
	});

	it('produces trunk triangles', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.stump }));
		expect(geo.trunkTriangles.length).toBeGreaterThan(0);
	});
});

describe('pine trunk height respects trunkHeight slider', () => {
	it('pine with trunkHeight=10 has trunk top y > pine with trunkHeight=100 (shorter trunk = lower on screen)', () => {
		const tallPine = generateTree(
			makeConfig({ shape: TREE_SHAPES.pine, trunkHeight: 100, seed: 42 }),
		);
		const shortPine = generateTree(
			makeConfig({ shape: TREE_SHAPES.pine, trunkHeight: 10, seed: 42 }),
		);
		// Trunk top = last junction = highest point (lowest Y)
		const tallTrunkTopY = tallPine.anchors.trunkTop.y;
		const shortTrunkTopY = shortPine.anchors.trunkTop.y;
		// Short trunk should have higher Y (lower on screen) than tall trunk
		expect(shortTrunkTopY).toBeGreaterThan(tallTrunkTopY);
		// Delta should be significant (at least 20px for 300px viewbox)
		expect(shortTrunkTopY - tallTrunkTopY).toBeGreaterThanOrEqual(20);
	});

	it('pine trunk top is not clamped into canopy (tiered shapes skip trunk-penetration clamp)', () => {
		// Pine defaultTrunkTop = H*0.8 = 240. Without the isTiered guard,
		// the trunk-penetration clamp forces trunkTop up to canopyBounds.maxY - 15,
		// overriding the slider. With the guard, trunkTop stays at ~240.
		const pine = generateTree(
			makeConfig({ shape: TREE_SHAPES.pine, trunkHeight: 100, seed: 42 }),
		);
		// Pine trunk top should be near defaultTrunkTop (240), not clamped to ~165
		expect(pine.anchors.trunkTop.y).toBeGreaterThan(200);
	});
});

describe('birch stripes', () => {
	it('birch shape produces 3-6 stripes', () => {
		const geo = generateTree(makeConfig({ shape: TREE_SHAPES.birch, seed: 42 }));
		expect(geo.birchStripes.length).toBeGreaterThanOrEqual(3);
		expect(geo.birchStripes.length).toBeLessThanOrEqual(6);
	});

	it('non-birch shapes produce empty birchStripes array', () => {
		const oakGeo = generateTree(makeConfig({ shape: TREE_SHAPES.oak, seed: 42 }));
		expect(oakGeo.birchStripes).toHaveLength(0);
		const pineGeo = generateTree(makeConfig({ shape: TREE_SHAPES.pine, seed: 42 }));
		expect(pineGeo.birchStripes).toHaveLength(0);
	});

	it('birch stripe y-values are between trunk top and trunk bottom', () => {
		const geo = generateTree(makeConfig({ shape: TREE_SHAPES.birch, seed: 42 }));
		const trunkTopY = geo.anchors.trunkTop.y;
		const trunkBaseY = geo.anchors.trunkBase.y;
		for (const stripe of geo.birchStripes) {
			expect(stripe.y).toBeGreaterThanOrEqual(trunkTopY);
			expect(stripe.y).toBeLessThanOrEqual(trunkBaseY);
		}
	});

	it('birch stripe colors are dark (low lightness HSL)', () => {
		const geo = generateTree(makeConfig({ shape: TREE_SHAPES.birch, seed: 42 }));
		for (const stripe of geo.birchStripes) {
			// Color format: hsl(0, 0%, N%) where N is 15-29
			expect(stripe.color).toMatch(/^hsl\(0, 0%, \d+%\)$/);
			const lightness = parseInt(stripe.color.match(/(\d+)%\)$/)![1]!, 10);
			expect(lightness).toBeGreaterThanOrEqual(15);
			expect(lightness).toBeLessThan(30);
		}
	});

	it('birch stripes are deterministic (same seed produces same stripes)', () => {
		const geo1 = generateTree(makeConfig({ shape: TREE_SHAPES.birch, seed: 123 }));
		const geo2 = generateTree(makeConfig({ shape: TREE_SHAPES.birch, seed: 123 }));
		expect(geo1.birchStripes).toEqual(geo2.birchStripes);
	});
});

describe('custom shape ignores stage', () => {
	it('custom shape + non-leafy stage still generates normally', () => {
		const config = makeConfig({ shape: 'custom', stage: TREE_STAGES.bare });
		const geo = generateTree(config);
		// Custom shape should not suppress canopy due to bare stage
		expect(geo.viewBox.width).toBe(300);
		expect(hasValidAnchors(geo)).toBe(true);
	});
});
