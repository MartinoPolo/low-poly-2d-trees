import type { Component } from 'svelte';
import type { ToolType } from './tool_types.js';
import { TOOL_TYPES } from './tool_types.js';

export type ToolAnchorKey =
	| 'trunkBase'
	| 'trunkMiddle'
	| 'trunkTop'
	| 'crownCenter'
	| 'crownTop'
	| 'roots';
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
	readonly anchorTarget: ToolAnchorKey;
	readonly snapOffset: { readonly x: number; readonly y: number };
	readonly pivotPoint: { readonly x: number; readonly y: number };
}

export const TOOL_DEFINITIONS = {
	[TOOL_TYPES.shovel]: {
		svgComponent: ShovelSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 0, y: 47 },
		pivotPoint: { x: 38, y: 2 },
	},
	[TOOL_TYPES.wateringCan]: {
		svgComponent: WateringCanSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 16, y: -8 },
		pivotPoint: { x: 16, y: 0 },
	},
	[TOOL_TYPES.ladder]: {
		svgComponent: LadderSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 4, y: 79 },
		pivotPoint: { x: 1, y: 0 },
	},
	[TOOL_TYPES.axe]: {
		svgComponent: AxeSvg,
		anchorTarget: 'trunkMiddle',
		snapOffset: { x: 50, y: 43 },
		pivotPoint: { x: 1, y: 44 },
	},
	[TOOL_TYPES.rake]: {
		svgComponent: RakeSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 24, y: 37 },
		pivotPoint: { x: 0, y: 1 },
	},
	[TOOL_TYPES.woodpecker]: {
		svgComponent: WoodpeckerSvg,
		anchorTarget: 'trunkMiddle',
		snapOffset: { x: 12, y: -12 },
		pivotPoint: { x: 0, y: 12 },
	},
	[TOOL_TYPES.grill]: {
		svgComponent: GrillSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: -25, y: 25 },
		pivotPoint: { x: 10, y: 20 },
	},
	[TOOL_TYPES.speechBubble]: {
		svgComponent: SpeechBubbleSvg,
		anchorTarget: 'crownTop',
		snapOffset: { x: 0, y: -10 },
		pivotPoint: { x: 0, y: 0 },
	},
	[TOOL_TYPES.stormCloud]: {
		svgComponent: StormCloudSvg,
		anchorTarget: 'crownTop',
		snapOffset: { x: 0, y: 10 },
		pivotPoint: { x: 0, y: -20 },
	},
} as const satisfies Record<ToolType, ToolDefinition>;
