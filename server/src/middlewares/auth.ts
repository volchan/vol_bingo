import { createTwitchAuthService, TwitchAuthService } from '@server/services'
import { createMiddleware } from 'hono/factory'

const twitchAuth = createTwitchAuthService()

const auth = createMiddleware(async ({ json, req }, next) => {
	const token = req.header('Authorization')?.replace('Bearer ', '')
	if (!token) {
		return json({ error: 'Unauthorized' }, 401)
	}

	const user = await twitchAuth.validateToken(token)
	if (!user) {
		return json({ error: 'Unauthorized' }, 401)
	}

	await next()
})

export default auth
