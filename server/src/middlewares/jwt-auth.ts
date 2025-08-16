import { createMiddleware } from 'hono/factory'
import { jwt, verify } from 'hono/jwt'
import env from '../config/env'
import userRepository from '../repositories/users'
import { authService } from '../services/auth/auth.service'

export const jwtAuth = createMiddleware(async (c, next) => {
	const jwtMiddleware = jwt({
		secret: env.JWT_SECRET,
	})

	try {
		await jwtMiddleware(c, async () => {
			const payload = c.get('jwtPayload')

			if (!payload?.userId || !payload?.refreshToken) {
				throw new Error('Invalid token payload')
			}

			const user = await userRepository.findById(payload.userId)
			if (!user) {
				throw new Error('User not found')
			}

			c.set('currentUser', user)
			c.set('refreshToken', payload.refreshToken)

			await next()
		})
	} catch (error) {
		console.error('JWT authentication failed:', error)
		return c.json({ error: 'Invalid or expired token' }, 401)
	}
})

export const jwtAuthWithTwitchSync = createMiddleware(async (c, next) => {
	try {
		const token = c.req.header('Authorization')?.replace('Bearer ', '')
		if (!token) {
			return c.json({ error: 'No token provided' }, 401)
		}

		const payload = await verify(token, env.JWT_SECRET)
		if (!payload?.userId || !payload?.refreshToken) {
			return c.json({ error: 'Invalid token payload' }, 401)
		}

		const user = await userRepository.findById(payload.userId as string)
		if (!user) {
			return c.json({ error: 'User not found' }, 401)
		}

		c.set('currentUser', user)
		c.set('refreshToken', payload.refreshToken as string)

		const twitchTokens = await authService.getTwitchTokens(
			payload.refreshToken as string,
		)
		if (!twitchTokens) {
			return c.json({ error: 'No valid Twitch tokens' }, 401)
		}

		await next()
	} catch (error) {
		console.error('JWT auth with Twitch sync failed:', error)
		return c.json({ error: 'Invalid or expired token' }, 401)
	}
})
