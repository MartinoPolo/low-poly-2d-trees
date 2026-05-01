import { describe, it, expect } from 'vitest';
import { TOOL_ANIMATIONS } from './tool_animations.js';
import type { ToolAnimationConfig } from './tool_animations.js';
import { TOOL_TYPES } from './tool_types.js';

describe('TOOL_ANIMATIONS', () => {
	it('has animation config for all 11 tool types', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(TOOL_ANIMATIONS).toHaveProperty(toolType);
		}
	});

	it('does not contain birdNest', () => {
		expect(TOOL_ANIMATIONS).not.toHaveProperty('birdNest');
	});

	it('each tool has a non-negative duration', () => {
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(TOOL_ANIMATIONS[toolType].duration).toBeGreaterThanOrEqual(0);
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

	it('grill duration is 2s', () => {
		expect(TOOL_ANIMATIONS.grill.duration).toBe(2);
	});

	it('speechBubble duration is 0 (static)', () => {
		expect(TOOL_ANIMATIONS.speechBubble.duration).toBe(0);
	});

	it('stormCloud duration is 2s', () => {
		expect(TOOL_ANIMATIONS.stormCloud.duration).toBe(2);
	});

	it('lantern duration is 4s', () => {
		expect(TOOL_ANIMATIONS.lantern.duration).toBe(4);
	});

	it('pruningShears duration is 1.5s', () => {
		expect(TOOL_ANIMATIONS.pruningShears.duration).toBe(1.5);
	});

	it('ToolAnimationConfig type is exported and usable', () => {
		const config: ToolAnimationConfig = { duration: 1 };
		expect(config.duration).toBe(1);
	});
});
