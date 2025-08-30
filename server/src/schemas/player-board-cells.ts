import {
	foreignKey,
	integer,
	pgTable,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'
import baseFields from './base'
import { gameCells } from './game-cells'
import { playerBoards } from './player-boards'

export const playerBoardCells = pgTable(
	'player_board_cells',
	{
		...baseFields,
		playerBoardId: uuid().references(() => playerBoards.id),
		gameCellId: uuid().references(() => gameCells.id),
		position: integer().notNull(),
	},
	(table) => [
		uniqueIndex('player_board_cells_playerBoardId_gameCellId_idx').on(
			table.playerBoardId,
			table.gameCellId,
		),
		uniqueIndex('player_board_cells_position_idx').on(
			table.playerBoardId,
			table.position,
		),
		foreignKey({
			name: 'player_board_cells_playerBoardId_fkey',
			columns: [table.playerBoardId],
			foreignColumns: [playerBoards.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'player_board_cells_gameCellId_fkey',
			columns: [table.gameCellId],
			foreignColumns: [gameCells.id],
		}).onDelete('cascade'),
	],
)
