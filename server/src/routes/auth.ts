import { jwtAuth, jwtAuthWithTwitchSync } from '@server/middlewares/jwt-auth'
import { Hono } from 'hono'
import { authService } from '../services/auth/auth.service'
import { createTwitchAuthService } from '../services/auth/twitch-auth.service'

const app = new Hono()
const twitchAuth = createTwitchAuthService()

// Initiate OAuth flow or handle callback
app.get('/twitch', async (c) => {
	const code = c.req.query('code')
	const state = c.req.query('state')
	const error = c.req.query('error')

	if (error) {
		console.error('OAuth error:', error)
		return c.redirect('http://localhost:5173/?error=oauth_error')
	}

	if (!code || !state) {
		const result = twitchAuth.initiateAuth()
		if (result.success && result.redirectUrl) {
			return c.redirect(result.redirectUrl)
		}
		return c.redirect('http://localhost:5173/?error=auth_init_failed')
	}

	const result = await twitchAuth.handleCallback(code, state)

	if (result.redirectUrl) {
		return c.redirect(result.redirectUrl)
	}

	return c.json({ error: result.error }, 400)
})

app.get('/me', jwtAuthWithTwitchSync, async (c) => {
	const user = c.get('currentUser')
	return c.json({ user })
})

// Refresh auth tokens
app.post('/refresh', jwtAuth, async (c) => {
	try {
		const refreshToken = c.get('refreshToken')
		const tokenPair = await authService.refreshTokenPair(refreshToken)

		if (!tokenPair) {
			return c.json({ error: 'Failed to refresh tokens' }, 401)
		}

		return c.json({
			accessToken: tokenPair.accessToken,
			refreshToken: tokenPair.refreshToken,
		})
	} catch (error) {
		console.error('Refresh error:', error)
		return c.json({ error: 'Failed to refresh tokens' }, 500)
	}
})

// Logout and revoke tokens
app.post('/logout', jwtAuth, async (c) => {
	try {
		const refreshToken = c.get('refreshToken')

		if (refreshToken) {
			const twitchTokens = await authService.getTwitchTokens(refreshToken)

			await authService.revokeRefreshToken(refreshToken)

			if (twitchTokens?.accessToken) {
				await twitchAuth.revokeToken(twitchTokens.accessToken)
			}
		}

		return c.json({ message: 'Logged out successfully' })
	} catch (error) {
		console.error('Logout error:', error)
		return c.json({ error: 'Failed to logout' }, 500)
	}
})

export default app
