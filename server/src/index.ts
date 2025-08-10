import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { ApiResponse } from 'shared/dist'
import { checkDatabaseConnection } from './config/database'
import env from './config/env'
import router from './routes'

export const app = new Hono()

app.use(
	cors({
		origin: ['http://localhost:5173'], // Vite dev server
		credentials: true
	})
)

app.use(logger())

await checkDatabaseConnection()

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

app.route('/', router)

export default {
	port: env.APP_PORT,
	fetch: app.fetch
}
