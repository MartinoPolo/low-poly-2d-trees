import type { ToolType } from './tool_types.js';

export interface ToolAnimationConfig {
	readonly duration: number;
	readonly pivotPoint: { readonly x: number; readonly y: number };
}

export const TOOL_ANIMATIONS = {
	shovel: {
		duration: 2,
		pivotPoint: { x: 0, y: 25 },
	},
	wateringCan: {
		duration: 2.5,
		pivotPoint: { x: 16, y: 0 },
	},
	ladder: {
		duration: 3,
		pivotPoint: { x: 0, y: 0 },
	},
	axe: {
		duration: 1.8,
		pivotPoint: { x: 14, y: 0 },
	},
	rake: {
		duration: 2.2,
		pivotPoint: { x: 0, y: 18 },
	},
	woodpecker: {
		duration: 1.5,
		pivotPoint: { x: 6, y: 10 },
	},
	grill: {
		duration: 2,
		pivotPoint: { x: 10, y: 20 },
	},
	speechBubble: {
		duration: 0,
		pivotPoint: { x: 0, y: 0 },
	},
	stormCloud: {
		duration: 2,
		pivotPoint: { x: 0, y: -10 },
	},
} as const satisfies Record<ToolType, ToolAnimationConfig>;
