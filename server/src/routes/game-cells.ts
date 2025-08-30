import { jwtAuth } from '@server/middlewares/jwt-auth'
import gameCellRepository from '@server/repositories/game-cells'
import gamesRepository from '@server/repositories/games'
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from './utils'

const app = new Hono()

const CellLinkSchema = z.object({
	id: z.string(),
})

app.use('*', jwtAuth)

app.delete('/:id', zValidator('param', CellLinkSchema), async (c) => {
	const { id } = c.req.valid('param')
	const user = c.get('currentUser')

	try {
		const cell = await gameCellRepository.getById(id, user.id)
		if (!cell) {
			return c.json({ error: 'Cell not found' }, 404)
		}

		await gameCellRepository.delete(id)
		return c.json({ message: 'Cell unlinked successfully' }, 200)
	} catch (error) {
		console.error('Error unlinking cell:', error)
		return c.json({ error: 'Failed to unlink cell' }, 500)
	}
})

const MarkCellSchema = z.object({
	marked: z.boolean(),
})

app.patch(
	'/:id/mark',
	zValidator('param', CellLinkSchema),
	zValidator('json', MarkCellSchema),
	async (c) => {
		const { id } = c.req.valid('param')
		const { marked } = c.req.valid('json')
		const user = c.get('currentUser')

		try {
			const gameCell = await gameCellRepository.getById(id)
			if (!gameCell) {
				return c.json({ error: 'Game cell not found' }, 404)
			}

			// Get the game to check permissions and status
			const game = await gamesRepository.getById(gameCell.gameId)
			if (!game) {
				return c.json({ error: 'Game not found' }, 404)
			}

			if (game.status !== 'playing') {
				return c.json({ error: 'Can only mark cells during gameplay' }, 400)
			}

			if (game.creatorId !== user.id) {
				return c.json({ error: 'Only the game creator can mark cells' }, 403)
			}

			const updatedGameCell = await gameCellRepository.markCell(id, marked)
			if (!updatedGameCell) {
				return c.json({ error: 'Failed to mark cell' }, 500)
			}

			return c.json(updatedGameCell, 200)
		} catch (error) {
			console.error('Error marking cell:', error)
			return c.json({ error: 'Failed to mark cell' }, 500)
		}
	},
)

export default app
