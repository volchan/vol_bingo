import {
  boolean,
  foreignKey,
  pgTable,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
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
    marked: boolean().default(false).notNull(),
  },
  (table) => [
    uniqueIndex('game_cells_gameId_cellId_idx').on(table.gameId, table.cellId),
    foreignKey({
      name: 'game_cells_gameId_fkey',
      columns: [table.gameId],
      foreignColumns: [games.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'game_cells_cellId_fkey',
      columns: [table.cellId],
      foreignColumns: [cells.id],
    }).onDelete('cascade'),
  ],
)
