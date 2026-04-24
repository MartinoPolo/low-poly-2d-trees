import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { command, form, getRequestEvent, query } from '$app/server';
import * as savedTreesDb from '$lib/server/saved_trees.js';
import { DEFAULT_TREE_CONFIG, TREE_SHAPES, type TreeShape } from '$lib/trees/types.js';
import { isValidTreeConfig } from '$lib/config/validators/index.js';

function requireUser() {
	const { locals } = getRequestEvent();
	if (!locals.user) {
		error(401, 'Unauthorized');
	}
	return locals.user;
}

const treeShapeSchema = v.picklist(Object.values(TREE_SHAPES));

export const listSavedTrees = query(async () => {
	const user = requireUser();
	const rows = await savedTreesDb.listSavedTrees(user.id);
	return rows.map((row) => ({
		...row,
		config: { ...DEFAULT_TREE_CONFIG, ...(isValidTreeConfig(row.config) ? row.config : {}) },
	}));
});

export const getSavedTree = query(v.string(), async (id) => {
	const user = requireUser();
	const row = await savedTreesDb.getSavedTree(id, user.id);
	if (!row) {
		error(404, 'Not found');
	}
	return {
		...row,
		config: { ...DEFAULT_TREE_CONFIG, ...(isValidTreeConfig(row.config) ? row.config : {}) },
	};
});

export const saveTree = form(
	v.object({
		config: v.pipe(
			v.string(),
			v.transform((s) => {
				try {
					const parsed: unknown = JSON.parse(s);
					if (!isValidTreeConfig(parsed)) {
						throw new Error('Invalid tree configuration');
					}
					return parsed;
				} catch {
					throw new Error('Invalid tree configuration');
				}
			}),
		),
	}),
	async ({ config }) => {
		const user = requireUser();
		let shape: TreeShape;
		try {
			shape = v.parse(treeShapeSchema, config.shape);
		} catch {
			throw error(400, 'Invalid tree shape');
		}
		const saved = await savedTreesDb.createSavedTree({
			userId: user.id,
			shape,
			config,
		});
		void listSavedTrees().refresh();
		return { success: true, id: saved.id, name: saved.name };
	},
);

export const deleteSavedTree = command(v.string(), async (id) => {
	const user = requireUser();
	await savedTreesDb.deleteSavedTree(id, user.id);
	void listSavedTrees().refresh();
});

export const renameSavedTree = command(
	v.object({
		id: v.string(),
		name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(80)),
	}),
	async ({ id, name }) => {
		const user = requireUser();
		await savedTreesDb.renameSavedTree(id, user.id, name);
		void listSavedTrees().refresh();
	},
);
