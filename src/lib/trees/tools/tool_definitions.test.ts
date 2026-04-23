import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS } from './tool_definitions.js';
import { TOOL_TYPES } from './tool_types.js';

describe('TOOL_DEFINITIONS', () => {
	it('has entries for all 9 tool types', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(TOOL_DEFINITIONS).toHaveProperty(toolType);
		}
	});

	it('each entry has a truthy svgComponent', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(TOOL_DEFINITIONS[toolType].svgComponent).toBeTruthy();
		}
	});

	it('each entry has a string anchorTarget', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(typeof TOOL_DEFINITIONS[toolType].anchorTarget).toBe('string');
		}
	});

	it('each entry has snapOffset with numeric x and y', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			const { snapOffset } = TOOL_DEFINITIONS[toolType];
			expect(typeof snapOffset.x).toBe('number');
			expect(typeof snapOffset.y).toBe('number');
		}
	});

	it('ladder anchorTarget is trunkBase', () => {
		expect(TOOL_DEFINITIONS.ladder.anchorTarget).toBe('trunkBase');
	});

	it('axe anchorTarget is trunkMiddle', () => {
		expect(TOOL_DEFINITIONS.axe.anchorTarget).toBe('trunkMiddle');
	});

	it('each tool has a unique svgComponent', () => {
		const components = Object.values(TOOL_DEFINITIONS).map((d) => d.svgComponent);
		expect(new Set(components).size).toBe(components.length);
	});

	it('each entry has pivotPoint with numeric x and y', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			const { pivotPoint } = TOOL_DEFINITIONS[toolType];
			expect(typeof pivotPoint.x).toBe('number');
			expect(typeof pivotPoint.y).toBe('number');
		}
	});

	it('grill anchorTarget is trunkBase', () => {
		expect(TOOL_DEFINITIONS.grill.anchorTarget).toBe('trunkBase');
	});

	it('speechBubble anchorTarget is crownTop', () => {
		expect(TOOL_DEFINITIONS.speechBubble.anchorTarget).toBe('crownTop');
	});

	it('stormCloud anchorTarget is crownTop', () => {
		expect(TOOL_DEFINITIONS.stormCloud.anchorTarget).toBe('crownTop');
	});
});
