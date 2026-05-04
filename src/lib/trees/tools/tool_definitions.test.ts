import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS } from './tool_definitions.js';

const DEFINED_TOOLS = Object.keys(TOOL_DEFINITIONS) as Array<keyof typeof TOOL_DEFINITIONS>;

describe('TOOL_DEFINITIONS', () => {
	it('has entries for all tools with SVG components', () => {
		const toolsWithSvg = [
			'shovel',
			'wateringCan',
			'ladder',
			'axe',
			'rake',
			'woodpecker',
			'grill',
			'speechBubble',
			'stormCloud',
			'lantern',
			'pruningShears',
		];
		for (const toolType of toolsWithSvg) {
			expect(TOOL_DEFINITIONS).toHaveProperty(toolType);
		}
	});

	it('each defined entry has a truthy svgComponent', () => {
		for (const toolType of DEFINED_TOOLS) {
			expect(TOOL_DEFINITIONS[toolType]!.svgComponent).toBeTruthy();
		}
	});

	it('each defined entry has a string anchorTarget', () => {
		for (const toolType of DEFINED_TOOLS) {
			expect(typeof TOOL_DEFINITIONS[toolType]!.anchorTarget).toBe('string');
		}
	});

	it('each defined entry has snapOffset with numeric x and y', () => {
		for (const toolType of DEFINED_TOOLS) {
			const { snapOffset } = TOOL_DEFINITIONS[toolType]!;
			expect(typeof snapOffset.x).toBe('number');
			expect(typeof snapOffset.y).toBe('number');
		}
	});

	it('ladder anchorTarget is trunkBase', () => {
		expect(TOOL_DEFINITIONS.ladder!.anchorTarget).toBe('trunkBase');
	});

	it('axe anchorTarget is trunkMiddle', () => {
		expect(TOOL_DEFINITIONS.axe!.anchorTarget).toBe('trunkMiddle');
	});

	it('each tool has a unique svgComponent', () => {
		const components = Object.values(TOOL_DEFINITIONS).map((d) => d.svgComponent);
		expect(new Set(components).size).toBe(components.length);
	});

	it('each defined entry has pivotPoint with numeric x and y', () => {
		for (const toolType of DEFINED_TOOLS) {
			const { pivotPoint } = TOOL_DEFINITIONS[toolType]!;
			expect(typeof pivotPoint.x).toBe('number');
			expect(typeof pivotPoint.y).toBe('number');
		}
	});

	it('grill anchorTarget is trunkBase', () => {
		expect(TOOL_DEFINITIONS.grill!.anchorTarget).toBe('trunkBase');
	});

	it('speechBubble anchorTarget is crownTop', () => {
		expect(TOOL_DEFINITIONS.speechBubble!.anchorTarget).toBe('crownTop');
	});

	it('stormCloud anchorTarget is crownTop', () => {
		expect(TOOL_DEFINITIONS.stormCloud!.anchorTarget).toBe('crownTop');
	});

	it('lantern anchorTarget is trunkBase', () => {
		expect(TOOL_DEFINITIONS.lantern!.anchorTarget).toBe('trunkBase');
	});

	it('pruningShears anchorTarget is trunkBase', () => {
		expect(TOOL_DEFINITIONS.pruningShears!.anchorTarget).toBe('trunkBase');
	});
});
