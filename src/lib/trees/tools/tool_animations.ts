import type { ToolType } from './tool_types.js';

export interface ToolAnimationConfig {
	readonly duration: number;
}

export const TOOL_ANIMATIONS = {
	shovel: { duration: 2 },
	wateringCan: { duration: 2.5 },
	ladder: { duration: 3 },
	axe: { duration: 1.8 },
	rake: { duration: 2.2 },
	woodpecker: { duration: 1.5 },
	grill: { duration: 2 },
	speechBubble: { duration: 0 },
	stormCloud: { duration: 2 },
} as const satisfies Partial<Record<ToolType, ToolAnimationConfig>>;

const DEFAULT_ANIMATION: ToolAnimationConfig = { duration: 0 };

export function getToolAnimation(toolType: ToolType): ToolAnimationConfig {
	return TOOL_ANIMATIONS[toolType as keyof typeof TOOL_ANIMATIONS] ?? DEFAULT_ANIMATION;
}
