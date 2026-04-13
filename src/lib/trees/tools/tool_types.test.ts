import { describe, it, expect } from 'vitest';
import {
	TOOL_TYPES,
	TOOL_ANCHOR_MAP,
	TOOL_OPTIONS,
	createDefaultToolVisibility,
} from './tool_types.js';

describe('TOOL_TYPES', () => {
	it('defines exactly 4 tools', () => {
		const types = Object.values(TOOL_TYPES);
		expect(types).toHaveLength(4);
	});

	it('contains shovel, ladder, wateringCan, birdNest', () => {
		expect(TOOL_TYPES.shovel).toBe('shovel');
		expect(TOOL_TYPES.ladder).toBe('ladder');
		expect(TOOL_TYPES.wateringCan).toBe('wateringCan');
		expect(TOOL_TYPES.birdNest).toBe('birdNest');
	});
});

describe('TOOL_ANCHOR_MAP', () => {
	it('maps every tool type to a valid TreeAnchors key', () => {
		const validAnchors = ['trunkBase', 'trunkMiddle', 'crownCenter'];
		for (const toolType of Object.values(TOOL_TYPES)) {
			expect(validAnchors).toContain(TOOL_ANCHOR_MAP[toolType]);
		}
	});

	it('shovel snaps to trunkBase', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.shovel]).toBe('trunkBase');
	});

	it('ladder snaps to trunkMiddle', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.ladder]).toBe('trunkMiddle');
	});

	it('watering can snaps to trunkBase', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.wateringCan]).toBe('trunkBase');
	});

	it('bird nest snaps to crownCenter', () => {
		expect(TOOL_ANCHOR_MAP[TOOL_TYPES.birdNest]).toBe('crownCenter');
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
});

describe('createDefaultToolVisibility', () => {
	it('has entries for all 4 tools', () => {
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

	it('returns a new object each call', () => {
		const a = createDefaultToolVisibility();
		const b = createDefaultToolVisibility();
		expect(a).not.toBe(b);
		expect(a.shovel).not.toBe(b.shovel);
	});
});
