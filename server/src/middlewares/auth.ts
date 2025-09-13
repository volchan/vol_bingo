import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import env from '../config/env'
import userRepository from '../repositories/users'
import { authService } from '../services/auth/auth.service'

interface AuthOptions {
  requireTwitchSync?: boolean
  allowRefresh?: boolean
}

export const createAuthMiddleware = (options: AuthOptions = {}) => {
  return createMiddleware(async (c, next) => {
    const { requireTwitchSync = false, allowRefresh = false } = options

    try {
      const token = c.req.header('Authorization')?.replace('Bearer ', '')
      if (!token) {
        return c.json({ error: 'No token provided' }, 401)
      }

      let payload: { userId?: string; refreshToken?: string } | unknown

      if (allowRefresh) {
        payload = await verify(token, env.JWT_SECRET, {}).catch(async () => {
          const parts = token.split('.')
          if (parts.length !== 3) {
            throw new Error('Invalid token format')
          }
          return JSON.parse(atob(parts[1]!))
        })
      } else {
        payload = await verify(token, env.JWT_SECRET)
      }

      if (
        !payload ||
        typeof payload !== 'object' ||
        !('userId' in payload) ||
        typeof payload.userId !== 'string'
      ) {
        return c.json({ error: 'Invalid token payload' }, 401)
      }

      const user = await userRepository.findById(payload.userId)
      if (!user) {
        return c.json({ error: 'User not found' }, 401)
      }

      c.set('currentUser', user)

      if (
        'refreshToken' in payload &&
        typeof payload.refreshToken === 'string'
      ) {
        c.set('refreshToken', payload.refreshToken)
      }

      if (
        requireTwitchSync &&
        'refreshToken' in payload &&
        typeof payload.refreshToken === 'string'
      ) {
        const twitchTokens = await authService.getTwitchTokens(
          payload.refreshToken,
        )
        if (!twitchTokens) {
          return c.json({ error: 'No valid Twitch tokens' }, 401)
        }
      }

      await next()
    } catch (error) {
      console.error('Authentication failed:', error)
      return c.json({ error: 'Invalid or expired token' }, 401)
    }
  })
}

export const authMiddleware = createAuthMiddleware()
export const authWithTwitchSync = createAuthMiddleware({
  requireTwitchSync: true,
})
export const refreshAuthMiddleware = createAuthMiddleware({
  allowRefresh: true,
})
