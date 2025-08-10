import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

import baseFields from './base'

export default pgTable('users', {
	...baseFields,
	login: varchar().notNull().unique(),
	displayName: varchar().notNull(),
	type: varchar().notNull(),
	broadcasterType: varchar().notNull(),
	description: varchar().notNull(),
	profileImageUrl: varchar().notNull(),
	offlineImageUrl: varchar().notNull(),
	viewCount: varchar().notNull(),
	twitchId: varchar().notNull().unique(),
	twitchCreatedAt: timestamp().notNull()
})
