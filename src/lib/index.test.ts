import { describe, expect, it } from 'vitest';

describe('barrel exports — src/lib/index.ts', () => {
	it('exports all core type constants', async () => {
		const barrel = await import('$lib/index.js');

		expect(barrel.TREE_SHAPES).toBeDefined();
		expect(barrel.TREE_STAGES).toBeDefined();
		expect(barrel.TREE_SHAPE_OPTIONS).toBeDefined();
		expect(barrel.TREE_STAGE_OPTIONS).toBeDefined();
		expect(barrel.DEFAULT_TREE_CONFIG).toBeDefined();
		expect(barrel.VIEWBOX_WIDTH).toBeDefined();
		expect(barrel.VIEWBOX_HEIGHT).toBeDefined();
		expect(barrel.SHAPE_DEFAULTS).toBeDefined();
		expect(barrel.CROOKEDNESS_MODES).toBeDefined();
		expect(barrel.CROOKEDNESS_MODE_OPTIONS).toBeDefined();
		expect(barrel.BRANCH_MIRRORING).toBeDefined();
		expect(barrel.BRANCH_MIRRORING_OPTIONS).toBeDefined();
		expect(barrel.GEOMETRY_GROUPS).toBeDefined();
	});

	it('exports tool types including grill, speechBubble, stormCloud', async () => {
		const barrel = await import('$lib/index.js');

		expect(barrel.TOOL_TYPES.grill).toBe('grill');
		expect(barrel.TOOL_TYPES.speechBubble).toBe('speechBubble');
		expect(barrel.TOOL_TYPES.stormCloud).toBe('stormCloud');
		expect(barrel.TOOL_OPTIONS).toBeDefined();
		expect(barrel.TOOL_ANIMATIONS).toBeDefined();
		expect(typeof barrel.createDefaultToolVisibility).toBe('function');
	});

	it('exports stage types with seasonal and wilting, no autumn or ready', async () => {
		const barrel = await import('$lib/index.js');
		const stages = barrel.TREE_STAGES;

		expect(stages.seasonal).toBe('seasonal');
		expect(stages.wilting).toBe('wilting');
		expect('autumn' in stages).toBe(false);
		expect('ready' in stages).toBe(false);
	});

	it('exports isEvergreen and type guards', async () => {
		const barrel = await import('$lib/index.js');

		expect(barrel.isEvergreen('pine' as Parameters<typeof barrel.isEvergreen>[0])).toBe(true);
		expect(barrel.isEvergreen('oak' as Parameters<typeof barrel.isEvergreen>[0])).toBe(false);
		expect(typeof barrel.isTreeShape).toBe('function');
		expect(typeof barrel.isTreeStage).toBe('function');
		expect(typeof barrel.isFruitType).toBe('function');
	});

	it('exports overlay and glow types', async () => {
		const barrel = await import('$lib/index.js');

		expect(barrel.hasActiveOverlay(barrel.OVERLAY_DEFAULTS)).toBe(false);
		expect(barrel.GLOW_LIMITS.intensityMin).toBeDefined();
		expect(barrel.GLOW_LIMITS.intensityMax).toBeDefined();
	});

	it('exports fruit types', async () => {
		const barrel = await import('$lib/index.js');

		expect(barrel.FRUIT_TYPES).toBeDefined();
		expect(barrel.FRUIT_TYPE_OPTIONS).toBeDefined();
		expect(barrel.SHAPE_FRUIT_MAP).toBeDefined();
		expect(barrel.isFruitType('acorn')).toBe(true);
	});

	it('exports custom blob types', async () => {
		const barrel = await import('$lib/index.js');

		expect(barrel.CUSTOM_BLOB_BOUNDARY_KINDS).toBeDefined();
		expect(barrel.CUSTOM_BLOB_DEFAULT.boundaryKind).toBe(
			barrel.CUSTOM_BLOB_BOUNDARY_KINDS.circle,
		);
	});

	it('exports animation functions', async () => {
		const barrel = await import('$lib/index.js');

		expect(typeof barrel.computeAnimationDelay).toBe('function');
		expect(typeof barrel.GROWTH_DURATION_SECONDS).toBe('number');
	});

	it('exports generator functions', async () => {
		const barrel = await import('$lib/index.js');

		expect(typeof barrel.generateTree).toBe('function');

		const result = barrel.generateTree(barrel.DEFAULT_TREE_CONFIG);
		expect(result.trunkQuads).toBeDefined();
		expect(result.canopyBlobs).toBeDefined();
		expect(result.anchors).toBeDefined();
	});

	it('exports potted plant types', async () => {
		const barrel = await import('$lib/index.js');

		expect(barrel.POTTED_PLANT_STAGES).toBeDefined();
		expect(barrel.DEFAULT_POTTED_PLANT_CONFIG).toBeDefined();
		expect(barrel.DEFAULT_POTTED_PLANT_CONFIG.stage).toBeDefined();
	});

	it('exports disabled param utilities', async () => {
		const barrel = await import('$lib/index.js');

		expect(typeof barrel.isParamDisabled).toBe('function');
		expect(barrel.DISABLED_PARAMS_BY_SHAPE).toBeDefined();
		expect(barrel.isParamDisabled('bush', 'trunkHeight', {})).toBe(true);
	});

	it('exports ground limits', async () => {
		const barrel = await import('$lib/index.js');

		expect(barrel.GROUND_LIMITS.countMin).toBeDefined();
		expect(barrel.GROUND_LIMITS.countMax).toBeDefined();
		expect(barrel.GROUND_LIMITS.sizeDefault).toBeDefined();
	});
});
