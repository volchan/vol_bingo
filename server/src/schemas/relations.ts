import { relations } from 'drizzle-orm'
import { cells } from './cells'
import { gameCells } from './game-cells'
import { games } from './games'
import { playerBoardCells } from './player-board-cells'
import { playerBoards } from './player-boards'
import { refreshTokens } from './refresh-tokens'
import { templateCells } from './template-cells'
import { templates } from './templates'
import { users } from './users'

export const cellRelations = relations(cells, ({ many, one }) => ({
  gameCells: many(gameCells),
  templateCells: many(templateCells),
  user: one(users, {
    fields: [cells.userId],
    references: [users.id],
  }),
}))

export const gameCellRelations = relations(gameCells, ({ many, one }) => ({
  cell: one(cells, {
    fields: [gameCells.cellId],
    references: [cells.id],
  }),
  game: one(games, {
    fields: [gameCells.gameId],
    references: [games.id],
  }),
  playerBoardCells: many(playerBoardCells),
}))

export const gameRelations = relations(games, ({ many, one }) => ({
  creator: one(users, {
    fields: [games.creatorId],
    references: [users.id],
    relationName: 'creator',
  }),
  gameCells: many(gameCells),
  playerBoards: many(playerBoards),
}))

export const playerBoardCellRelations = relations(
  playerBoardCells,
  ({ one }) => ({
    gameCell: one(gameCells, {
      fields: [playerBoardCells.gameCellId],
      references: [gameCells.id],
    }),
    playerBoard: one(playerBoards, {
      fields: [playerBoardCells.playerBoardId],
      references: [playerBoards.id],
    }),
  }),
)

export const playerBoardRelations = relations(
  playerBoards,
  ({ many, one }) => ({
    game: one(games, {
      fields: [playerBoards.gameId],
      references: [games.id],
    }),
    player: one(users, {
      fields: [playerBoards.playerId],
      references: [users.id],
      relationName: 'player',
    }),
    playerBoardCells: many(playerBoardCells),
  }),
)

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}))

export const userRelations = relations(users, ({ many }) => ({
  cells: many(cells),
  createdGames: many(games, { relationName: 'creator' }),
  playerBoards: many(playerBoards, { relationName: 'player' }),
  templates: many(templates),
}))

export const templateRelations = relations(templates, ({ many, one }) => ({
  creator: one(users, {
    fields: [templates.creatorId],
    references: [users.id],
  }),
  templateCells: many(templateCells),
}))

export const templateCellRelations = relations(templateCells, ({ one }) => ({
  template: one(templates, {
    fields: [templateCells.templateId],
    references: [templates.id],
  }),
  cell: one(cells, {
    fields: [templateCells.cellId],
    references: [cells.id],
  }),
}))
