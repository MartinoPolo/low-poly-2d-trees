import type { Component } from 'svelte';
import type { ToolType } from './tool_types.js';
import ShovelSvg from '$lib/trees/assets/tools/ShovelSvg.svelte';
import WateringCanSvg from '$lib/trees/assets/tools/WateringCanSvg.svelte';
import LadderSvg from '$lib/trees/assets/tools/LadderSvg.svelte';
import AxeSvg from '$lib/trees/assets/tools/AxeSvg.svelte';
import RakeSvg from '$lib/trees/assets/tools/RakeSvg.svelte';
import WoodpeckerSvg from '$lib/trees/assets/tools/WoodpeckerSvg.svelte';
import GrillSvg from '$lib/trees/assets/tools/GrillSvg.svelte';
import SpeechBubbleSvg from '$lib/trees/assets/tools/SpeechBubbleSvg.svelte';
import StormCloudSvg from '$lib/trees/assets/tools/StormCloudSvg.svelte';
import LanternSvg from '$lib/trees/assets/tools/LanternSvg.svelte';
import PruningShearsSvg from '$lib/trees/assets/tools/PruningShearsSvg.svelte';

export type ToolAnchorKey =
	| 'trunkBase'
	| 'trunkMiddle'
	| 'trunkTop'
	| 'crownCenter'
	| 'crownTop'
	| 'roots';

export interface ToolDefinition {
	readonly svgComponent: Component;
	readonly anchorTarget: ToolAnchorKey;
	readonly snapOffset: { readonly x: number; readonly y: number };
	readonly pivotPoint: { readonly x: number; readonly y: number };
}

export const TOOL_DEFINITIONS = {
	shovel: {
		svgComponent: ShovelSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 0, y: 47 },
		pivotPoint: { x: 38, y: 2 },
	},
	wateringCan: {
		svgComponent: WateringCanSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 16, y: -8 },
		pivotPoint: { x: 16, y: 0 },
	},
	ladder: {
		svgComponent: LadderSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 4, y: 79 },
		pivotPoint: { x: 1, y: 0 },
	},
	axe: {
		svgComponent: AxeSvg,
		anchorTarget: 'trunkMiddle',
		snapOffset: { x: 50, y: 43 },
		pivotPoint: { x: 1, y: 44 },
	},
	rake: {
		svgComponent: RakeSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 24, y: 37 },
		pivotPoint: { x: 0, y: 1 },
	},
	woodpecker: {
		svgComponent: WoodpeckerSvg,
		anchorTarget: 'trunkMiddle',
		snapOffset: { x: 12, y: -12 },
		pivotPoint: { x: 0, y: 12 },
	},
	grill: {
		svgComponent: GrillSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: -25, y: 25 },
		pivotPoint: { x: 10, y: 20 },
	},
	speechBubble: {
		svgComponent: SpeechBubbleSvg,
		anchorTarget: 'crownTop',
		snapOffset: { x: 0, y: -10 },
		pivotPoint: { x: 0, y: 0 },
	},
	stormCloud: {
		svgComponent: StormCloudSvg,
		anchorTarget: 'crownTop',
		snapOffset: { x: 0, y: 10 },
		pivotPoint: { x: 0, y: -20 },
	},
	lantern: {
		svgComponent: LanternSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: -20, y: 25 },
		pivotPoint: { x: 20, y: 50 },
	},
	pruningShears: {
		svgComponent: PruningShearsSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 20, y: 30 },
		pivotPoint: { x: 15, y: 20 },
	},
} satisfies Partial<Record<ToolType, ToolDefinition>>;

/**
 * Safely get a tool definition, returning undefined if not found.
 * Enables graceful degradation for tools without SVG components.
 */
export function getToolDefinition(toolType: ToolType): ToolDefinition | undefined {
	return (TOOL_DEFINITIONS as Partial<Record<ToolType, ToolDefinition>>)[toolType];
}
