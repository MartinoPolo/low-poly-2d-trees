import type { Component } from 'svelte';
import type { TreeShape } from '../types/config.js';
import { TREE_SHAPES } from '../types/config.js';
import {
	AcaciaFlowerSvg,
	AppleFlowerSvg,
	BaobabFlowerSvg,
	BirchFlowerSvg,
	BushFlowerSvg,
	CherryFlowerSvg,
	CypressFlowerSvg,
	FirFlowerSvg,
	MapleFlowerSvg,
	OakFlowerSvg,
	PineFlowerSvg,
	WillowFlowerSvg,
} from '../assets/flowers/index.js';

export interface FlowerDefinition {
	readonly svgComponent: Component;
	readonly scale: number;
	readonly originOffset: { readonly x: number; readonly y: number };
}

export const FLOWER_DEFINITIONS = {
	[TREE_SHAPES.oak]: { svgComponent: OakFlowerSvg, scale: 1, originOffset: { x: 0, y: 0 } },
	[TREE_SHAPES.pine]: { svgComponent: PineFlowerSvg, scale: 1, originOffset: { x: 0, y: 0 } },
	[TREE_SHAPES.birch]: { svgComponent: BirchFlowerSvg, scale: 1, originOffset: { x: 0, y: 0 } },
	[TREE_SHAPES.fir]: { svgComponent: FirFlowerSvg, scale: 1, originOffset: { x: 0, y: 0 } },
	[TREE_SHAPES.maple]: { svgComponent: MapleFlowerSvg, scale: 1, originOffset: { x: 0, y: 0 } },
	[TREE_SHAPES.willow]: { svgComponent: WillowFlowerSvg, scale: 1, originOffset: { x: 0, y: 0 } },
	[TREE_SHAPES.cypress]: {
		svgComponent: CypressFlowerSvg,
		scale: 1,
		originOffset: { x: 0, y: 0 },
	},
	[TREE_SHAPES.apple]: { svgComponent: AppleFlowerSvg, scale: 1, originOffset: { x: 0, y: 0 } },
	[TREE_SHAPES.cherry]: { svgComponent: CherryFlowerSvg, scale: 1, originOffset: { x: 0, y: 0 } },
	[TREE_SHAPES.bush]: { svgComponent: BushFlowerSvg, scale: 1, originOffset: { x: 0, y: 0 } },
	[TREE_SHAPES.baobab]: { svgComponent: BaobabFlowerSvg, scale: 1, originOffset: { x: 0, y: 0 } },
	[TREE_SHAPES.acacia]: { svgComponent: AcaciaFlowerSvg, scale: 1, originOffset: { x: 0, y: 0 } },
} as const satisfies Record<Exclude<TreeShape, 'custom'>, FlowerDefinition>;
