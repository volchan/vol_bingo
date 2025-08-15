import { Hono } from 'hono'

import authRoutes from './auth'
import gamesRoutes from './games'

const app = new Hono()

app.get('/health', (c) => {
	return c.json({ status: 'ok' })
})

app.route('/auth', authRoutes)
app.route('/games', gamesRoutes)

export type AppType = typeof app
export default app
