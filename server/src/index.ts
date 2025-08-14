import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { checkDatabaseConnection } from './config/database'
import env from './config/env'
import { errorLoggerMiddleware, loggerMiddleware } from './middlewares'
import router from './routes'

export const app = new Hono()

app.use(
	cors({
		origin: ['http://localhost:5173'], // Vite dev server
		credentials: true,
	}),
)

app.use(requestId())
app.use(secureHeaders())

app.use('*', loggerMiddleware)
app.onError(errorLoggerMiddleware)

await checkDatabaseConnection()

app.route('/', router)

export default {
	port: env.APP_PORT,
	fetch: app.fetch,
}
