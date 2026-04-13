import { describe, it, expect } from 'vitest';
import { TOOL_ANIMATIONS } from './tool_animations.js';
import type { ToolAnimationConfig } from './tool_animations.js';
import { TOOL_TYPES } from './tool_types.js';

describe('TOOL_ANIMATIONS', () => {
	it('has animation config for all 6 tool types', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(TOOL_ANIMATIONS).toHaveProperty(toolType);
		}
	});

	it('does not contain birdNest', () => {
		expect(TOOL_ANIMATIONS).not.toHaveProperty('birdNest');
	});

	it('each tool has a unique keyframe name', () => {
		const names = Object.values(TOOL_ANIMATIONS).map((a) => a.keyframeName);
		expect(new Set(names).size).toBe(names.length);
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

	it('shovel duration is 2s', () => {
		expect(TOOL_ANIMATIONS.shovel.duration).toBe(2);
	});

	it('ladder duration is 3s', () => {
		expect(TOOL_ANIMATIONS.ladder.duration).toBe(3);
	});

	it('watering can duration is 2.5s', () => {
		expect(TOOL_ANIMATIONS.wateringCan.duration).toBe(2.5);
	});

	it('axe duration is 1.8s', () => {
		expect(TOOL_ANIMATIONS.axe.duration).toBe(1.8);
	});

	it('rake duration is 2.2s', () => {
		expect(TOOL_ANIMATIONS.rake.duration).toBe(2.2);
	});

	it('woodpecker duration is 1.5s', () => {
		expect(TOOL_ANIMATIONS.woodpecker.duration).toBe(1.5);
	});

	it('axe keyframe name is tool-axe-idle', () => {
		expect(TOOL_ANIMATIONS.axe.keyframeName).toBe('tool-axe-idle');
	});

	it('rake keyframe name is tool-rake-idle', () => {
		expect(TOOL_ANIMATIONS.rake.keyframeName).toBe('tool-rake-idle');
	});

	it('woodpecker keyframe name is tool-woodpecker-idle', () => {
		expect(TOOL_ANIMATIONS.woodpecker.keyframeName).toBe('tool-woodpecker-idle');
	});

	it('ToolAnimationConfig type is exported and usable', () => {
		const config: ToolAnimationConfig = { keyframeName: 'test', duration: 1 };
		expect(config.keyframeName).toBe('test');
	});
});
