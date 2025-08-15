import { jwtAuth, jwtAuthWithTwitchSync } from '@server/middlewares/jwtAuth'
import { Hono } from 'hono'
import { authService } from '../services/auth/auth.service'
import { createTwitchAuthService } from '../services/auth/twitch-auth.service'

const router = new Hono()
const twitchAuth = createTwitchAuthService()

// Initiate OAuth flow or handle callback
router.get('/twitch', async (c) => {
	const code = c.req.query('code')
	const state = c.req.query('state')
	const error = c.req.query('error')

	// Handle OAuth errors
	if (error) {
		console.error('OAuth error:', error)
		return c.redirect('http://localhost:5173/?error=oauth_error')
	}

	if (!code || !state) {
		// Initiate OAuth flow
		const result = twitchAuth.initiateAuth()
		if (result.success && result.redirectUrl) {
			return c.redirect(result.redirectUrl)
		}
		return c.redirect('http://localhost:5173/?error=auth_init_failed')
	}

	// Handle callback
	const result = await twitchAuth.handleCallback(code, state)

	if (result.redirectUrl) {
		return c.redirect(result.redirectUrl)
	}

	return c.json({ error: result.error }, 400)
})

// Get current user (protected route) - uses Twitch sync for fresh data
router.get('/me', jwtAuthWithTwitchSync, async (c) => {
	// User is already set by the auth middleware
	const user = c.get('user')
	return c.json(user)
})

// Refresh token - uses our custom refresh token system
router.post('/refresh', jwtAuth, async (c) => {
	const refreshToken = c.get('refreshToken')

	if (!refreshToken) {
		return c.json({ error: 'No refresh token available' }, 400)
	}

	const newTokenPair = await authService.refreshTokenPair(refreshToken)

	if (!newTokenPair) {
		return c.json({ error: 'Failed to refresh token' }, 400)
	}

	return c.json({
		access_token: newTokenPair.accessToken,
		refresh_token: newTokenPair.refreshToken,
		expires_in: newTokenPair.expiresIn,
	})
})

// Logout - revoke our custom refresh token and optionally Twitch tokens
router.post('/logout', jwtAuth, async (c) => {
	const refreshToken = c.get('refreshToken')

	if (refreshToken) {
		// Get Twitch tokens before revoking our refresh token
		const twitchTokens = await authService.getTwitchTokens(refreshToken)

		// Revoke our custom refresh token
		await authService.revokeRefreshToken(refreshToken)

		// Optionally revoke Twitch token
		if (twitchTokens?.accessToken) {
			await twitchAuth.revokeToken(twitchTokens.accessToken)
		}
	}

	return c.json({ message: 'Logged out successfully' })
})

export default router
