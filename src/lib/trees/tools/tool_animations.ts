import type { ToolType } from './tool_types.js';

interface ToolAnimationConfig {
	readonly keyframeName: string;
	readonly duration: number;
	readonly cssProperty: string;
}

export const TOOL_ANIMATIONS = {
	shovel: {
		keyframeName: 'tool-shovel-idle',
		duration: 2,
		cssProperty: 'translateY',
	},
	ladder: {
		keyframeName: 'tool-ladder-idle',
		duration: 3,
		cssProperty: 'rotate',
	},
	wateringCan: {
		keyframeName: 'tool-watering-can-idle',
		duration: 2.5,
		cssProperty: 'rotate',
	},
	birdNest: {
		keyframeName: 'tool-bird-nest-idle',
		duration: 2,
		cssProperty: 'translateY',
	},
} as const satisfies Record<ToolType, ToolAnimationConfig>;
