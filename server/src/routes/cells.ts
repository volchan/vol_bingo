import { jwtAuth } from '@server/middlewares/jwt-auth'
import cellsRepository from '@server/repositories/cells'
import gameCellRepository from '@server/repositories/game-cells'
import { wsManager } from '@server/websocket/websocket-manager'
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from './utils'

const app = new Hono()

app.use('*', jwtAuth)

app.get('/', async (c) => {
	const user = c.get('currentUser')
	if (!user) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	const cells = await cellsRepository.getAll(user.id)
	if (!cells) {
		return c.json({ error: 'Failed to fetch cells' }, 500)
	}

	return c.json(cells, 200)
})

const SearchCellsSchema = z.object({
	q: z.string().min(1, 'Search query is required'),
})
app.get('/search', zValidator('query', SearchCellsSchema), async (c) => {
	const user = c.get('currentUser')
	const { q } = c.req.valid('query')

	if (!user) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	try {
		const cells = await cellsRepository.search(q, user.id)
		return c.json(cells, 200)
	} catch (error) {
		console.error('Search cells error:', error)
		return c.json({ error: 'Failed to search cells' }, 500)
	}
})

const CreateCellSchema = z.object({
	value: z.string().min(1, 'Cell value is required'),
	gameId: z.string().optional(),
})
app.post('/', zValidator('form', CreateCellSchema), async (c) => {
	const user = c.get('currentUser')
	const { value } = c.req.valid('form')

	try {
		const cell = await cellsRepository.create({
			value,
			userId: user.id,
		})
		return c.json(cell, 201)
	} catch (error) {
		console.error('Create cell error:', error)
		return c.json({ error: 'Failed to create cell' }, 500)
	}
})

const CellLinkSchema = z.object({
	id: z.string(),
})

const GameLinkSchema = z.object({
	gameId: z.string(),
})
app.post(
	'/:id/link_to_game',
	zValidator('param', CellLinkSchema),
	zValidator('form', GameLinkSchema),
	async (c) => {
		const { id } = c.req.valid('param')
		const { gameId } = c.req.valid('form')

		try {
			const gameCell = await gameCellRepository.create(gameId, id)
			if (!gameCell) {
				return c.json({ error: 'Failed to link cell to game' }, 500)
			}

			const cell = await cellsRepository.getById(id, c.get('currentUser').id)
			const gameCells = await gameCellRepository.getAllByGameId(gameId)

			wsManager.broadcastToGame(gameId, {
				type: 'game_cell_added',
				data: {
					gameId,
					cellValue: cell?.value || '',
					linkedCellsCount: gameCells.length,
				},
			})

			return c.json(204)
		} catch (error) {
			console.error('Link cell to game error:', error)
			return c.json({ error: 'Failed to link cell to game' }, 500)
		}
	},
)

const CellUpdateSchema = z.object({
	value: z.string().min(1, 'Cell value is required'),
})
app.patch(
	'/:id',
	zValidator('param', CellLinkSchema),
	zValidator('form', CellUpdateSchema),
	async (c) => {
		const { id } = c.req.valid('param')
		const { value } = c.req.valid('form')
		const user = c.get('currentUser')

		try {
			const cell = await cellsRepository.getById(id, user.id)
			if (!cell) {
				return c.json({ error: 'Cell not found' }, 404)
			}
			const updatedCell = await cellsRepository.update(id, { value })
			return c.json(updatedCell, 200)
		} catch (error) {
			console.error('Update cell error:', error)
			return c.json({ error: 'Failed to update cell' }, 500)
		}
	},
)

app.delete('/:id', zValidator('param', CellLinkSchema), async (c) => {
	const { id } = c.req.valid('param')
	const user = c.get('currentUser')

	try {
		const cell = await cellsRepository.getById(id, user.id)
		if (!cell) {
			return c.json({ error: 'Cell not found' }, 404)
		}

		await cellsRepository.delete(id)
		return c.json(204)
	} catch (error) {
		console.error('Error deleting cell:', error)
		return c.json({ error: 'Failed to delete cell' }, 500)
	}
})

export default app
