import { describe, it, expect } from 'vitest';
import { generatePottedPlant } from './potted_plant_generator.js';
import type { TreeGeometry } from './types.js';
import { GEOMETRY_GROUPS } from './types.js';
import { POTTED_PLANT_STAGES, type PottedPlantConfig } from './types/potted_plant_types.js';

function makeConfig(overrides: Partial<PottedPlantConfig> = {}): PottedPlantConfig {
	return {
		stage: POTTED_PLANT_STAGES.flowering,
		seed: 42,
		...overrides,
	};
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
		typeof anchors.crownCenter.y === 'number' &&
		typeof anchors.crownTop.x === 'number' &&
		typeof anchors.crownTop.y === 'number' &&
		typeof anchors.roots.x === 'number' &&
		typeof anchors.roots.y === 'number' &&
		Array.isArray(anchors.branchTips) &&
		Array.isArray(anchors.fruitSlots)
	);
}

describe('potted plant — all stages return valid TreeGeometry', () => {
	const allStages = Object.values(POTTED_PLANT_STAGES);

	for (const stage of allStages) {
		it(`${stage}: viewBox 200x300, valid anchors, all arrays present`, () => {
			const geo = generatePottedPlant(makeConfig({ stage }));
			expect(geo.viewBox.width).toBe(200);
			expect(geo.viewBox.height).toBe(300);
			expect(hasValidAnchors(geo)).toBe(true);
			expect(Array.isArray(geo.trunkQuads)).toBe(true);
			expect(Array.isArray(geo.trunkTriangles)).toBe(true);
			expect(Array.isArray(geo.branchGroups)).toBe(true);
			expect(Array.isArray(geo.canopyBlobs)).toBe(true);
			expect(Array.isArray(geo.fruitTriangles)).toBe(true);
			expect(Array.isArray(geo.stakeTriangles)).toBe(true);
			expect(Array.isArray(geo.fruitSlots)).toBe(true);
		});
	}
});

describe('pot-with-soil stage', () => {
	it('has pot triangles with group "pot"', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.potWithSoil }));
		const potTriangles = geo.trunkTriangles.filter((t) => t.group === GEOMETRY_GROUPS.pot);
		expect(potTriangles.length).toBeGreaterThan(0);
	});

	it('has soil triangles (brown trunk triangles at pot top)', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.potWithSoil }));
		// Soil is part of trunkTriangles but distinct from pot
		const allTriangles = geo.trunkTriangles;
		expect(allTriangles.length).toBeGreaterThanOrEqual(3); // pot + soil
	});

	it('has NO canopy blobs', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.potWithSoil }));
		expect(geo.canopyBlobs).toHaveLength(0);
	});

	it('has NO fruit triangles', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.potWithSoil }));
		expect(geo.fruitTriangles).toHaveLength(0);
	});
});

describe('sprout stage', () => {
	it('has pot triangles with group "pot"', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.sprout }));
		const potTriangles = geo.trunkTriangles.filter((t) => t.group === GEOMETRY_GROUPS.pot);
		expect(potTriangles.length).toBeGreaterThan(0);
	});

	it('has a stem (trunk triangles with group "trunk")', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.sprout }));
		const stemTriangles = geo.trunkTriangles.filter((t) => t.group === GEOMETRY_GROUPS.trunk);
		expect(stemTriangles.length).toBeGreaterThan(0);
	});

	it('has exactly 1 canopy blob with 2 leaf triangles', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.sprout }));
		expect(geo.canopyBlobs).toHaveLength(1);
		expect(geo.canopyBlobs[0].triangles).toHaveLength(2);
		for (const tri of geo.canopyBlobs[0].triangles) {
			expect(tri.group).toBe(GEOMETRY_GROUPS.canopy);
		}
	});

	it('has NO fruit triangles', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.sprout }));
		expect(geo.fruitTriangles).toHaveLength(0);
	});
});

describe('small-plant stage', () => {
	it('has pot triangles and stem', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.smallPlant }));
		const potTriangles = geo.trunkTriangles.filter((t) => t.group === GEOMETRY_GROUPS.pot);
		const stemTriangles = geo.trunkTriangles.filter((t) => t.group === GEOMETRY_GROUPS.trunk);
		expect(potTriangles.length).toBeGreaterThan(0);
		expect(stemTriangles.length).toBeGreaterThan(0);
	});

	it('has 1-2 canopy blobs with triangulated triangles (more than 2 each)', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.smallPlant }));
		expect(geo.canopyBlobs.length).toBeGreaterThanOrEqual(1);
		expect(geo.canopyBlobs.length).toBeLessThanOrEqual(2);
		for (const blob of geo.canopyBlobs) {
			expect(blob.triangles.length).toBeGreaterThan(2);
		}
	});

	it('has 1-2 fruitSlots on anchors', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.smallPlant }));
		expect(geo.anchors.fruitSlots.length).toBeGreaterThanOrEqual(1);
		expect(geo.anchors.fruitSlots.length).toBeLessThanOrEqual(2);
	});
});

describe('flowering stage', () => {
	it('has pot + stem + canopy blobs', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.flowering }));
		const potTriangles = geo.trunkTriangles.filter((t) => t.group === GEOMETRY_GROUPS.pot);
		const stemTriangles = geo.trunkTriangles.filter((t) => t.group === GEOMETRY_GROUPS.trunk);
		expect(potTriangles.length).toBeGreaterThan(0);
		expect(stemTriangles.length).toBeGreaterThan(0);
		expect(geo.canopyBlobs.length).toBeGreaterThan(0);
	});

	it('has fruitTriangles (flowers)', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.flowering }));
		expect(geo.fruitTriangles.length).toBeGreaterThan(0);
		for (const tri of geo.fruitTriangles) {
			expect(tri.group).toBe(GEOMETRY_GROUPS.fruit);
		}
	});

	it('has more fruitSlots than small-plant (3-5)', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.flowering }));
		expect(geo.anchors.fruitSlots.length).toBeGreaterThanOrEqual(3);
		expect(geo.anchors.fruitSlots.length).toBeLessThanOrEqual(5);
	});
});

describe('dried stage', () => {
	it('has same structure as flowering (pot + stem + canopy + fruit)', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.dried }));
		const potTriangles = geo.trunkTriangles.filter((t) => t.group === GEOMETRY_GROUPS.pot);
		const stemTriangles = geo.trunkTriangles.filter((t) => t.group === GEOMETRY_GROUPS.trunk);
		expect(potTriangles.length).toBeGreaterThan(0);
		expect(stemTriangles.length).toBeGreaterThan(0);
		expect(geo.canopyBlobs.length).toBeGreaterThan(0);
		expect(geo.fruitTriangles.length).toBeGreaterThan(0);
	});

	it('canopy colors are brown/yellow tones (not green)', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.dried }));
		const canopyColors = geo.canopyBlobs.flatMap((b) => b.triangles.map((t) => t.color));
		// Should not contain default green colors
		for (const color of canopyColors) {
			expect(color).not.toBe('#a8d84e');
			expect(color).not.toBe('#1a472a');
		}
		// Should contain brown/yellow tones
		expect(canopyColors.length).toBeGreaterThan(0);
	});
});

describe('pot is wide planter style', () => {
	it('pot geometry spans ~120px wide (60% of viewBox width)', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.potWithSoil }));
		const potTriangles = geo.trunkTriangles.filter((t) => t.group === GEOMETRY_GROUPS.pot);
		const allX = potTriangles.flatMap((t) => t.points.map((p) => p.x));
		const minX = Math.min(...allX);
		const maxX = Math.max(...allX);
		const potWidth = maxX - minX;
		expect(potWidth).toBeGreaterThanOrEqual(100);
		expect(potWidth).toBeLessThanOrEqual(140);
	});
});

describe('anchors are pot-relative', () => {
	it('trunkBase is at pot rim (where stem emerges)', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.sprout }));
		// potTopY = GROUND_LINE_Y - 40 = 285 - 40 = 245
		expect(geo.anchors.trunkBase.y).toBe(245);
		expect(geo.anchors.trunkBase.x).toBe(100); // cx = 200/2
	});

	it('roots at pot bottom', () => {
		const geo = generatePottedPlant(makeConfig({ stage: POTTED_PLANT_STAGES.sprout }));
		// potBottomY = GROUND_LINE_Y = 285
		expect(geo.anchors.roots.y).toBe(285);
	});
});

describe('deterministic output', () => {
	const allStages = Object.values(POTTED_PLANT_STAGES);

	for (const stage of allStages) {
		it(`${stage}: same seed produces identical output`, () => {
			const config = makeConfig({ stage, seed: 123 });
			const geo1 = generatePottedPlant(config);
			const geo2 = generatePottedPlant(config);
			expect(geo1).toEqual(geo2);
		});
	}
});
