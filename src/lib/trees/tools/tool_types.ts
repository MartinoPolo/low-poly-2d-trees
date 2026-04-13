import type { TreeAnchors } from '$lib/trees/types/core.js';

export const TOOL_TYPES = {
	shovel: 'shovel',
	ladder: 'ladder',
	wateringCan: 'wateringCan',
	birdNest: 'birdNest',
} as const;

export type ToolType = (typeof TOOL_TYPES)[keyof typeof TOOL_TYPES];

export interface ToolVisibilityEntry {
	visible: boolean;
	size: number;
}

export type ToolVisibility = Record<ToolType, ToolVisibilityEntry>;

export const TOOL_ANCHOR_MAP = {
	[TOOL_TYPES.shovel]: 'trunkBase',
	[TOOL_TYPES.ladder]: 'trunkMiddle',
	[TOOL_TYPES.wateringCan]: 'trunkBase',
	[TOOL_TYPES.birdNest]: 'crownCenter',
} as const satisfies Record<ToolType, keyof TreeAnchors>;

export const DEFAULT_TOOL_VISIBILITY: ToolVisibility = {
	[TOOL_TYPES.shovel]: { visible: false, size: 1 },
	[TOOL_TYPES.ladder]: { visible: false, size: 1 },
	[TOOL_TYPES.wateringCan]: { visible: false, size: 1 },
	[TOOL_TYPES.birdNest]: { visible: false, size: 1 },
};

export const TOOL_OPTIONS = [
	{ value: TOOL_TYPES.shovel, label: 'Shovel' },
	{ value: TOOL_TYPES.ladder, label: 'Ladder' },
	{ value: TOOL_TYPES.wateringCan, label: 'Watering Can' },
	{ value: TOOL_TYPES.birdNest, label: 'Bird Nest' },
] as const;
