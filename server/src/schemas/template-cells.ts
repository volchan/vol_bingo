import { foreignKey, integer, pgTable, uuid } from 'drizzle-orm/pg-core'
import baseFields from './base'
import { cells } from './cells'
import { templates } from './templates'

export const templateCells = pgTable(
	'template_cells',
	{
		...baseFields,
		templateId: uuid()
			.notNull()
			.references(() => templates.id, {
				onDelete: 'cascade',
			}),
		cellId: uuid()
			.notNull()
			.references(() => cells.id, {
				onDelete: 'cascade',
			}),
		position: integer().notNull(),
	},
	(table) => [
		foreignKey({
			name: 'template_cells_templateId_fkey',
			columns: [table.templateId],
			foreignColumns: [templates.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'template_cells_cellId_fkey',
			columns: [table.cellId],
			foreignColumns: [cells.id],
		}).onDelete('cascade'),
	],
)
