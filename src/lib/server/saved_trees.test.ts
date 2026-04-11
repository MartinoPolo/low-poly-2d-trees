import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_TREE_CONFIG, TREE_SHAPES, type TreeShape } from '$lib/trees/types.js';

interface SavedRow {
	id: string;
	userId: string;
	name: string;
	config: typeof DEFAULT_TREE_CONFIG;
	createdAt: Date;
	updatedAt: Date;
}

// In-memory fake DB. The mock translates drizzle chain calls into in-memory operations.
const rows: SavedRow[] = [];

function resetDb() {
	rows.length = 0;
}

// Filter predicates captured by the mocked chain.
interface Filter {
	userId?: string;
	id?: string;
	nameLike?: string;
}

function matches(row: SavedRow, f: Filter): boolean {
	if (f.userId !== undefined && row.userId !== f.userId) {
		return false;
	}
	if (f.id !== undefined && row.id !== f.id) {
		return false;
	}
	if (f.nameLike !== undefined) {
		const prefix = f.nameLike.replace('%', '');
		if (!row.name.startsWith(prefix)) {
			return false;
		}
	}
	return true;
}

// The mocked drizzle operators return tagged filter descriptors.
vi.mock('drizzle-orm', () => ({
	and: (...parts: Filter[]): Filter => Object.assign({}, ...parts),
	eq: (col: { name: string }, value: string): Filter => {
		if (col.name === 'user_id') {
			return { userId: value };
		}
		if (col.name === 'id') {
			return { id: value };
		}
		if (col.name === 'name') {
			return { nameLike: value };
		}
		return {};
	},
	like: (_col: unknown, value: string): Filter => ({ nameLike: value }),
	desc: (col: unknown) => col,
}));

vi.mock('./db/saved_trees.schema.js', () => ({
	savedTrees: {
		id: { name: 'id' },
		userId: { name: 'user_id' },
		name: { name: 'name' },
		config: { name: 'config' },
		createdAt: { name: 'created_at' },
		updatedAt: { name: 'updated_at' },
		$inferSelect: {} as SavedRow,
	},
}));

vi.mock('./db/index.js', () => {
	function selectBuilder() {
		let filter: Filter = {};
		const api = {
			from: () => api,
			where: (f: Filter) => {
				filter = f;
				return api;
			},
			orderBy: async () =>
				rows
					.slice()
					.filter((r) => matches(r, filter))
					.reverse(),
			limit: async () => rows.filter((r) => matches(r, filter)).slice(0, 1),
		};
		return api;
	}

	function insertBuilder() {
		let pending: Omit<SavedRow, 'createdAt' | 'updatedAt'> | null = null;
		const api = {
			values: (v: Omit<SavedRow, 'createdAt' | 'updatedAt'>) => {
				pending = v;
				return api;
			},
			returning: async () => {
				if (!pending) {
					throw new Error('no values');
				}
				const now = new Date();
				const row: SavedRow = { ...pending, createdAt: now, updatedAt: now };
				rows.push(row);
				return [row];
			},
		};
		return api;
	}

	function deleteBuilder() {
		const api = {
			where: async (f: Filter) => {
				for (let i = rows.length - 1; i >= 0; i--) {
					if (matches(rows[i], f)) {
						rows.splice(i, 1);
					}
				}
			},
		};
		return api;
	}

	function updateBuilder() {
		let pending: Partial<SavedRow> = {};
		const api = {
			set: (v: Partial<SavedRow>) => {
				pending = v;
				return api;
			},
			where: async (f: Filter) => {
				for (const row of rows) {
					if (matches(row, f)) {
						Object.assign(row, pending);
					}
				}
			},
		};
		return api;
	}

	return {
		db: {
			select: () => selectBuilder(),
			insert: () => insertBuilder(),
			delete: () => deleteBuilder(),
			update: () => updateBuilder(),
		},
	};
});

import {
	createSavedTree,
	deleteSavedTree,
	getSavedTree,
	listSavedTrees,
	renameSavedTree,
} from './saved_trees.js';

function makeConfig(shape: TreeShape = TREE_SHAPES.oak) {
	return { ...DEFAULT_TREE_CONFIG, shape };
}

beforeEach(() => {
	resetDb();
});

describe('createSavedTree', () => {
	it('assigns auto-name "{Shape} #1" for the first save of a shape', async () => {
		const row = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(TREE_SHAPES.oak),
		});
		expect(row.name).toBe('Oak #1');
	});

	it('increments auto-name per user + per shape', async () => {
		await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(TREE_SHAPES.oak),
		});
		const second = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(TREE_SHAPES.oak),
		});
		const pineFirst = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.pine,
			config: makeConfig(TREE_SHAPES.pine),
		});
		expect(second.name).toBe('Oak #2');
		expect(pineFirst.name).toBe('Pine #1');
	});

	it('isolates auto-name counter between users', async () => {
		await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(),
		});
		const forUserB = await createSavedTree({
			userId: 'user-b',
			shape: TREE_SHAPES.oak,
			config: makeConfig(),
		});
		expect(forUserB.name).toBe('Oak #1');
	});

	it('capitalizes custom shape as "Custom #N"', async () => {
		const row = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.custom,
			config: makeConfig(TREE_SHAPES.custom),
		});
		expect(row.name).toBe('Custom #1');
	});

	it('persists the config snapshot as-is', async () => {
		const config = { ...makeConfig(), seed: 1234 };
		const row = await createSavedTree({
			userId: 'user-a',
			shape: config.shape,
			config,
		});
		expect(row.config.seed).toBe(1234);
	});
});

describe('listSavedTrees', () => {
	it('returns only the requested user rows', async () => {
		await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(),
		});
		await createSavedTree({
			userId: 'user-b',
			shape: TREE_SHAPES.oak,
			config: makeConfig(),
		});
		const forUserA = await listSavedTrees('user-a');
		expect(forUserA).toHaveLength(1);
		expect(forUserA[0].userId).toBe('user-a');
	});

	it('returns rows in reverse-insertion order (newest first)', async () => {
		const first = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(),
		});
		const second = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.pine,
			config: makeConfig(TREE_SHAPES.pine),
		});
		const list = await listSavedTrees('user-a');
		expect(list[0].id).toBe(second.id);
		expect(list[1].id).toBe(first.id);
	});
});

describe('getSavedTree', () => {
	it('returns a row the user owns', async () => {
		const created = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(),
		});
		const fetched = await getSavedTree(created.id, 'user-a');
		expect(fetched?.id).toBe(created.id);
	});

	it('returns null when the row is owned by another user', async () => {
		const created = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(),
		});
		const fetched = await getSavedTree(created.id, 'user-b');
		expect(fetched).toBeNull();
	});
});

describe('deleteSavedTree', () => {
	it('deletes a row the user owns', async () => {
		const created = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(),
		});
		await deleteSavedTree(created.id, 'user-a');
		const afterList = await listSavedTrees('user-a');
		expect(afterList).toHaveLength(0);
	});

	it('does not delete rows owned by another user', async () => {
		const created = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(),
		});
		await deleteSavedTree(created.id, 'user-b');
		const afterList = await listSavedTrees('user-a');
		expect(afterList).toHaveLength(1);
	});
});

describe('renameSavedTree', () => {
	it('updates name for a row the user owns', async () => {
		const created = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(),
		});
		await renameSavedTree(created.id, 'user-a', 'My Favorite Oak');
		const fetched = await getSavedTree(created.id, 'user-a');
		expect(fetched?.name).toBe('My Favorite Oak');
	});

	it('does not update name for a row owned by another user', async () => {
		const created = await createSavedTree({
			userId: 'user-a',
			shape: TREE_SHAPES.oak,
			config: makeConfig(),
		});
		await renameSavedTree(created.id, 'user-b', 'Hacked Name');
		const fetched = await getSavedTree(created.id, 'user-a');
		expect(fetched?.name).toBe('Oak #1');
	});
});
