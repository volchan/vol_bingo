import {
  boolean,
  foreignKey,
  pgEnum,
  pgTable,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import baseFields from './base'
import { templates } from './templates'
import { users } from './users'

export const statusEnum = pgEnum('game_status', [
  'draft',
  'ready',
  'playing',
  'completed',
])

export const games = pgTable(
  'games',
  {
    ...baseFields,
    title: varchar().notNull(),
    creatorId: uuid()
      .references(() => users.id)
      .notNull(),
    friendlyId: varchar().notNull().unique(),
    winnerId: uuid().references(() => users.id),
    status: statusEnum().default('draft').notNull(),
    currentTemplateId: uuid().references(() => templates.id),
    displayOnStream: boolean().default(false).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'games_creator_id_fkey',
      columns: [table.creatorId],
      foreignColumns: [users.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'games_current_template_id_fkey',
      columns: [table.currentTemplateId],
      foreignColumns: [templates.id],
    }).onDelete('set null'),
  ],
)
