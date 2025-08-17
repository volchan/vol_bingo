import { Hono } from 'hono'

import authRoutes from './auth'
import cellsRoutes from './cells'
import gameCellsRoutes from './game-cells'
import gamesRoutes from './games'

const app = new Hono()

app.get('/health', (c) => {
	return c.json({ status: 'ok' })
})

app.route('/auth', authRoutes)
app.route('/cells', cellsRoutes)
app.route('/games', gamesRoutes)
app.route('/game_cells', gameCellsRoutes)

export type AppType = typeof app
export default app
