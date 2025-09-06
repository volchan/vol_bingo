import { foreignKey, pgTable, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import baseFields from './base'
import { users } from './users'

export const templates = pgTable(
  'templates',
  {
    ...baseFields,
    name: varchar().notNull(),
    description: varchar(),
    creatorId: uuid()
      .references(() => users.id)
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: 'templates_creator_id_fkey',
      columns: [table.creatorId],
      foreignColumns: [users.id],
    }).onDelete('cascade'),
    unique('templates_name_creator_unique').on(table.name, table.creatorId),
  ],
)
