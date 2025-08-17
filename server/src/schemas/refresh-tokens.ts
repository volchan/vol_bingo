import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import baseFields from './base'
import { users } from './users'

export const refreshTokens = pgTable('refresh_tokens', {
	...baseFields,
	token: varchar().notNull().unique(),
	userId: uuid()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp({ withTimezone: true }).notNull(),
	twitchAccessToken: varchar().notNull(),
	twitchRefreshToken: varchar().notNull(),
	twitchExpiresAt: timestamp({ withTimezone: true }).notNull(),
})
