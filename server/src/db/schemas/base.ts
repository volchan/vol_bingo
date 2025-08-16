import { timestamp, uuid } from 'drizzle-orm/pg-core'

export const baseFields = {
	id: uuid().primaryKey().defaultRandom(),
	createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true }),
}

export default baseFields
