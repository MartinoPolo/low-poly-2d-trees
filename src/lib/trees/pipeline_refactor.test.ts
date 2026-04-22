import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC_ROOT = path.resolve(__dirname);

// ============================================================================
// Behavior 1: FRUIT_DEFINITIONS used instead of FRUIT_SVG_COMPONENTS
// ============================================================================

describe('Behavior 1: FRUIT_DEFINITIONS replaces FRUIT_SVG_COMPONENTS', () => {
	it('fruit_geometry.ts no longer exists', () => {
		const filePath = path.join(SRC_ROOT, 'shapes', 'fruit_geometry.ts');
		expect(fs.existsSync(filePath), `${filePath} should be deleted`).toBe(false);
	});

	it('no source file imports from fruit_geometry (excluding tests)', () => {
		const lowPolyTree = fs.readFileSync(path.join(SRC_ROOT, 'LowPolyTree.svelte'), 'utf-8');
		expect(lowPolyTree).not.toContain('fruit_geometry');
		expect(lowPolyTree).not.toContain('FRUIT_SVG_COMPONENTS');
	});
});

// ============================================================================
// Behavior 2: FLOWER_DEFINITIONS used instead of FLOWER_SVG_COMPONENTS
// ============================================================================

describe('Behavior 2: FLOWER_DEFINITIONS replaces FLOWER_SVG_COMPONENTS', () => {
	it('flower_geometry.ts no longer exists', () => {
		const filePath = path.join(SRC_ROOT, 'shapes', 'flower_geometry.ts');
		expect(fs.existsSync(filePath), `${filePath} should be deleted`).toBe(false);
	});

	it('no source file imports from flower_geometry', () => {
		const lowPolyTree = fs.readFileSync(path.join(SRC_ROOT, 'LowPolyTree.svelte'), 'utf-8');
		expect(lowPolyTree).not.toContain('flower_geometry');
		expect(lowPolyTree).not.toContain('FLOWER_SVG_COMPONENTS');
	});
});

// ============================================================================
// Behavior 3: TreeFruitAndFlowerLayer uses definition scale/offset
// ============================================================================

describe('Behavior 3: TreeFruitAndFlowerLayer uses definition scale/offset', () => {
	it('FRUIT_RENDER_SCALE constant no longer exists in TreeFruitAndFlowerLayer', () => {
		const content = fs.readFileSync(
			path.join(SRC_ROOT, 'TreeFruitAndFlowerLayer.svelte'),
			'utf-8',
		);
		expect(content).not.toContain('FRUIT_RENDER_SCALE');
	});

	it('TreeFruitAndFlowerLayer accepts fruitScale and flowerScale props', () => {
		const content = fs.readFileSync(
			path.join(SRC_ROOT, 'TreeFruitAndFlowerLayer.svelte'),
			'utf-8',
		);
		expect(content).toContain('fruitScale');
		expect(content).toContain('flowerScale');
		expect(content).toContain('fruitOriginOffset');
		expect(content).toContain('flowerOriginOffset');
	});
});

// ============================================================================
// Behavior 4: FRUIT_DEFINITIONS scales updated to 2 for visual parity
// ============================================================================

describe('Behavior 4: FRUIT_DEFINITIONS scales updated to 2', () => {
	it('every fruit definition has scale: 2', async () => {
		const fruitDefinitions = await import('./shapes/fruit_definitions.js');
		for (const [key, def] of Object.entries(fruitDefinitions.FRUIT_DEFINITIONS)) {
			expect((def as { scale: number }).scale, `${key} should have scale 2`).toBe(2);
		}
	});
});

// ============================================================================
// Behavior 5: TreeTrunkLayer uses STAGE_DEFINITIONS
// ============================================================================

describe('Behavior 5: TreeTrunkLayer uses STAGE_DEFINITIONS', () => {
	it('does NOT import SeedSvg/SproutingSvg/StumpSvg directly', () => {
		const content = fs.readFileSync(path.join(SRC_ROOT, 'TreeTrunkLayer.svelte'), 'utf-8');
		expect(content).not.toContain('import { SeedSvg, SproutingSvg, StumpSvg }');
		expect(content).not.toContain("from '$lib/trees/assets/stages/index.js'");
	});

	it('imports STAGE_DEFINITIONS from stage_definitions', () => {
		const content = fs.readFileSync(path.join(SRC_ROOT, 'TreeTrunkLayer.svelte'), 'utf-8');
		expect(content).toContain('STAGE_DEFINITIONS');
	});
});

// ============================================================================
// Behavior 6: GroundElements uses GROUND_DEFINITIONS
// ============================================================================

describe('Behavior 6: GroundElements uses GROUND_DEFINITIONS', () => {
	it('does NOT import StoneSvg/GrassSvg directly', () => {
		const content = fs.readFileSync(
			path.join(SRC_ROOT, 'ground', 'GroundElements.svelte'),
			'utf-8',
		);
		expect(content).not.toContain('import StoneSvg from');
		expect(content).not.toContain('import GrassSvg from');
	});

	it('imports GROUND_DEFINITIONS', () => {
		const content = fs.readFileSync(
			path.join(SRC_ROOT, 'ground', 'GroundElements.svelte'),
			'utf-8',
		);
		expect(content).toContain('GROUND_DEFINITIONS');
	});
});

// ============================================================================
// Behavior 7: TreeFallingLeavesLayer uses OVERLAY_DEFINITIONS
// ============================================================================

describe('Behavior 7: TreeFallingLeavesLayer uses OVERLAY_DEFINITIONS', () => {
	it('does NOT import LeafSvg directly', () => {
		const content = fs.readFileSync(
			path.join(SRC_ROOT, 'TreeFallingLeavesLayer.svelte'),
			'utf-8',
		);
		expect(content).not.toContain('import LeafSvg from');
	});

	it('imports OVERLAY_DEFINITIONS', () => {
		const content = fs.readFileSync(
			path.join(SRC_ROOT, 'TreeFallingLeavesLayer.svelte'),
			'utf-8',
		);
		expect(content).toContain('OVERLAY_DEFINITIONS');
	});
});

// ============================================================================
// Behavior 8: Remove FRUIT_SVG_COMPONENTS test block
// ============================================================================

describe('Behavior 8: FRUIT_SVG_COMPONENTS test block removed', () => {
	it('fruit_geometry.test.ts does not have a FRUIT_SVG_COMPONENTS describe block', () => {
		const content = fs.readFileSync(path.join(SRC_ROOT, 'fruit_geometry.test.ts'), 'utf-8');
		expect(content).not.toContain('FRUIT_SVG_COMPONENTS');
	});
});
