import { m } from '$lib/paraglide/messages.js';

export const SHAPE_LABELS: Record<string, () => string> = {
	oak: () => m.shape_oak(),
	pine: () => m.shape_pine(),
	birch: () => m.shape_birch(),
	fir: () => m.shape_fir(),
	maple: () => m.shape_maple(),
	willow: () => m.shape_willow(),
	cypress: () => m.shape_cypress(),
	apple: () => m.shape_apple(),
	cherry: () => m.shape_cherry(),
	bush: () => m.shape_bush(),
	baobab: () => m.shape_baobab(),
	acacia: () => m.shape_acacia(),
	custom: () => m.shape_custom(),
	random: () => m.shape_random(),
};

export const STAGE_LABELS: Record<string, () => string> = {
	seed: () => m.stage_seed(),
	sprouting: () => m.stage_sprouting(),
	sapling: () => m.stage_sapling(),
	growing: () => m.stage_growing(),
	leafy: () => m.stage_leafy(),
	flowering: () => m.stage_flowering(),
	fruiting: () => m.stage_fruiting(),
	seasonal: () => m.stage_seasonal(),
	wilting: () => m.stage_wilting(),
	bare: () => m.stage_bare(),
	dead: () => m.stage_dead(),
	stump: () => m.stage_stump(),
};

export const FRUIT_LABELS: Record<string, () => string> = {
	none: () => m.fruit_none(),
	acorn: () => m.fruit_acorn(),
	catkin_birch: () => m.fruit_catkin_birch(),
	samara: () => m.fruit_samara(),
	pine_cone: () => m.fruit_pine_cone(),
	fir_cone: () => m.fruit_fir_cone(),
	catkin_willow: () => m.fruit_catkin_willow(),
	small_cone: () => m.fruit_small_cone(),
	apple: () => m.fruit_apple(),
	cherry_pair: () => m.fruit_cherry_pair(),
	berry: () => m.fruit_berry(),
	baobab_fruit: () => m.fruit_baobab_fruit(),
	seed_pod: () => m.fruit_seed_pod(),
};

export const BOUNDARY_LABELS: Record<string, () => string> = {
	circle: () => m.boundary_circle(),
	egg: () => m.boundary_egg(),
	teardrop: () => m.boundary_teardrop(),
	isoscelesTriangle: () => m.boundary_isosceles_triangle(),
	equilateralTriangle: () => m.boundary_equilateral_triangle(),
};

export const CROOKEDNESS_LABELS: Record<string, () => string> = {
	alternating: () => m.crookedness_alternating(),
	random: () => m.crookedness_random(),
};

export const MIRRORING_LABELS: Record<string, () => string> = {
	off: () => m.mirror_off(),
	allowed: () => m.mirror_allowed(),
	preferred: () => m.mirror_preferred(),
};

export function translateOptions<T extends { value: string; label: string }>(
	options: readonly T[],
	labels: Record<string, () => string>,
): T[] {
	return options.map((o) => ({ ...o, label: labels[o.value]?.() ?? o.label }));
}
