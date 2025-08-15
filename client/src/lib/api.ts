import type { QueryClient } from '@tanstack/react-query'
import type { AuthTokens, User } from 'shared'
import { isJwtExpired } from './jwt'

const API_BASE = import.meta.env.VITE_API_URL

class ApiClient {
	private queryClient: QueryClient | null = null

	setQueryClient(queryClient: QueryClient) {
		this.queryClient = queryClient
	}

	private async getAuthHeaderWithRefresh(): Promise<Record<string, string>> {
		const tokens = this.getStoredTokens()
		if (!tokens?.access_token) return {}

		if (isJwtExpired(tokens.access_token, 60)) {
			const refreshed = await this.tryRefreshToken()
			if (!refreshed) {
				return {}
			}
			const newTokens = this.getStoredTokens()
			if (!newTokens?.access_token) return {}

			return {
				Authorization: `Bearer ${newTokens.access_token}`,
				'Accept-Encoding': 'gzip',
			}
		}

		return {
			Authorization: `Bearer ${tokens.access_token}`,
			'Accept-Encoding': 'gzip',
		}
	}

	private getAuthHeader(): Record<string, string> {
		const tokens = this.getStoredTokens()
		if (!tokens?.access_token) return {}

		if (isJwtExpired(tokens.access_token, 60)) {
			return {}
		}

		return {
			Authorization: `Bearer ${tokens.access_token}`,
			'Accept-Encoding': 'gzip',
		}
	}

	private getStoredTokens(): AuthTokens | null {
		try {
			const stored = localStorage.getItem('auth_tokens')
			return stored ? JSON.parse(stored) : null
		} catch {
			return null
		}
	}

	private storeTokens(tokens: AuthTokens | null) {
		if (tokens) {
			localStorage.setItem('auth_tokens', JSON.stringify(tokens))
		} else {
			localStorage.removeItem('auth_tokens')
		}
	}

	async getCurrentUser(): Promise<User> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await fetch(`${API_BASE}/auth/me`, {
			headers,
		})

		if (response.ok) {
			return this.parseJsonResponse<User>(response)
		}

		if (response.status === 401) {
			return this.handleUnauthorizedResponse()
		}

		throw new Error(`HTTP ${response.status}`)
	}

	private async handleUnauthorizedResponse(): Promise<User> {
		const refreshed = await this.tryRefreshToken()
		if (!refreshed) {
			this.storeTokens(null)
			throw new Error('Unauthorized')
		}

		const newHeaders = this.getAuthHeader()
		const retryResponse = await fetch(`${API_BASE}/auth/me`, {
			headers: newHeaders,
		})

		if (!retryResponse.ok) {
			this.storeTokens(null)
			throw new Error('Unauthorized')
		}

		return this.parseJsonResponse<User>(retryResponse)
	}

	private async parseJsonResponse<T = unknown>(response: Response): Promise<T> {
		try {
			const { user } = await response.json()
			return user
		} catch (jsonError) {
			console.error('Failed to parse JSON from response:', jsonError)
			throw new Error('Invalid JSON response from server')
		}
	}

	async refreshToken(): Promise<AuthTokens> {
		const currentTokens = this.getStoredTokens()
		if (!currentTokens?.access_token) {
			throw new Error('No access token available for refresh')
		}

		const response = await fetch(`${API_BASE}/auth/refresh`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${currentTokens.access_token}`,
			},
		})

		if (!response.ok) {
			throw new Error(`Failed to refresh token: ${response.status}`)
		}

		const tokens = await this.parseJsonResponse<AuthTokens>(response)
		this.storeTokens(tokens)
		return tokens
	}

	private async tryRefreshToken(): Promise<boolean> {
		try {
			const currentTokens = this.getStoredTokens()
			if (!currentTokens?.access_token) return false

			await this.refreshToken()
			return true
		} catch (error) {
			console.error('Token refresh failed:', error)
			this.storeTokens(null)
			return false
		}
	}

	async logout(): Promise<void> {
		try {
			const headers = this.getAuthHeader()
			await fetch(`${API_BASE}/auth/logout`, {
				method: 'POST',
				headers,
			})
		} catch {
		} finally {
			this.storeTokens(null)
			this.queryClient?.removeQueries({ queryKey: ['auth'] })
		}
	}

	initiateLogin() {
		window.location.href = `${API_BASE}/auth/twitch`
	}
}

export const apiClient = new ApiClient()
