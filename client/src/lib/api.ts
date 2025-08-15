import type { QueryClient } from '@tanstack/react-query'
import type { AuthTokens, User } from 'shared'
import {
	ApiError,
	AuthError,
	isAuthenticationError,
	NetworkError,
} from '@/lib/errors'
import { isJwtExpired } from '@/lib/jwt'

const API_BASE = import.meta.env.VITE_API_URL

class ApiClient {
	private queryClient: QueryClient | null = null

	setQueryClient(queryClient: QueryClient) {
		this.queryClient = queryClient
	}

	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const errorMessage = await this.getErrorMessage(response)

			if (isAuthenticationError(response.status)) {
				throw new AuthError(response.status, response.statusText, errorMessage)
			}

			throw new ApiError(response.status, response.statusText, errorMessage)
		}

		try {
			const contentType = response.headers.get('content-type')
			if (contentType?.includes('application/json')) {
				const data = await response.json()
				return data.user || data.data || data
			}
			return null as T
		} catch (error) {
			throw new ApiError(
				response.status,
				'Invalid JSON response',
				String(error),
			)
		}
	}

	private async getErrorMessage(response: Response): Promise<string> {
		try {
			const data = await response.json()
			return data.message || data.error || `HTTP ${response.status}`
		} catch {
			return `HTTP ${response.status}: ${response.statusText}`
		}
	}

	private async fetchWithRetry(
		url: string,
		options: RequestInit = {},
		retries = 1,
	): Promise<Response> {
		try {
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					...options.headers,
				},
			})
			return response
		} catch (error) {
			if (retries > 0 && this.isRetryableError(error)) {
				await this.delay(1000)
				return this.fetchWithRetry(url, options, retries - 1)
			}
			throw new NetworkError(String(error))
		}
	}

	private isRetryableError(error: unknown): boolean {
		return (
			error instanceof TypeError ||
			(error instanceof Error && error.message.includes('fetch'))
		)
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
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
		const response = await this.fetchWithRetry(`${API_BASE}/auth/me`, {
			headers,
		})

		return this.handleResponse<User>(response)
	}

	async refreshToken(): Promise<AuthTokens> {
		const currentTokens = this.getStoredTokens()
		if (!currentTokens?.access_token) {
			throw new AuthError(
				401,
				'Unauthorized',
				'No access token available for refresh',
			)
		}

		const response = await this.fetchWithRetry(`${API_BASE}/auth/refresh`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${currentTokens.access_token}`,
			},
		})

		const tokens = await this.handleResponse<AuthTokens>(response)
		this.storeTokens(tokens)
		return tokens
	}

	private async tryRefreshToken(): Promise<boolean> {
		try {
			const currentTokens = this.getStoredTokens()
			if (!currentTokens?.access_token) return false

			await this.refreshToken()
			return true
		} catch {
			this.storeTokens(null)
			return false
		}
	}

	async logout(): Promise<void> {
		try {
			const headers = this.getAuthHeader()
			await this.fetchWithRetry(`${API_BASE}/auth/logout`, {
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
