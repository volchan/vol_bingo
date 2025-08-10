import { timestamp, uuid } from 'drizzle-orm/pg-core'

export default {
	id: uuid().primaryKey().defaultRandom(),
	createdAt: timestamp().defaultNow().notNull(),
	updatedAt: timestamp()
}
