import { relations } from 'drizzle-orm'
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import baseFields from './base'
import { users } from './users'

export const refreshTokens = pgTable('refresh_tokens', {
	...baseFields,
	token: varchar().notNull().unique(), // Our own refresh token
	userId: uuid()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp().notNull(),
	twitchAccessToken: varchar().notNull(), // Store Twitch tokens here
	twitchRefreshToken: varchar().notNull(),
	twitchExpiresAt: timestamp().notNull(),
})

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id],
	}),
}))
