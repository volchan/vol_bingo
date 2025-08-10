import type { QueryClient } from '@tanstack/react-query'
import type { AuthTokens, User } from 'shared'

const API_BASE = import.meta.env.VITE_API_URL

class ApiClient {
	private queryClient: QueryClient | null = null

	setQueryClient(queryClient: QueryClient) {
		this.queryClient = queryClient
	}

	private getAuthHeader(): Record<string, string> {
		const tokens = this.getStoredTokens()
		if (tokens?.access_token) {
			return { Authorization: `Bearer ${tokens.access_token}` }
		}
		return {}
	}

	private getStoredTokens(): AuthTokens | null {
		try {
			const stored = localStorage.getItem('twitch_tokens')
			return stored ? JSON.parse(stored) : null
		} catch {
			return null
		}
	}

	private storeTokens(tokens: AuthTokens | null) {
		if (tokens) {
			localStorage.setItem('twitch_tokens', JSON.stringify(tokens))
		} else {
			localStorage.removeItem('twitch_tokens')
		}
	}

	async getCurrentUser(): Promise<User> {
		const response = await fetch(`${API_BASE}/auth/me`, {
			headers: this.getAuthHeader()
		})

		if (!response.ok) {
			if (response.status === 401) {
				// Try to refresh token
				const refreshed = await this.tryRefreshToken()
				if (refreshed) {
					// Retry with new token
					const retryResponse = await fetch(`${API_BASE}/auth/me`, {
						headers: this.getAuthHeader()
					})
					if (retryResponse.ok) {
						return retryResponse.json()
					}
				}
				// Clear invalid tokens and throw
				this.storeTokens(null)
				throw new Error('Unauthorized')
			}
			throw new Error(`HTTP ${response.status}`)
		}

		return response.json()
	}

	async refreshToken(refreshToken: string): Promise<AuthTokens> {
		const response = await fetch(`${API_BASE}/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh_token: refreshToken })
		})

		if (!response.ok) {
			throw new Error('Failed to refresh token')
		}

		const tokens: AuthTokens = await response.json()
		this.storeTokens(tokens)
		return tokens
	}

	private async tryRefreshToken(): Promise<boolean> {
		try {
			const currentTokens = this.getStoredTokens()
			if (!currentTokens?.refresh_token) return false

			await this.refreshToken(currentTokens.refresh_token)
			return true
		} catch {
			return false
		}
	}

	async logout(): Promise<void> {
		try {
			await fetch(`${API_BASE}/auth/logout`, {
				method: 'POST',
				headers: this.getAuthHeader()
			})
		} catch {
			// Ignore logout errors
		} finally {
			this.storeTokens(null)
			this.queryClient?.invalidateQueries({ queryKey: ['auth'] })
		}
	}

	initiateLogin() {
		window.location.href = `${API_BASE}/auth/twitch`
	}
}

export const apiClient = new ApiClient()
