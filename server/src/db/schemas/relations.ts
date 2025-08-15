import { relations } from 'drizzle-orm'
import { games } from './games'
import { refreshTokens } from './refresh-tokens'
import { users } from './users'

export const userRelations = relations(users, ({ many }) => ({
	createdGames: many(games, { relationName: 'creator' }),
}))

export const gameRelations = relations(games, ({ one }) => ({
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
