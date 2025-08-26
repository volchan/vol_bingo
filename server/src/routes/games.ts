import db from '@server/config/database'
import { jwtAuth } from '@server/middlewares/jwt-auth'
import gameCellRepository from '@server/repositories/game-cells'
import gamesRepository, {
	type CreateGameData,
} from '@server/repositories/games'
import playerBoardsRepository from '@server/repositories/player-boards'
import type { Game } from '@shared/types'
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from './utils'

const app = new Hono()

app.use('*', jwtAuth)

app.get('/', async (c) => {
	const games = await gamesRepository.getAll(c.get('currentUser').id)
	if (!games) {
		return c.json({ error: 'Failed to fetch games' }, 500)
	}

	return c.json(games, 200)
})

const GameDetailSchema = z.object({
	friendlyId: z.string(),
})

app.get('/:friendlyId', zValidator('param', GameDetailSchema), async (c) => {
	const { friendlyId } = c.req.valid('param')
	const game = await gamesRepository.getByFriendlyId(friendlyId)

	if (!game) {
		return c.json({ error: 'Game not found' }, 404)
	}

	return c.json(game, 200)
})

app.get(
	'/:friendlyId/cells',
	zValidator('param', GameDetailSchema),
	async (c) => {
		const { friendlyId } = c.req.valid('param')
		const user = c.get('currentUser')
		const game = await gamesRepository.getByFriendlyId(friendlyId, user.id)

		if (!game) {
			return c.json({ error: 'Game not found' }, 404)
		}

		if (game.status !== 'active') {
			return c.json({ error: 'Game is not active' }, 400)
		}

		const cells = await gameCellRepository.getAllByGameId(game.id)

		return c.json(cells, 200)
	},
)

app.patch(
	'/:friendlyId/start',
	zValidator('param', GameDetailSchema),
	async (c) => {
		const { friendlyId } = c.req.valid('param')
		const user = c.get('currentUser')
		const game = await gamesRepository.getByFriendlyId(friendlyId, user.id)

		if (!game) {
			return c.json({ error: 'Game not found' }, 404)
		}

		if (game.status !== 'draft') {
			return c.json({ error: 'Game cannot be started' }, 400)
		}

		// Check if the game has exactly 25 cells linked (for 5x5 bingo grid)
		const gameCells = await gameCellRepository.getAllByGameId(game.id)
		if (gameCells.length !== 25) {
			return c.json(
				{
					error: `Game needs exactly 25 cells to start. Currently has ${gameCells.length} cells.`,
				},
				400,
			)
		}

		const updatedGame = await gamesRepository.update({
			...game,
			status: 'active',
		})

		if (!updatedGame) {
			return c.json({ error: 'Failed to start game' }, 500)
		}

		return c.json(updatedGame, 200)
	},
)

const CreateGameSchema = z.object({
	title: z.string().min(10),
})

app.post('/', zValidator('form', CreateGameSchema), async (c) => {
	const data = c.req.valid('form') as CreateGameData
	const user = c.get('currentUser')

	data.creatorId = user.id

	let newGame: Game | null = null
	await db.transaction(async (tx) => {
		newGame = await gamesRepository.create(data, tx)
		await playerBoardsRepository.create(
			{ playerId: user.id, gameId: newGame.id },
			tx,
		)
	})

	if (!newGame) {
		return c.json({ error: 'Failed to create game' }, 500)
	}

	return c.json(newGame, 201)
})

export default app
