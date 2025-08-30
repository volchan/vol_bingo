import db from '@server/config/database'
import { gameCells } from '@server/schemas/game-cells'
import { eq } from 'drizzle-orm'

const gameCellsRepository = {
	async getById(id: string, userId?: string) {
		const result = await db.query.gameCells.findFirst({
			where: eq(gameCells.id, id),
			with: {
				cell: true,
			},
		})

		// If userId is provided, check ownership
		if (userId && result && result.cell?.userId !== userId) {
			return null
		}

		return result || null
	},

	async create(gameId: string, cellId: string) {
		const [gameCell] = await db
			.insert(gameCells)
			.values({ gameId, cellId })
			.returning()
		if (!gameCell) throw new Error('Failed to create game cell')

		return gameCell
	},

	async getAllByGameId(gameId: string) {
		const results = await db.query.gameCells.findMany({
			where: eq(gameCells.gameId, gameId),
			with: {
				cell: true,
			},
		})

		if (!results) throw new Error('Failed to fetch game cells')

		return results
	},

	async delete(id: string) {
		await db.delete(gameCells).where(eq(gameCells.id, id))
	},

	async markCell(id: string, marked: boolean) {
		const [updatedGameCell] = await db
			.update(gameCells)
			.set({ marked, updatedAt: new Date() })
			.where(eq(gameCells.id, id))
			.returning()

		return updatedGameCell || null
	},
}

export default gameCellsRepository
