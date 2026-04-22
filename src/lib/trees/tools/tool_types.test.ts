import { describe, it, expect } from 'vitest';
import {
	TOOL_TYPES,
	TOOL_ANCHOR_MAP,
	TOOL_OPTIONS,
	createDefaultToolVisibility,
} from './tool_types.js';

describe('TOOL_TYPES', () => {
	it('defines exactly 9 tools', () => {
		const types = Object.values(TOOL_TYPES);
		expect(types).toHaveLength(9);
	});

	it('contains shovel, wateringCan, ladder, axe, rake, woodpecker, grill, speechBubble, stormCloud', () => {
		expect(TOOL_TYPES.shovel).toBe('shovel');
		expect(TOOL_TYPES.wateringCan).toBe('wateringCan');
		expect(TOOL_TYPES.ladder).toBe('ladder');
		expect(TOOL_TYPES.axe).toBe('axe');
		expect(TOOL_TYPES.rake).toBe('rake');
		expect(TOOL_TYPES.woodpecker).toBe('woodpecker');
		expect(TOOL_TYPES.grill).toBe('grill');
		expect(TOOL_TYPES.speechBubble).toBe('speechBubble');
		expect(TOOL_TYPES.stormCloud).toBe('stormCloud');
	});

	it('does not contain birdNest', () => {
		expect(TOOL_TYPES).not.toHaveProperty('birdNest');
	});
});

describe('TOOL_ANCHOR_MAP', () => {
	it('maps every tool type to a valid TreeAnchors key', () => {
		const validAnchors = ['trunkBase', 'trunkMiddle', 'crownTop'];
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(validAnchors).toContain(TOOL_ANCHOR_MAP[toolType]);
		}
	});

	it('shovel snaps to trunkBase', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.shovel]).toBe('trunkBase');
	});

	it('wateringCan snaps to trunkBase', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.wateringCan]).toBe('trunkBase');
	});

	it('ladder snaps to trunkMiddle', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.ladder]).toBe('trunkMiddle');
	});

	it('axe snaps to trunkBase', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.axe]).toBe('trunkBase');
	});

	it('rake snaps to trunkBase', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.rake]).toBe('trunkBase');
	});

	it('woodpecker snaps to trunkMiddle', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.woodpecker]).toBe('trunkMiddle');
	});

	it('grill snaps to trunkBase', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.grill]).toBe('trunkBase');
	});

	it('speechBubble snaps to crownTop', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.speechBubble]).toBe('crownTop');
	});

	it('stormCloud snaps to crownTop', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.stormCloud]).toBe('crownTop');
	});
});

describe('TOOL_OPTIONS', () => {
	it('has one entry per tool type', () => {
		expect(TOOL_OPTIONS).toHaveLength(Object.values(TOOL_TYPES).length);
	});

	it('each option has value and label', () => {
		for (const option of TOOL_OPTIONS) {
			expect(option).toHaveProperty('value');
			expect(option).toHaveProperty('label');
			expect(typeof option.label).toBe('string');
		}
	});

	it('option values cover all tool types', () => {
		const values = TOOL_OPTIONS.map((o) => o.value);
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(values).toContain(toolType);
		}
	});

	it('has correct labels for all 9 tools', () => {
		const labelMap = new Map(TOOL_OPTIONS.map((o) => [o.value, o.label]));
		expect(labelMap.get('shovel')).toBe('Shovel');
		expect(labelMap.get('wateringCan')).toBe('Watering Can');
		expect(labelMap.get('ladder')).toBe('Ladder');
		expect(labelMap.get('axe')).toBe('Axe');
		expect(labelMap.get('rake')).toBe('Rake');
		expect(labelMap.get('woodpecker')).toBe('Woodpecker');
		expect(labelMap.get('grill')).toBe('Grill');
		expect(labelMap.get('speechBubble')).toBe('Speech Bubble');
		expect(labelMap.get('stormCloud')).toBe('Storm Cloud');
	});
});

describe('createDefaultToolVisibility', () => {
	it('has entries for all 9 tools', () => {
		const visibility = createDefaultToolVisibility();
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(visibility).toHaveProperty(toolType);
		}
	});

	it('all tools start hidden', () => {
		const visibility = createDefaultToolVisibility();
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(visibility[toolType].visible).toBe(false);
		}
	});

	it('all tools start at size 1', () => {
		const visibility = createDefaultToolVisibility();
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(visibility[toolType].size).toBe(1);
		}
	});

	it('speechBubble entry has text field defaulting to empty string', () => {
		const visibility = createDefaultToolVisibility();
		expect(visibility.speechBubble.text).toBe('');
	});

	it('returns a new object each call', () => {
		const a = createDefaultToolVisibility();
		const b = createDefaultToolVisibility();
		expect(a).not.toBe(b);
		expect(a.shovel).not.toBe(b.shovel);
	});
});
