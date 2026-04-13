import type { ToolType } from './tool_types.js';

export interface ToolAnimationConfig {
	readonly keyframeName: string;
	readonly duration: number;
}

export const TOOL_ANIMATIONS = {
	shovel: {
		keyframeName: 'tool-shovel-idle',
		duration: 2,
	},
	wateringCan: {
		keyframeName: 'tool-watering-can-idle',
		duration: 2.5,
	},
	ladder: {
		keyframeName: 'tool-ladder-idle',
		duration: 3,
	},
	axe: {
		keyframeName: 'tool-axe-idle',
		duration: 1.8,
	},
	rake: {
		keyframeName: 'tool-rake-idle',
		duration: 2.2,
	},
	woodpecker: {
		keyframeName: 'tool-woodpecker-idle',
		duration: 1.5,
	},
} as const satisfies Record<ToolType, ToolAnimationConfig>;
