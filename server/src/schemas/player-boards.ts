import {
	boolean,
	foreignKey,
	pgEnum,
	pgTable,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'
import baseFields from './base'
import { games } from './games'
import { users } from './users'

export const statusEnum = pgEnum('player_board_status', [
	'pending',
	'ready',
	'playing',
])

export const playerBoards = pgTable(
	'player_boards',
	{
		...baseFields,
		playerId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		gameId: uuid()
			.notNull()
			.references(() => games.id, { onDelete: 'cascade' }),
		status: statusEnum().default('pending').notNull(),
		connected: boolean().default(false).notNull(),
	},
	(table) => [
		uniqueIndex('player_boards_playerId_gameId_idx').on(
			table.playerId,
			table.gameId,
		),
		foreignKey({
			name: 'player_boards_playerId_fkey',
			columns: [table.playerId],
			foreignColumns: [users.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'player_boards_gameId_fkey',
			columns: [table.gameId],
			foreignColumns: [games.id],
		}).onDelete('cascade'),
	],
)
