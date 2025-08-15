import { Hono } from 'hono'

import authRoutes from './auth'
import gamesRoutes from './games'

const app = new Hono()

app.get('/health', (c) => {
	return c.json({ status: 'ok' })
})

// Add a test endpoint for debugging
app.get('/test-token', async (c) => {
	try {
		const { authService } = await import('../services/auth/auth.service')
		const tokenPair = await authService.createTokenPair({
			userId: '1',
			twitchAccessToken: 'test_twitch_token',
			twitchRefreshToken: 'test_twitch_refresh',
			twitchExpiresAt: new Date(Date.now() + 3600000), // 1 hour
		})

		return c.json({
			access_token: tokenPair.accessToken,
			refresh_token: tokenPair.refreshToken,
			expires_in: tokenPair.expiresIn,
		})
	} catch (error) {
		return c.json(
			{ error: 'Failed to create test token', details: String(error) },
			500,
		)
	}
})

app.route('/auth', authRoutes)
app.route('/games', gamesRoutes)

export type AppType = typeof app
export default app
