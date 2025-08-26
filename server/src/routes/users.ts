import { jwtAuth } from '@server/middlewares'
import usersRepository from '@server/repositories/users'
import { Hono } from 'hono'

const app = new Hono()

app.use('*', jwtAuth)

app.get('/games/played', async (c) => {
	const currentUser = c.get('currentUser')
	const playedGames = await usersRepository.getPlayedGames(currentUser.id)

	return c.json(playedGames, 200)
})

export default app
