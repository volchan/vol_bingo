import { foreignKey, pgEnum, pgTable, uuid, varchar } from 'drizzle-orm/pg-core'
import baseFields from './base'
import { users } from './users'

export const statusEnum = pgEnum('game_status', [
	'draft',
	'active',
	'completed',
])

export const games = pgTable(
	'games',
	{
		...baseFields,
		title: varchar().notNull(),
		creatorId: uuid()
			.references(() => users.id)
			.notNull(),
		friendlyId: varchar().notNull().unique(),
		winnerId: uuid().references(() => users.id),
		status: statusEnum().default('draft').notNull(),
	},
	(table) => [
		foreignKey({
			name: 'games_creatorId_fkey',
			columns: [table.creatorId],
			foreignColumns: [users.id],
		}).onDelete('cascade'),
	],
)
