import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS } from './tool_definitions.js';
import { TOOL_TYPES, TOOL_ANCHOR_MAP } from './tool_types.js';
import type { ToolType } from './tool_types.js';

describe('TOOL_DEFINITIONS', () => {
	it('has entries for all 6 tool types', () => {
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

	it('anchorTarget matches TOOL_ANCHOR_MAP for each tool', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(TOOL_DEFINITIONS[toolType].anchorTarget).toBe(
				TOOL_ANCHOR_MAP[toolType as ToolType],
			);
		}
	});

	it('each tool has a unique svgComponent', () => {
		const components = Object.values(TOOL_DEFINITIONS).map((d) => d.svgComponent);
		expect(new Set(components).size).toBe(components.length);
	});

	it('shovel has correct snapOffset', () => {
		expect(TOOL_DEFINITIONS.shovel.snapOffset).toEqual({ x: 0, y: 25 });
	});

	it('wateringCan has correct snapOffset', () => {
		expect(TOOL_DEFINITIONS.wateringCan.snapOffset).toEqual({ x: 16, y: -8 });
	});

	it('ladder has correct snapOffset', () => {
		expect(TOOL_DEFINITIONS.ladder.snapOffset).toEqual({ x: 0, y: -27 });
	});

	it('axe has correct snapOffset', () => {
		expect(TOOL_DEFINITIONS.axe.snapOffset).toEqual({ x: 14, y: -18 });
	});

	it('rake has correct snapOffset', () => {
		expect(TOOL_DEFINITIONS.rake.snapOffset).toEqual({ x: 0, y: 18 });
	});

	it('woodpecker has correct snapOffset', () => {
		expect(TOOL_DEFINITIONS.woodpecker.snapOffset).toEqual({ x: 0, y: 10 });
	});
});
