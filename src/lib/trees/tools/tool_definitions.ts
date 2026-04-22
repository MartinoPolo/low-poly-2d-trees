import type { Component } from 'svelte';
import type { TreeAnchors } from '$lib/trees/types/core.js';
import type { ToolType } from './tool_types.js';
import { TOOL_TYPES } from './tool_types.js';
import ShovelSvg from '$lib/trees/assets/tools/ShovelSvg.svelte';
import WateringCanSvg from '$lib/trees/assets/tools/WateringCanSvg.svelte';
import LadderSvg from '$lib/trees/assets/tools/LadderSvg.svelte';
import AxeSvg from '$lib/trees/assets/tools/AxeSvg.svelte';
import RakeSvg from '$lib/trees/assets/tools/RakeSvg.svelte';
import WoodpeckerSvg from '$lib/trees/assets/tools/WoodpeckerSvg.svelte';
import GrillSvg from '$lib/trees/assets/tools/GrillSvg.svelte';
import SpeechBubbleSvg from '$lib/trees/assets/tools/SpeechBubbleSvg.svelte';
import StormCloudSvg from '$lib/trees/assets/tools/StormCloudSvg.svelte';

export interface ToolDefinition {
	readonly svgComponent: Component;
	readonly anchorTarget: keyof TreeAnchors;
	readonly snapOffset: { readonly x: number; readonly y: number };
}

export const TOOL_DEFINITIONS = {
	[TOOL_TYPES.shovel]: {
		svgComponent: ShovelSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 0, y: 25 },
	},
	[TOOL_TYPES.wateringCan]: {
		svgComponent: WateringCanSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 16, y: -8 },
	},
	[TOOL_TYPES.ladder]: {
		svgComponent: LadderSvg,
		anchorTarget: 'trunkMiddle',
		snapOffset: { x: 0, y: -27 },
	},
	[TOOL_TYPES.axe]: {
		svgComponent: AxeSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 14, y: -18 },
	},
	[TOOL_TYPES.rake]: {
		svgComponent: RakeSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 0, y: 18 },
	},
	[TOOL_TYPES.woodpecker]: {
		svgComponent: WoodpeckerSvg,
		anchorTarget: 'trunkMiddle',
		snapOffset: { x: 6, y: 10 },
	},
	[TOOL_TYPES.grill]: {
		svgComponent: GrillSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: -25, y: 25 },
	},
	[TOOL_TYPES.speechBubble]: {
		svgComponent: SpeechBubbleSvg,
		anchorTarget: 'crownTop',
		snapOffset: { x: 0, y: -10 },
	},
	[TOOL_TYPES.stormCloud]: {
		svgComponent: StormCloudSvg,
		anchorTarget: 'crownTop',
		snapOffset: { x: 0, y: 10 },
	},
} as const satisfies Record<ToolType, ToolDefinition>;
