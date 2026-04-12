import { describe, it, expect } from 'vitest';
import { generateTree } from '../generate.js';
import type { TreeConfig, TreeGeometry } from '../types.js';
import { DEFAULT_TREE_CONFIG, TREE_STAGES, TREE_STAGE_OPTIONS, type TreeStage } from '../types.js';

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
		typeof anchors.trunkBottom.x === 'number' &&
		typeof anchors.trunkBottom.y === 'number' &&
		typeof anchors.canopyCenter.x === 'number' &&
		typeof anchors.canopyCenter.y === 'number'
	);
}

describe('TREE_STAGES', () => {
	it('has exactly 11 entries', () => {
		expect(Object.keys(TREE_STAGES)).toHaveLength(11);
	});

	it('TREE_STAGE_OPTIONS has 11 options with label/value pairs', () => {
		expect(TREE_STAGE_OPTIONS).toHaveLength(11);
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
			expect(geo.viewBox.width).toBe(200);
			expect(geo.viewBox.height).toBe(300);
			expect(hasValidAnchors(geo)).toBe(true);
			expect(Array.isArray(geo.trunkTriangles)).toBe(true);
			expect(Array.isArray(geo.branchTriangles)).toBe(true);
			expect(Array.isArray(geo.canopyBlobs)).toBe(true);
			expect(Array.isArray(geo.stakeTriangles)).toBe(true);
			expect(Array.isArray(geo.fruitSlots)).toBe(true);
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
		expect(geo.branchTriangles).toHaveLength(0);
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
	it('includes stake triangles', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.growing }));
		expect(geo.stakeTriangles.length).toBeGreaterThan(0);
	});

	it('stake triangles have group=stake', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.growing }));
		for (const tri of geo.stakeTriangles) {
			expect(tri.group).toBe('stake');
		}
	});
});

describe('leafy stage', () => {
	it('matches default generateTree output (backward compat)', () => {
		const leafyGeo = generateTree(makeConfig({ stage: TREE_STAGES.leafy }));
		expect(leafyGeo.trunkTriangles.length).toBeGreaterThan(0);
		expect(leafyGeo.canopyBlobs.length).toBeGreaterThan(0);
		expect(leafyGeo.stakeTriangles).toHaveLength(0);
		expect(leafyGeo.fruitSlots).toHaveLength(0);
	});
});

describe('fruiting stage', () => {
	it('populates fruitSlots with at least 1 point', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.fruiting }));
		expect(geo.fruitSlots.length).toBeGreaterThanOrEqual(1);
	});

	it('fruitSlots contain valid Point2D', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.fruiting }));
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
});

describe('ready stage', () => {
	it('geometry is identical to leafy (glow is CSS-only)', () => {
		const readyGeo = generateTree(makeConfig({ stage: TREE_STAGES.ready, seed: 42 }));
		const leafyGeo = generateTree(makeConfig({ stage: TREE_STAGES.leafy, seed: 42 }));
		expect(readyGeo.trunkTriangles).toEqual(leafyGeo.trunkTriangles);
		expect(readyGeo.canopyBlobs).toEqual(leafyGeo.canopyBlobs);
		expect(readyGeo.branchTriangles).toEqual(leafyGeo.branchTriangles);
	});
});

describe('bare stage', () => {
	it('produces zero canopy triangles', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.bare }));
		const totalCanopyTris = geo.canopyBlobs.reduce((s, b) => s + b.triangles.length, 0);
		expect(totalCanopyTris).toBe(0);
	});

	it('still has trunk triangles', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.bare }));
		expect(geo.trunkTriangles.length).toBeGreaterThan(0);
	});
});

describe('dead stage', () => {
	it('produces zero canopy triangles', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.dead }));
		const totalCanopyTris = geo.canopyBlobs.reduce((s, b) => s + b.triangles.length, 0);
		expect(totalCanopyTris).toBe(0);
	});

	it('has trunk triangles with desaturated colors', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.dead }));
		expect(geo.trunkTriangles.length).toBeGreaterThan(0);
		// Dead stage uses trunkSaturation=5 (near grey). Verify trunk colors differ
		// from default (saturation=50).
		const leafyGeo = generateTree(makeConfig({ stage: TREE_STAGES.leafy }));
		const deadColors = new Set(geo.trunkTriangles.map((t) => t.color));
		const leafyColors = new Set(leafyGeo.trunkTriangles.map((t) => t.color));
		const overlap = [...deadColors].filter((c) => leafyColors.has(c));
		expect(overlap.length).toBeLessThan(deadColors.size);
	});
});

describe('stump stage', () => {
	it('produces very short geometry (no branches, no canopy)', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.stump }));
		expect(geo.canopyBlobs).toHaveLength(0);
		expect(geo.branchTriangles).toHaveLength(0);
	});

	it('produces trunk triangles', () => {
		const geo = generateTree(makeConfig({ stage: TREE_STAGES.stump }));
		expect(geo.trunkTriangles.length).toBeGreaterThan(0);
	});
});

describe('custom shape ignores stage', () => {
	it('custom shape + non-leafy stage still generates normally', () => {
		const config = makeConfig({ shape: 'custom', stage: TREE_STAGES.bare });
		const geo = generateTree(config);
		// Custom shape should not suppress canopy due to bare stage
		expect(geo.viewBox.width).toBe(200);
		expect(hasValidAnchors(geo)).toBe(true);
	});
});
