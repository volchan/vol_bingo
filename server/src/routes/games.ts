import { jwtAuth } from '@server/middlewares/jwt-auth'
import gamesRepository, {
	type CreateGameData,
} from '@server/repositories/games'
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

	return c.json({ games }, 200)
})

const CreateGameSchema = z.object({
	title: z.string().min(10),
})

app.post('/', zValidator('form', CreateGameSchema), async (c) => {
	const data = c.req.valid('form') as CreateGameData
	const user = c.get('currentUser')

	data.creatorId = user.id

	const newGame = await gamesRepository.create(data)

	if (!newGame) {
		return c.json({ error: 'Failed to create game' }, 500)
	}

	return c.json({ game: newGame }, 201)
})

export default app
