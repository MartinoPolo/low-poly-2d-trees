import { describe, it, expect } from 'vitest';
import { TOOL_SVG_DATA } from './tool_svg_data.js';
import { TOOL_TYPES } from './tool_types.js';

describe('TOOL_SVG_DATA', () => {
	it('has SVG data for all 4 tool types', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(TOOL_SVG_DATA).toHaveProperty(toolType);
		}
	});

	for (const toolType of ['shovel', 'ladder', 'wateringCan', 'birdNest'] as const) {
		describe(toolType, () => {
			it('has at least 1 polygon', () => {
				expect(TOOL_SVG_DATA[toolType].polygons.length).toBeGreaterThanOrEqual(1);
			});

			it('has at most 50 polygons', () => {
				expect(TOOL_SVG_DATA[toolType].polygons.length).toBeLessThanOrEqual(50);
			});

			it('each polygon has valid hex fill color', () => {
				for (const polygon of TOOL_SVG_DATA[toolType].polygons) {
					expect(polygon.fill).toMatch(/^#[0-9a-fA-F]{6}$/);
				}
			});

			it('each polygon has a points string', () => {
				for (const polygon of TOOL_SVG_DATA[toolType].polygons) {
					expect(typeof polygon.points).toBe('string');
					expect(polygon.points.length).toBeGreaterThan(0);
				}
			});

			it('first polygon has a valid points string', () => {
				expect(TOOL_SVG_DATA[toolType].polygons[0].points.length).toBeGreaterThan(0);
			});
		});
	}

	it('shovel and ladder have at most 30 polygons (simple tools)', () => {
		expect(TOOL_SVG_DATA.shovel.polygons.length).toBeLessThanOrEqual(30);
		expect(TOOL_SVG_DATA.ladder.polygons.length).toBeLessThanOrEqual(30);
	});
});
