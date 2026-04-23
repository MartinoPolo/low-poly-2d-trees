export const TOOL_TYPES = {
	shovel: 'shovel',
	wateringCan: 'wateringCan',
	ladder: 'ladder',
	axe: 'axe',
	rake: 'rake',
	woodpecker: 'woodpecker',
	grill: 'grill',
	speechBubble: 'speechBubble',
	stormCloud: 'stormCloud',
} as const;

export type ToolType = (typeof TOOL_TYPES)[keyof typeof TOOL_TYPES];

export interface ToolVisibilityEntry {
	visible: boolean;
	size: number;
	text?: string;
}

export type ToolVisibility = Record<ToolType, ToolVisibilityEntry>;

export function createDefaultToolVisibility(): ToolVisibility {
	return {
		[TOOL_TYPES.shovel]: { visible: false, size: 1 },
		[TOOL_TYPES.wateringCan]: { visible: false, size: 1 },
		[TOOL_TYPES.ladder]: { visible: false, size: 1 },
		[TOOL_TYPES.axe]: { visible: false, size: 1 },
		[TOOL_TYPES.rake]: { visible: false, size: 1 },
		[TOOL_TYPES.woodpecker]: { visible: false, size: 1 },
		[TOOL_TYPES.grill]: { visible: false, size: 1 },
		[TOOL_TYPES.speechBubble]: { visible: false, size: 1, text: '' },
		[TOOL_TYPES.stormCloud]: { visible: false, size: 1 },
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
	{ value: TOOL_TYPES.speechBubble, label: 'Speech Bubble' },
	{ value: TOOL_TYPES.stormCloud, label: 'Storm Cloud' },
] as const;
