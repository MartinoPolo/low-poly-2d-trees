import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { TreeConfig } from '$lib/trees/types.js';
import { user } from './auth.schema.js';

export const savedTrees = pgTable('saved_trees', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	config: jsonb('config').$type<TreeConfig>().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
