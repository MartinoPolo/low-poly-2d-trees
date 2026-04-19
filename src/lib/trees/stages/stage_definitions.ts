import type { Component } from 'svelte';
import { SeedSvg, SproutingSvg, StumpSvg } from '../assets/stages/index.js';

export const STAGE_ASSET_TYPES = {
	seed: 'seed',
	sprouting: 'sprouting',
	stump: 'stump',
} as const;

type StageAssetType = (typeof STAGE_ASSET_TYPES)[keyof typeof STAGE_ASSET_TYPES];

interface StageDefinition {
	readonly svgComponent: Component;
	readonly scale: number;
	readonly positionOffset: { readonly x: number; readonly y: number };
}

export const STAGE_DEFINITIONS = {
	[STAGE_ASSET_TYPES.seed]: {
		svgComponent: SeedSvg,
		scale: 1,
		positionOffset: { x: 0, y: 0 },
	},
	[STAGE_ASSET_TYPES.sprouting]: {
		svgComponent: SproutingSvg,
		scale: 1,
		positionOffset: { x: 0, y: 0 },
	},
	[STAGE_ASSET_TYPES.stump]: {
		svgComponent: StumpSvg,
		scale: 1,
		positionOffset: { x: 0, y: 0 },
	},
} as const satisfies Record<StageAssetType, StageDefinition>;
