import db from '@server/config/database'
import type * as schema from '@server/schemas'
import { gameCells } from '@server/schemas/game-cells'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import type { NodePgTransaction } from 'drizzle-orm/node-postgres'

type DbTransaction = NodePgTransaction<
	typeof schema,
	ExtractTablesWithRelations<typeof schema>
>

export const gameCellRepository = {
	async getById(id: string, userId?: string) {
		const result = await db.query.gameCells.findFirst({
			where: eq(gameCells.id, id),
			with: {
				cell: {
					columns: {
						id: true,
						value: true,
						userId: true,
						createdAt: true,
						updatedAt: true,
					},
				},
			},
		})

		if (userId && result && result.cell && result.cell.userId !== userId) {
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

	async clearGameCells(gameId: string, tx?: DbTransaction) {
		const dbInstance = tx || db
		await dbInstance.delete(gameCells).where(eq(gameCells.gameId, gameId))
	},

	async linkMultipleCells(
		gameId: string,
		cellIds: string[],
		tx?: DbTransaction,
	) {
		if (cellIds.length === 0) return []

		const dbInstance = tx || db

		const values = cellIds.map((cellId) => ({
			gameId,
			cellId,
		}))

		const results = await dbInstance
			.insert(gameCells)
			.values(values)
			.returning()

		return results
	},

	async applyTemplate(
		gameId: string,
		cellIds: string[],
		_templateId: string | null,
		tx?: DbTransaction,
	) {
		const dbInstance = tx || db

		await dbInstance.delete(gameCells).where(eq(gameCells.gameId, gameId))

		if (cellIds.length > 0) {
			const values = cellIds.map((cellId) => ({
				gameId,
				cellId,
			}))

			const results = await dbInstance
				.insert(gameCells)
				.values(values)
				.returning()

			return results
		}

		return []
	},

	async getAllByGameId(gameId: string) {
		const results = await db.query.gameCells.findMany({
			where: eq(gameCells.gameId, gameId),
			with: {
				cell: {
					columns: {
						id: true,
						value: true,
						userId: true,
						createdAt: true,
						updatedAt: true,
					},
				},
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

export default gameCellRepository
