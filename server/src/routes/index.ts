import { Hono } from 'hono'

import authRoutes from './auth'
import cellsRoutes from './cells'
import gameCellsRoutes from './game-cells'
import gamesRoutes from './games'
import playerBoardsRoutes from './player-boards'
import templatesRoutes from './templates'
import usersRoutes from './users'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.route('/auth', authRoutes)
app.route('/cells', cellsRoutes)
app.route('/games', gamesRoutes)
app.route('/game_cells', gameCellsRoutes)
app.route('/player_boards', playerBoardsRoutes)
app.route('/templates', templatesRoutes)
app.route('/users', usersRoutes)

export type AppType = typeof app
export default app
