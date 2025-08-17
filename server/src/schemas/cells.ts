import { sql } from 'drizzle-orm'
import { pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import baseFields from './base'
import { users } from './users'

export const cells = pgTable(
	'cells',
	{
		...baseFields,
		value: varchar().notNull(),
		userId: uuid()
			.notNull()
			.references(() => users.id, {
				onDelete: 'cascade',
			}),
	},
	(table) => [
		uniqueIndex('cells_userId_value_idx').on(
			table.userId,
			sql`lower(${table.value})`,
		),
	],
)
