import { TREE_SHAPES, type TreeShape } from '../types/config.js';
import type { Component } from 'svelte';
import {
	OakFlowerSvg,
	BirchFlowerSvg,
	MapleFlowerSvg,
	PineFlowerSvg,
	FirFlowerSvg,
	WillowFlowerSvg,
	CypressFlowerSvg,
	AppleFlowerSvg,
	CherryFlowerSvg,
	BushFlowerSvg,
	BaobabFlowerSvg,
	AcaciaFlowerSvg,
} from '../assets/flowers/index.js';

/**
 * Maps each non-custom tree shape to its flower SVG Svelte component.
 * Used during the flowering lifecycle stage.
 */
export const FLOWER_SVG_COMPONENTS: Record<Exclude<TreeShape, 'custom'>, Component> = {
	[TREE_SHAPES.oak]: OakFlowerSvg,
	[TREE_SHAPES.birch]: BirchFlowerSvg,
	[TREE_SHAPES.maple]: MapleFlowerSvg,
	[TREE_SHAPES.pine]: PineFlowerSvg,
	[TREE_SHAPES.fir]: FirFlowerSvg,
	[TREE_SHAPES.willow]: WillowFlowerSvg,
	[TREE_SHAPES.cypress]: CypressFlowerSvg,
	[TREE_SHAPES.apple]: AppleFlowerSvg,
	[TREE_SHAPES.cherry]: CherryFlowerSvg,
	[TREE_SHAPES.bush]: BushFlowerSvg,
	[TREE_SHAPES.baobab]: BaobabFlowerSvg,
	[TREE_SHAPES.acacia]: AcaciaFlowerSvg,
};
