import type { Context, Next } from 'hono'
import { requestContextStorage } from '../config/request-context'

/**
 * Middleware that sets up the request context for use by Drizzle logger
 * This should be used before the regular logger middleware
 */
export const requestContextMiddleware = async (c: Context, next: Next) => {
	const requestId = c.get('requestId')
	const timestamp = new Date().toISOString()

	if (requestId) {
		await requestContextStorage.run({ requestId, timestamp }, async () => {
			await next()
		})
	} else {
		await next()
	}
}
