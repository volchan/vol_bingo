import { pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import baseFields from './base'
import { cells } from './cells'
import { games } from './games'

export const gameCells = pgTable(
	'game_cells',
	{
		...baseFields,
		gameId: uuid()
			.notNull()
			.references(() => games.id, {
				onDelete: 'cascade',
			}),
		cellId: uuid()
			.notNull()
			.references(() => cells.id, {
				onDelete: 'cascade',
			}),
	},
	(table) => [
		uniqueIndex('game_cells_gameId_cellId_idx').on(table.gameId, table.cellId),
	],
)
