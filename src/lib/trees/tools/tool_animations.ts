import type { ToolType } from './tool_types.js';

interface ToolAnimationConfig {
	readonly keyframeName: string;
	readonly duration: number;
}

export const TOOL_ANIMATIONS = {
	shovel: {
		keyframeName: 'tool-shovel-idle',
		duration: 2,
	},
	ladder: {
		keyframeName: 'tool-ladder-idle',
		duration: 3,
	},
	wateringCan: {
		keyframeName: 'tool-watering-can-idle',
		duration: 2.5,
	},
	birdNest: {
		keyframeName: 'tool-bird-nest-idle',
		duration: 2,
	},
} as const satisfies Record<ToolType, ToolAnimationConfig>;
