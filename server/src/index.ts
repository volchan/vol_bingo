import { Hono } from 'hono'
import { websocket } from 'hono/bun'
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
import websocketRoutes from './routes/websocket'

export const app = new Hono()

app.use(
	cors({
		origin: [env.FRONTEND_URL],
		credentials: true,
	}),
)

app.use(requestId())
app.use(secureHeaders())

app.use('*', requestContextMiddleware)
app.use('*', loggerMiddleware)
app.onError(errorLoggerMiddleware)

await checkDatabaseConnection()

app.route('/auth', authRoutes)
app.route('/ws', websocketRoutes)
app.route('/api', router)

export default {
	port: env.APP_PORT,
	fetch: app.fetch,
	websocket,
}
