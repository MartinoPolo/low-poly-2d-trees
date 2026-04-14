import { FRUIT_TYPES, type FruitType } from '../types/fruit.js';
import type { Component } from 'svelte';
import {
	AcornSvg,
	CatkinBirchSvg,
	SamaraSvg,
	PineConeSvg,
	FirConeSvg,
	CatkinWillowSvg,
	SmallConeSvg,
	AppleSvg,
	CherryPairSvg,
	BerrySvg,
	BaobabFruitSvg,
	SeedPodSvg,
} from '../assets/fruits/index.js';

/**
 * Maps each non-none fruit type to its SVG Svelte component.
 * The renderer places these at fruit slot positions via `<svelte:component>`.
 */
export const FRUIT_SVG_COMPONENTS: Record<Exclude<FruitType, 'none'>, Component> = {
	[FRUIT_TYPES.acorn]: AcornSvg,
	[FRUIT_TYPES.catkin_birch]: CatkinBirchSvg,
	[FRUIT_TYPES.samara]: SamaraSvg,
	[FRUIT_TYPES.pine_cone]: PineConeSvg,
	[FRUIT_TYPES.fir_cone]: FirConeSvg,
	[FRUIT_TYPES.catkin_willow]: CatkinWillowSvg,
	[FRUIT_TYPES.small_cone]: SmallConeSvg,
	[FRUIT_TYPES.apple]: AppleSvg,
	[FRUIT_TYPES.cherry_pair]: CherryPairSvg,
	[FRUIT_TYPES.berry]: BerrySvg,
	[FRUIT_TYPES.baobab_fruit]: BaobabFruitSvg,
	[FRUIT_TYPES.seed_pod]: SeedPodSvg,
};
