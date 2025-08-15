import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { checkDatabaseConnection } from './config/database'
import env from './config/env'
import {
	errorLoggerMiddleware,
	loggerMiddleware,
	requestContextMiddleware,
} from './middlewares'
import router from './routes'
import authRoutes from './routes/auth'

export const app = new Hono()

app.use(
	cors({
		origin: ['http://localhost:5173'], // Vite dev server
		credentials: true,
	}),
)

app.use(requestId())
app.use(secureHeaders())

app.use('*', requestContextMiddleware)
app.use('*', loggerMiddleware)
app.onError(errorLoggerMiddleware)

await checkDatabaseConnection()

// Mount OAuth callback at root level (required by Twitch OAuth)
app.route('/auth', authRoutes)

// Mount API routes under /api
app.route('/api', router)

export default {
	port: env.APP_PORT,
	fetch: app.fetch,
}
