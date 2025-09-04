import type { QueryClient } from '@tanstack/react-query'
import type {
	AuthTokens,
	Cell,
	Game,
	GameWithCreator,
	PlayedGame,
	PlayerBoard,
	User,
} from 'shared'
import {
	ApiError,
	AuthError,
	isAuthenticationError,
	NetworkError,
} from '@/lib/errors'
import { isJwtExpired } from '@/lib/jwt'

const API_BASE = import.meta.env.VITE_API_URL
const AUTH_BASE = import.meta.env.VITE_AUTH_URL

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
			if (contentType?.includes('application/json'))
				return await response.json()

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
					'Content-Type': ['POST', 'PATCH', 'PUT'].includes(
						options.method || 'GET',
					)
						? 'application/x-www-form-urlencoded'
						: 'application/json',
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
				return {
					Authorization: `Bearer ${tokens.access_token}`,
				}
			}
			const newTokens = this.getStoredTokens()
			if (!newTokens?.access_token) return {}

			return {
				Authorization: `Bearer ${newTokens.access_token}`,
			}
		}

		return {
			Authorization: `Bearer ${tokens.access_token}`,
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
		const response = await this.fetchWithRetry(`${AUTH_BASE}/auth/me`, {
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

		const response = await this.fetchWithRetry(`${AUTH_BASE}/auth/refresh`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${currentTokens.access_token}`,
			},
		})

		const serverTokens = await this.handleResponse<{
			accessToken: string
			refreshToken: string
			expiresIn: number
		}>(response)

		const tokens: AuthTokens = {
			access_token: serverTokens.accessToken,
			refresh_token: serverTokens.refreshToken,
			expires_in: serverTokens.expiresIn,
		}

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
			if (
				error instanceof AuthError &&
				(error.status === 401 || error.status === 403)
			) {
				this.storeTokens(null)
			}
			return false
		}
	}

	async logout(): Promise<void> {
		try {
			const headers = this.getAuthHeader()
			await this.fetchWithRetry(`${AUTH_BASE}/auth/logout`, {
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
		window.location.href = `${AUTH_BASE}/auth/twitch`
	}

	async getGames(): Promise<GameWithCreator[]> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(`${API_BASE}/games`, { headers })

		const data = await this.handleResponse<GameWithCreator[]>(response)
		return data || []
	}

	async getGameByFriendlyId(friendlyId: string): Promise<GameWithCreator> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(
			`${API_BASE}/games/${friendlyId}`,
			{ headers },
		)

		return this.handleResponse<GameWithCreator>(response)
	}

	async getGamePlayers(friendlyId: string): Promise<{ id: string; displayName: string; connected: boolean }[]> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(
			`${API_BASE}/games/${friendlyId}/players`,
			{ headers },
		)

		return this.handleResponse<{ id: string; displayName: string; connected: boolean }[]>(response)
	}

	async createGame(data: Pick<Game, 'title'>): Promise<Game> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(`${API_BASE}/games`, {
			method: 'POST',
			headers,
			body: new URLSearchParams(data),
		})

		return this.handleResponse<Game>(response)
	}

	async readyGame(friendlyId: string): Promise<GameWithCreator> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(
			`${API_BASE}/games/${friendlyId}/ready`,
			{
				method: 'PATCH',
				headers,
			},
		)

		return this.handleResponse<GameWithCreator>(response)
	}

	async startGame(friendlyId: string): Promise<GameWithCreator> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(
			`${API_BASE}/games/${friendlyId}/start`,
			{
				method: 'PATCH',
				headers,
			},
		)

		return this.handleResponse<GameWithCreator>(response)
	}

	async editGame(friendlyId: string): Promise<GameWithCreator> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(
			`${API_BASE}/games/${friendlyId}/edit`,
			{
				method: 'PATCH',
				headers,
			},
		)

		return this.handleResponse<GameWithCreator>(response)
	}

	async getCells(): Promise<Cell[]> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(`${API_BASE}/cells`, { headers })

		const data = await this.handleResponse<Cell[]>(response)
		return data || []
	}

	async searchCells(query: string): Promise<Cell[]> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(
			`${API_BASE}/cells/search?q=${encodeURIComponent(query)}`,
			{ headers },
		)

		const data = await this.handleResponse<Cell[]>(response)
		return data || []
	}

	async createCell(data: { value: string }): Promise<Cell> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(`${API_BASE}/cells`, {
			method: 'POST',
			headers,
			body: new URLSearchParams(data),
		})

		return this.handleResponse<Cell>(response)
	}

	async linkCellToGame(cellId: string, gameId: string): Promise<void> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(
			`${API_BASE}/cells/${cellId}/link_to_game`,
			{
				method: 'POST',
				headers,
				body: new URLSearchParams({ gameId }),
			},
		)

		return this.handleResponse<void>(response)
	}

	async unlinkCell(gameCellId: string): Promise<void> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(
			`${API_BASE}/game_cells/${gameCellId}`,
			{
				method: 'DELETE',
				headers,
			},
		)

		return this.handleResponse<void>(response)
	}

	async deleteCell(cellId: string): Promise<void> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(`${API_BASE}/cells/${cellId}`, {
			method: 'DELETE',
			headers,
		})

		return this.handleResponse<void>(response)
	}

	async updateCell(id: string, value: string): Promise<Cell> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(`${API_BASE}/cells/${id}`, {
			method: 'PATCH',
			headers,
			body: new URLSearchParams({ value: value }),
		})

		return this.handleResponse<Cell>(response)
	}

	async getPlayedGames(): Promise<PlayedGame[]> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(
			`${API_BASE}/users/games/played`,
			{
				headers,
			},
		)

		const data = await this.handleResponse<PlayedGame[]>(response)
		return data || []
	}

	async getPlayerBoard(friendlyId: string): Promise<PlayerBoard> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(
			`${API_BASE}/games/${friendlyId}/player-board`,
			{ headers },
		)

		return this.handleResponse<PlayerBoard>(response)
	}


	async shufflePlayerBoard(playerBoardId: string): Promise<PlayerBoard> {
		const headers = await this.getAuthHeaderWithRefresh()
		const response = await this.fetchWithRetry(
			`${API_BASE}/player_boards/${playerBoardId}/shuffle`,
			{
				method: 'PATCH',
				headers,
			},
		)

		return this.handleResponse<PlayerBoard>(response)
	}
}
export const apiClient = new ApiClient()
