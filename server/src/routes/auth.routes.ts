import userRepository from '@server/repositories/user'
import type { User } from '@shared/types'
import { Hono } from 'hono'
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

// Get current user (protected route)
router.get('/me', async (c) => {
	const authHeader = c.req.header('Authorization')

	if (!authHeader?.startsWith('Bearer ')) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	const token = authHeader.substring(7)
	const userData = await twitchAuth.validateToken(token)

	if (!userData) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	const user = await userRepository.findByTwitchId(userData.id)
	if (!user) {
		return c.json({ error: 'User not found' }, 404)
	}

	return c.json(user)
})

// Refresh token
router.post('/refresh', async (c) => {
	const body = await c.req.json().catch(() => ({}))
	const refreshToken = body.refresh_token

	if (!refreshToken) {
		return c.json({ error: 'Refresh token required' }, 400)
	}

	const tokenData = await twitchAuth.refreshToken(refreshToken)

	if (!tokenData) {
		return c.json({ error: 'Failed to refresh token' }, 400)
	}

	return c.json({
		access_token: tokenData.access_token,
		refresh_token: tokenData.refresh_token,
		expires_in: tokenData.expires_in
	})
})

// Logout
router.post('/logout', async (c) => {
	const authHeader = c.req.header('Authorization')

	if (authHeader?.startsWith('Bearer ')) {
		const token = authHeader.substring(7)
		await twitchAuth.revokeToken(token)
	}

	return c.json({ message: 'Logged out successfully' })
})

export default router
