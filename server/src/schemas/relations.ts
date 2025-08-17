import { relations } from 'drizzle-orm'
import { cells } from './cells'
import { gameCells } from './game-cells'
import { games } from './games'
import { refreshTokens } from './refresh-tokens'
import { users } from './users'

export const cellRelations = relations(cells, ({ many, one }) => ({
	gameCells: many(gameCells),
	user: one(users, {
		fields: [cells.userId],
		references: [users.id],
	}),
}))

export const gameCellRelations = relations(gameCells, ({ one }) => ({
	game: one(games, {
		fields: [gameCells.gameId],
		references: [games.id],
	}),
	cell: one(cells, {
		fields: [gameCells.cellId],
		references: [cells.id],
	}),
}))

export const gameRelations = relations(games, ({ many, one }) => ({
	gameCells: many(gameCells),
	creator: one(users, {
		fields: [games.creatorId],
		references: [users.id],
		relationName: 'creator',
	}),
}))

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id],
	}),
}))

export const userRelations = relations(users, ({ many }) => ({
	createdGames: many(games, { relationName: 'creator' }),
	cells: many(cells),
}))
