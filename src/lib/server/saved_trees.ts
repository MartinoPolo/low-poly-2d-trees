import { and, desc, eq, like } from 'drizzle-orm';
import { db } from './db/index.js';
import { savedTrees } from './db/saved_trees.schema.js';
import { TREE_SHAPES, type TreeConfig, type TreeShape } from '$lib/trees/types.js';

const SHAPE_LABELS: Record<TreeShape, string> = {
	[TREE_SHAPES.oak]: 'Oak',
	[TREE_SHAPES.pine]: 'Pine',
	[TREE_SHAPES.birch]: 'Birch',
	[TREE_SHAPES.fir]: 'Fir',
	[TREE_SHAPES.maple]: 'Maple',
	[TREE_SHAPES.willow]: 'Willow',
	[TREE_SHAPES.cypress]: 'Cypress',
	[TREE_SHAPES.apple]: 'Apple',
	[TREE_SHAPES.cherry]: 'Cherry',
	[TREE_SHAPES.bush]: 'Bush',
	[TREE_SHAPES.baobab]: 'Baobab',
	[TREE_SHAPES.acacia]: 'Acacia',
	[TREE_SHAPES.custom]: 'Custom',
} as const;

type SavedTreeRow = typeof savedTrees.$inferSelect;

async function nextAutoName(userId: string, shape: TreeShape): Promise<string> {
	const label = SHAPE_LABELS[shape];
	const rows = await db
		.select({ id: savedTrees.id })
		.from(savedTrees)
		.where(and(eq(savedTrees.userId, userId), like(savedTrees.name, `${label} #%`)))
		.orderBy(savedTrees.id);
	return `${label} #${rows.length + 1}`;
}

interface CreateSavedTreeInput {
	readonly userId: string;
	readonly shape: TreeShape;
	readonly config: TreeConfig;
}

export async function createSavedTree(input: CreateSavedTreeInput): Promise<SavedTreeRow> {
	const name = await nextAutoName(input.userId, input.shape);
	const id = crypto.randomUUID();
	const [row] = await db
		.insert(savedTrees)
		.values({
			id,
			userId: input.userId,
			name,
			config: input.config,
		})
		.returning();
	return row;
}

export async function listSavedTrees(userId: string): Promise<SavedTreeRow[]> {
	return db
		.select()
		.from(savedTrees)
		.where(eq(savedTrees.userId, userId))
		.orderBy(desc(savedTrees.createdAt));
}

export async function getSavedTree(id: string, userId: string): Promise<SavedTreeRow | null> {
	const [row] = await db
		.select()
		.from(savedTrees)
		.where(and(eq(savedTrees.id, id), eq(savedTrees.userId, userId)))
		.limit(1);
	return row ?? null;
}

export async function deleteSavedTree(id: string, userId: string): Promise<void> {
	await db.delete(savedTrees).where(and(eq(savedTrees.id, id), eq(savedTrees.userId, userId)));
}

export async function renameSavedTree(id: string, userId: string, name: string): Promise<void> {
	await db
		.update(savedTrees)
		.set({ name, updatedAt: new Date() })
		.where(and(eq(savedTrees.id, id), eq(savedTrees.userId, userId)));
}
