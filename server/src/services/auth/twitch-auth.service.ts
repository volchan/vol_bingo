import env from '@server/config/env'
import type {
	AuthResult,
	TwitchApiResponse,
	TwitchTokenResponse,
	TwitchUserData
} from './auth.types'
import {
	buildAuthUrl,
	buildErrorRedirectUrl,
	buildSuccessRedirectUrl,
	stateManager
} from './auth.utils'

export class TwitchAuthService {
	private readonly config = {
		apiUrl: env.TWITCH_API_URL,
		oauthUrl: env.TWITCH_OAUTH_URL,
		clientId: env.TWITCH_ID,
		clientSecret: env.TWITCH_SECRET,
		redirectUri: env.TWITCH_REDIRECT_URI,
		scopes: env.TWITCH_OAUTH_SCOPES,
		frontendUrl: env.FRONTEND_URL
	}

	initiateAuth(): AuthResult {
		try {
			const state = stateManager.generateState()
			const authUrl = buildAuthUrl({
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scopes: this.config.scopes,
				state
			})

			return {
				success: true,
				redirectUrl: authUrl
			}
		} catch (error) {
			console.error('Failed to initiate auth:', error)
			return {
				success: false,
				error: 'Failed to initiate authentication',
				redirectUrl: buildErrorRedirectUrl(
					this.config.frontendUrl,
					'auth_init_failed'
				)
			}
		}
	}

	async handleCallback(code: string, state: string): Promise<AuthResult> {
		try {
			if (!stateManager.validateState(state)) {
				console.error('Invalid or missing state parameter')
				return {
					success: false,
					error: 'Invalid state parameter',
					redirectUrl: buildErrorRedirectUrl(
						this.config.frontendUrl,
						'invalid_state'
					)
				}
			}

			const tokenData = await this.exchangeCodeForToken(code)
			if (!tokenData) {
				return {
					success: false,
					error: 'Failed to exchange code for token',
					redirectUrl: buildErrorRedirectUrl(
						this.config.frontendUrl,
						'token_exchange_failed'
					)
				}
			}

			const userData = await this.getUserData(tokenData.access_token)
			if (!userData) {
				return {
					success: false,
					error: 'Failed to fetch user data',
					redirectUrl: buildErrorRedirectUrl(
						this.config.frontendUrl,
						'user_fetch_failed'
					)
				}
			}

			return {
				success: true,
				data: {
					user: userData,
					token: tokenData.access_token,
					refreshToken: tokenData.refresh_token
				},
				redirectUrl: buildSuccessRedirectUrl(
					this.config.frontendUrl,
					userData,
					tokenData.access_token,
					tokenData.refresh_token
				)
			}
		} catch (error) {
			console.error('OAuth callback error:', error)
			return {
				success: false,
				error: 'Authentication failed',
				redirectUrl: buildErrorRedirectUrl(
					this.config.frontendUrl,
					'auth_failed'
				)
			}
		}
	}

	async validateToken(token: string): Promise<TwitchUserData | null> {
		try {
			const response = await fetch(`${env.TWITCH_API_URL}/users`, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Client-Id': this.config.clientId
				}
			})

			if (!response.ok) {
				return null
			}

			const data = (await response.json()) as TwitchApiResponse
			return data.data[0] || null
		} catch (error) {
			console.error('Token validation error:', error)
			return null
		}
	}

	async refreshToken(
		refreshToken: string
	): Promise<TwitchTokenResponse | null> {
		try {
			const response = await fetch(`${this.config.oauthUrl}/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					client_id: this.config.clientId,
					client_secret: this.config.clientSecret,
					refresh_token: refreshToken,
					grant_type: 'refresh_token'
				})
			})

			if (!response.ok) {
				console.error('Token refresh failed:', await response.text())
				return null
			}

			return (await response.json()) as TwitchTokenResponse
		} catch (error) {
			console.error('Token refresh error:', error)
			return null
		}
	}

	async revokeToken(token: string): Promise<boolean> {
		try {
			const response = await fetch(
				`${this.config.oauthUrl}/revoke?client_id=${this.config.clientId}&token=${token}`,
				{ method: 'POST' }
			)
			return response.ok
		} catch (error) {
			console.error('Token revocation error:', error)
			return false
		}
	}

	private async exchangeCodeForToken(
		code: string
	): Promise<TwitchTokenResponse | null> {
		try {
			const response = await fetch(`${this.config.oauthUrl}/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					client_id: this.config.clientId,
					client_secret: this.config.clientSecret,
					code,
					grant_type: 'authorization_code',
					redirect_uri: this.config.redirectUri
				})
			})

			if (!response.ok) {
				console.error('Token exchange failed:', await response.text())
				return null
			}

			const tokenData = (await response.json()) as TwitchTokenResponse

			if (!tokenData.access_token) {
				console.error('No access token in response')
				return null
			}

			return tokenData
		} catch (error) {
			console.error('Token exchange error:', error)
			return null
		}
	}

	private async getUserData(
		accessToken: string
	): Promise<TwitchUserData | null> {
		try {
			const response = await fetch(`${this.config.apiUrl}/users`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Client-Id': this.config.clientId
				}
			})

			if (!response.ok) {
				console.error('User fetch failed:', await response.text())
				return null
			}

			const userData: TwitchApiResponse =
				(await response.json()) as TwitchApiResponse

			if (!userData.data || userData.data.length === 0) {
				console.error('No user data in response')
				return null
			}

			return userData.data[0] as TwitchUserData
		} catch (error) {
			console.error('User fetch error:', error)
			return null
		}
	}
}

export function createTwitchAuthService(): TwitchAuthService {
	return new TwitchAuthService()
}
