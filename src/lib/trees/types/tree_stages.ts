export const TREE_STAGES = {
	seed: 'seed',
	sprouting: 'sprouting',
	sapling: 'sapling',
	growing: 'growing',
	leafy: 'leafy',
	flowering: 'flowering',
	fruiting: 'fruiting',
	seasonal: 'seasonal',
	wilting: 'wilting',
	bare: 'bare',
	dead: 'dead',
	stump: 'stump',
} as const;

export type TreeStage = (typeof TREE_STAGES)[keyof typeof TREE_STAGES];

export const TREE_STAGE_OPTIONS: readonly { value: TreeStage; label: string }[] = [
	{ value: TREE_STAGES.seed, label: 'Seed' },
	{ value: TREE_STAGES.sprouting, label: 'Sprouting' },
	{ value: TREE_STAGES.sapling, label: 'Sapling' },
	{ value: TREE_STAGES.growing, label: 'Growing' },
	{ value: TREE_STAGES.leafy, label: 'Leafy' },
	{ value: TREE_STAGES.flowering, label: 'Flowering' },
	{ value: TREE_STAGES.fruiting, label: 'Fruiting' },
	{ value: TREE_STAGES.seasonal, label: 'Seasonal' },
	{ value: TREE_STAGES.wilting, label: 'Wilting' },
	{ value: TREE_STAGES.bare, label: 'Bare' },
	{ value: TREE_STAGES.dead, label: 'Dead' },
	{ value: TREE_STAGES.stump, label: 'Stump' },
] as const;

export function isTreeStage(value: string): value is TreeStage {
	return (Object.values(TREE_STAGES) as readonly string[]).includes(value);
}
