import { describe, it, expect } from 'vitest';
import { TOOL_ANIMATIONS } from './tool_animations.js';
import { TOOL_TYPES } from './tool_types.js';

describe('TOOL_ANIMATIONS', () => {
	it('has animation config for all 4 tool types', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(TOOL_ANIMATIONS).toHaveProperty(toolType);
		}
	});

	it('each tool has a unique keyframe name', () => {
		const names = Object.values(TOOL_ANIMATIONS).map((a) => a.keyframeName);
		expect(new Set(names).size).toBe(names.length);
	});

	it('shovel duration is 2s', () => {
		expect(TOOL_ANIMATIONS.shovel.duration).toBe(2);
	});

	it('ladder duration is 3s', () => {
		expect(TOOL_ANIMATIONS.ladder.duration).toBe(3);
	});

	it('watering can duration is 2.5s', () => {
		expect(TOOL_ANIMATIONS.wateringCan.duration).toBe(2.5);
	});

	it('bird nest duration is 2s', () => {
		expect(TOOL_ANIMATIONS.birdNest.duration).toBe(2);
	});

	it('each tool has a non-empty keyframe name', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(TOOL_ANIMATIONS[toolType].keyframeName.length).toBeGreaterThan(0);
		}
	});

	it('each tool has a positive duration', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(TOOL_ANIMATIONS[toolType].duration).toBeGreaterThan(0);
		}
	});
});
