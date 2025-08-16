import type { Context, Next } from 'hono'
import { requestContextStorage } from '../config/request-context'

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
