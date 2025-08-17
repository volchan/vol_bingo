import db from '@server/config/database'
import { cells } from '@server/schemas'
import { gameCells } from '@server/schemas/game-cells'
import { and, eq } from 'drizzle-orm'

export default {
	async getById(id: string, userId: string) {
		return await db
			.select()
			.from(gameCells)
			.leftJoin(cells, eq(gameCells.cellId, cells.id))
			.where(and(eq(gameCells.id, id), eq(cells.userId, userId)))
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
}
