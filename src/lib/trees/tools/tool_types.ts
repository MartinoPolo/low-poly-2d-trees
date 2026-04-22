import type { TreeAnchors } from '$lib/trees/types/core.js';

export const TOOL_TYPES = {
	shovel: 'shovel',
	wateringCan: 'wateringCan',
	ladder: 'ladder',
	axe: 'axe',
	rake: 'rake',
	woodpecker: 'woodpecker',
	grill: 'grill',
} as const;

export type ToolType = (typeof TOOL_TYPES)[keyof typeof TOOL_TYPES];

export interface ToolVisibilityEntry {
	visible: boolean;
	size: number;
}

export type ToolVisibility = Record<ToolType, ToolVisibilityEntry>;

export const TOOL_ANCHOR_MAP = {
	[TOOL_TYPES.shovel]: 'trunkBase',
	[TOOL_TYPES.wateringCan]: 'trunkBase',
	[TOOL_TYPES.ladder]: 'trunkMiddle',
	[TOOL_TYPES.axe]: 'trunkBase',
	[TOOL_TYPES.rake]: 'trunkBase',
	[TOOL_TYPES.woodpecker]: 'trunkMiddle',
	[TOOL_TYPES.grill]: 'trunkBase',
} as const satisfies Record<ToolType, keyof TreeAnchors>;

export function createDefaultToolVisibility(): ToolVisibility {
	return {
		[TOOL_TYPES.shovel]: { visible: false, size: 1 },
		[TOOL_TYPES.wateringCan]: { visible: false, size: 1 },
		[TOOL_TYPES.ladder]: { visible: false, size: 1 },
		[TOOL_TYPES.axe]: { visible: false, size: 1 },
		[TOOL_TYPES.rake]: { visible: false, size: 1 },
		[TOOL_TYPES.woodpecker]: { visible: false, size: 1 },
		[TOOL_TYPES.grill]: { visible: false, size: 1 },
	};
}

export const TOOL_OPTIONS = [
	{ value: TOOL_TYPES.shovel, label: 'Shovel' },
	{ value: TOOL_TYPES.wateringCan, label: 'Watering Can' },
	{ value: TOOL_TYPES.ladder, label: 'Ladder' },
	{ value: TOOL_TYPES.axe, label: 'Axe' },
	{ value: TOOL_TYPES.rake, label: 'Rake' },
	{ value: TOOL_TYPES.woodpecker, label: 'Woodpecker' },
	{ value: TOOL_TYPES.grill, label: 'Grill' },
] as const;
