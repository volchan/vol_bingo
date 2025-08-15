import { foreignKey, pgTable, uuid, varchar } from 'drizzle-orm/pg-core'
import baseFields from './base'
import { users } from './users'

export const games = pgTable(
	'games',
	{
		...baseFields,
		title: varchar().notNull(),
		creatorId: uuid().notNull(),
	},
	(table) => [
		foreignKey({
			name: 'games_creatorId_fkey',
			columns: [table.creatorId],
			foreignColumns: [users.id],
		}).onDelete('cascade'),
	],
)
