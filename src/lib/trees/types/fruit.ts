import type { TreeShape } from './config.js';

export const FRUIT_TYPES = {
	none: 'none',
	acorn: 'acorn',
	catkin_birch: 'catkin_birch',
	samara: 'samara',
	pine_cone: 'pine_cone',
	fir_cone: 'fir_cone',
	catkin_willow: 'catkin_willow',
	small_cone: 'small_cone',
	apple: 'apple',
	cherry_pair: 'cherry_pair',
	berry: 'berry',
	baobab_fruit: 'baobab_fruit',
	seed_pod: 'seed_pod',
} as const;

export type FruitType = (typeof FRUIT_TYPES)[keyof typeof FRUIT_TYPES];

export const FRUIT_TYPE_OPTIONS: readonly { value: FruitType; label: string }[] = [
	{ value: FRUIT_TYPES.none, label: 'None' },
	{ value: FRUIT_TYPES.acorn, label: 'Acorn' },
	{ value: FRUIT_TYPES.catkin_birch, label: 'Catkin (Birch)' },
	{ value: FRUIT_TYPES.samara, label: 'Samara' },
	{ value: FRUIT_TYPES.pine_cone, label: 'Pine Cone' },
	{ value: FRUIT_TYPES.fir_cone, label: 'Fir Cone' },
	{ value: FRUIT_TYPES.catkin_willow, label: 'Catkin (Willow)' },
	{ value: FRUIT_TYPES.small_cone, label: 'Small Cone' },
	{ value: FRUIT_TYPES.apple, label: 'Apple' },
	{ value: FRUIT_TYPES.cherry_pair, label: 'Cherry Pair' },
	{ value: FRUIT_TYPES.berry, label: 'Berry' },
	{ value: FRUIT_TYPES.baobab_fruit, label: 'Baobab Fruit' },
	{ value: FRUIT_TYPES.seed_pod, label: 'Seed Pod' },
] as const;

/**
 * Maps each non-custom tree shape to its locked default fruit type.
 * Only `custom` allows free selection from the full fruit dropdown.
 */
export const SHAPE_FRUIT_MAP = {
	oak: FRUIT_TYPES.acorn,
	birch: FRUIT_TYPES.catkin_birch,
	maple: FRUIT_TYPES.samara,
	pine: FRUIT_TYPES.pine_cone,
	fir: FRUIT_TYPES.fir_cone,
	willow: FRUIT_TYPES.catkin_willow,
	cypress: FRUIT_TYPES.small_cone,
	apple: FRUIT_TYPES.apple,
	cherry: FRUIT_TYPES.cherry_pair,
	bush: FRUIT_TYPES.berry,
	baobab: FRUIT_TYPES.baobab_fruit,
	acacia: FRUIT_TYPES.seed_pod,
} as const satisfies Record<Exclude<TreeShape, 'custom'>, FruitType>;

export function isFruitType(value: string): value is FruitType {
	return (Object.values(FRUIT_TYPES) as readonly string[]).includes(value);
}
