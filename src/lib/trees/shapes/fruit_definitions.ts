import type { Component } from 'svelte';
import type { FruitType } from '../types/fruit.js';
import { FRUIT_TYPES } from '../types/fruit.js';
import {
	AcornSvg,
	AppleSvg,
	BaobabFruitSvg,
	BerrySvg,
	CatkinBirchSvg,
	CatkinWillowSvg,
	CherryPairSvg,
	FirConeSvg,
	PineConeSvg,
	SamaraSvg,
	SeedPodSvg,
	SmallConeSvg,
} from '../assets/fruits/index.js';

export interface FruitDefinition {
	readonly svgComponent: Component;
	readonly scale: number;
	readonly originOffset: { readonly x: number; readonly y: number };
}

export const FRUIT_DEFINITIONS = {
	[FRUIT_TYPES.acorn]: { svgComponent: AcornSvg, scale: 2, originOffset: { x: 0, y: 0 } },
	[FRUIT_TYPES.catkin_birch]: {
		svgComponent: CatkinBirchSvg,
		scale: 2,
		originOffset: { x: 0, y: 0 },
	},
	[FRUIT_TYPES.samara]: { svgComponent: SamaraSvg, scale: 2, originOffset: { x: 0, y: 0 } },
	[FRUIT_TYPES.pine_cone]: { svgComponent: PineConeSvg, scale: 2, originOffset: { x: 0, y: 0 } },
	[FRUIT_TYPES.fir_cone]: { svgComponent: FirConeSvg, scale: 2, originOffset: { x: 0, y: 0 } },
	[FRUIT_TYPES.catkin_willow]: {
		svgComponent: CatkinWillowSvg,
		scale: 2,
		originOffset: { x: 0, y: 0 },
	},
	[FRUIT_TYPES.small_cone]: {
		svgComponent: SmallConeSvg,
		scale: 2,
		originOffset: { x: 0, y: 0 },
	},
	[FRUIT_TYPES.apple]: { svgComponent: AppleSvg, scale: 2, originOffset: { x: 0, y: 0 } },
	[FRUIT_TYPES.cherry_pair]: {
		svgComponent: CherryPairSvg,
		scale: 2,
		originOffset: { x: 0, y: 0 },
	},
	[FRUIT_TYPES.berry]: { svgComponent: BerrySvg, scale: 2, originOffset: { x: 0, y: 0 } },
	[FRUIT_TYPES.baobab_fruit]: {
		svgComponent: BaobabFruitSvg,
		scale: 2,
		originOffset: { x: 0, y: 0 },
	},
	[FRUIT_TYPES.seed_pod]: { svgComponent: SeedPodSvg, scale: 2, originOffset: { x: 0, y: 0 } },
} as const satisfies Record<Exclude<FruitType, 'none'>, FruitDefinition>;
