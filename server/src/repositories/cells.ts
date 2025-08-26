import db from '@server/config/database'
import { cells } from '@server/schemas'
import { eq } from 'drizzle-orm'
import type { Cell } from 'shared/dist'

const cellsRepository = {
	async getAll(userId: string) {
		const cells = await db.query.cells.findMany({
			where: (table, { eq }) => eq(table.userId, userId),
			orderBy: (table, { desc }) => desc(table.createdAt),
		})

		if (!cells) throw new Error('Failed to fetch cells')

		return cells
	},

	async search(query: string, userId: string) {
		const searchResults = await db.query.cells.findMany({
			where: (table, { eq, and, ilike }) =>
				and(eq(table.userId, userId), ilike(table.value, `%${query}%`)),
			orderBy: (table, { desc }) => desc(table.createdAt),
			limit: 10,
		})

		if (!searchResults) throw new Error('Failed to search cells')

		return searchResults
	},

	async getById(id: string, userId?: string) {
		const cell = await db.query.cells.findFirst({
			where: (table, { eq, and }) => {
				const conditions = [eq(table.id, id)]
				if (userId) {
					conditions.push(eq(table.userId, userId))
				}
				return conditions.length > 1 ? and(...conditions) : conditions[0]
			},
		})

		if (!cell) return null

		return cell
	},

	async create(data: { value: string; userId: string; gameId?: string }) {
		const [cell] = await db.insert(cells).values(data).returning()
		if (!cell) throw new Error('Failed to create cell')

		return cell
	},

	async update(id: string, data: Pick<Cell, 'value'>) {
		const [cell] = await db
			.update(cells)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(cells.id, id))
			.returning()
		if (!cell) throw new Error('Failed to update cell')

		return cell
	},

	async delete(id: string) {
		await db.delete(cells).where(eq(cells.id, id))
	},
}

export default cellsRepository
