export const TREE_SHAPES = {
	oak: 'oak',
	pine: 'pine',
	birch: 'birch',
	fir: 'fir',
	maple: 'maple',
	willow: 'willow',
	cypress: 'cypress',
	apple: 'apple',
	cherry: 'cherry',
	bush: 'bush',
	baobab: 'baobab',
	acacia: 'acacia',
	custom: 'custom',
} as const;

export type TreeShape = (typeof TREE_SHAPES)[keyof typeof TREE_SHAPES];

export const TREE_SHAPE_OPTIONS: readonly { value: TreeShape; label: string }[] = [
	{ value: TREE_SHAPES.oak, label: 'Oak' },
	{ value: TREE_SHAPES.pine, label: 'Pine' },
	{ value: TREE_SHAPES.birch, label: 'Birch' },
	{ value: TREE_SHAPES.fir, label: 'Fir' },
	{ value: TREE_SHAPES.maple, label: 'Maple' },
	{ value: TREE_SHAPES.willow, label: 'Willow' },
	{ value: TREE_SHAPES.cypress, label: 'Cypress' },
	{ value: TREE_SHAPES.apple, label: 'Apple' },
	{ value: TREE_SHAPES.cherry, label: 'Cherry' },
	{ value: TREE_SHAPES.bush, label: 'Bush' },
	{ value: TREE_SHAPES.baobab, label: 'Baobab' },
	{ value: TREE_SHAPES.acacia, label: 'Acacia' },
	{ value: TREE_SHAPES.custom, label: 'Custom' },
] as const;

export function isTreeShape(value: string): value is TreeShape {
	return (Object.values(TREE_SHAPES) as readonly string[]).includes(value);
}
