import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { ApiResponse } from 'shared/dist'
import env from './config/env'
import { auth } from './routes'

export const app = new Hono()

app.use(
	cors({
		origin: ['http://localhost:5173'], // Vite dev server
		credentials: true
	})
)

app.use(logger())

app.get('/', (c) => {
	return c.text('Hello Hono!')
})

app.get('/hello', async (c) => {
	const data: ApiResponse = {
		message: 'Hello World!',
		success: true
	}

	return c.json(data, { status: 200 })
})

app.route('/auth', auth)

export default {
	port: env.APP_PORT,
	fetch: app.fetch
}
