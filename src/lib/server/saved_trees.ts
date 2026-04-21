import { and, desc, eq, like } from 'drizzle-orm';
import { db } from './db/index.js';
import { savedTrees } from './db/saved_trees.schema.js';
import { TREE_SHAPE_OPTIONS, type TreeConfig, type TreeShape } from '$lib/trees/types.js';

type SavedTreeRow = typeof savedTrees.$inferSelect;

async function nextAutoName(userId: string, shape: TreeShape): Promise<string> {
	const label = TREE_SHAPE_OPTIONS.find((o) => o.value === shape)?.label ?? shape;
	const rows = await db
		.select({ name: savedTrees.name })
		.from(savedTrees)
		.where(and(eq(savedTrees.userId, userId), like(savedTrees.name, `${label} #%`)))
		.orderBy(savedTrees.id);
	const maxNumber = rows.reduce((max, row) => {
		const match = row.name.match(/#(\d+)$/);
		return match ? Math.max(max, parseInt(match[1], 10)) : max;
	}, 0);
	return `${label} #${maxNumber + 1}`;
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
	if (row === undefined) {
		throw new Error('INSERT returned no rows');
	}
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
