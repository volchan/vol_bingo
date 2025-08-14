import { relations } from 'drizzle-orm'
import { games } from './game'
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
