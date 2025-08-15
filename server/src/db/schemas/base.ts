import { timestamp, uuid } from 'drizzle-orm/pg-core'

export const baseFields = {
	id: uuid().primaryKey().defaultRandom(),
	createdAt: timestamp().defaultNow().notNull(),
	updatedAt: timestamp(),
}

// For backward compatibility
export default baseFields
