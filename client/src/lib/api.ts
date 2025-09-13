import type { QueryClient } from '@tanstack/react-query'
import type {
  AuthTokens,
  Cell,
  CreateTemplateRequest,
  Game,
  GameWithCreator,
  PlayedGame,
  PlayerBoard,
  Template,
  TemplateWithCells,
  TemplateWithCreator,
  User,
} from 'shared'
import {
  ApiError,
  AuthError,
  isAuthenticationError,
  NetworkError,
} from '@/lib/errors'
import { tokenManager } from '@/lib/token-manager'

const API_BASE = import.meta.env.VITE_API_URL
const AUTH_BASE = import.meta.env.VITE_AUTH_URL

class ApiClient {
  private queryClient: QueryClient | null = null

  setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await this.getErrorData(response)

      if (isAuthenticationError(response.status)) {
        throw new AuthError(
          response.status,
          response.statusText,
          String(errorData.message || ''),
        )
      }

      // For validation errors, throw the entire error data
      const error = new ApiError(
        response.status,
        response.statusText,
        String(errorData.message || ''),
      )
      // Preserve the full error data (including issues array) on the error object
      Object.assign(error, errorData)
      throw error
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

  private async getErrorData(
    response: Response,
  ): Promise<Record<string, unknown>> {
    try {
      const data = await response.json()
      return data
    } catch {
      return { message: `HTTP ${response.status}: ${response.statusText}` }
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
    const token = await tokenManager.getValidToken()
    if (!token) return {}

    return {
      Authorization: `Bearer ${token}`,
    }
  }

  private getAuthHeader(): Record<string, string> {
    const tokens = tokenManager.getTokens()
    if (!tokens?.access_token || tokenManager.isTokenExpired()) {
      return {}
    }

    return {
      Authorization: `Bearer ${tokens.access_token}`,
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
    const refreshed = await tokenManager.refreshToken()
    if (!refreshed) {
      throw new AuthError(401, 'Unauthorized', 'Failed to refresh token')
    }
    return refreshed
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
      tokenManager.clear()
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

  async getGamePlayers(
    friendlyId: string,
  ): Promise<{ id: string; displayName: string; connected: boolean }[]> {
    const headers = await this.getAuthHeaderWithRefresh()
    const response = await this.fetchWithRetry(
      `${API_BASE}/games/${friendlyId}/players`,
      { headers },
    )

    return this.handleResponse<
      { id: string; displayName: string; connected: boolean }[]
    >(response)
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

  async completeGame(friendlyId: string): Promise<GameWithCreator> {
    const headers = await this.getAuthHeaderWithRefresh()
    const response = await this.fetchWithRetry(
      `${API_BASE}/games/${friendlyId}/complete`,
      {
        method: 'PATCH',
        headers,
      },
    )

    return this.handleResponse<GameWithCreator>(response)
  }

  async setDisplayOnStream(
    gameId: string,
    displayOnStream: boolean,
  ): Promise<GameWithCreator> {
    const headers = await this.getAuthHeaderWithRefresh()
    const response = await this.fetchWithRetry(
      `${API_BASE}/games/${gameId}/display_on_stream`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayOnStream }),
      },
    )

    return this.handleResponse<GameWithCreator>(response)
  }

  async getUser(): Promise<User> {
    const headers = await this.getAuthHeaderWithRefresh()
    const response = await this.fetchWithRetry(`${API_BASE}/users/me`, {
      headers,
    })

    return this.handleResponse<User>(response)
  }

  async generateStreamToken(): Promise<{
    success: boolean
    token?: string
    error?: string
  }> {
    const headers = await this.getAuthHeaderWithRefresh()
    const response = await this.fetchWithRetry(
      `${API_BASE}/users/stream_integration/generate_token`,
      {
        method: 'POST',
        headers,
      },
    )

    return this.handleResponse<{
      success: boolean
      token?: string
      error?: string
    }>(response)
  }

  async rollStreamToken(): Promise<{
    success: boolean
    token?: string
    error?: string
  }> {
    const headers = await this.getAuthHeaderWithRefresh()
    const response = await this.fetchWithRetry(
      `${API_BASE}/users/stream_integration/roll_token`,
      {
        method: 'POST',
        headers,
      },
    )

    return this.handleResponse<{
      success: boolean
      token?: string
      error?: string
    }>(response)
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

  async getGameRankings(
    friendlyId: string,
  ): Promise<{ id: string; displayName: string; bingoCount: number }[]> {
    const headers = await this.getAuthHeaderWithRefresh()
    const response = await this.fetchWithRetry(
      `${API_BASE}/games/${friendlyId}/rankings`,
      { headers },
    )

    return this.handleResponse<
      { id: string; displayName: string; bingoCount: number }[]
    >(response)
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

  // Template methods
  async getTemplates(): Promise<TemplateWithCreator[]> {
    const headers = await this.getAuthHeaderWithRefresh()
    const response = await this.fetchWithRetry(`${API_BASE}/templates`, {
      headers,
    })

    const data = await this.handleResponse<TemplateWithCreator[]>(response)
    return data || []
  }

  async getTemplate(templateId: string): Promise<TemplateWithCells> {
    const headers = await this.getAuthHeaderWithRefresh()
    const response = await this.fetchWithRetry(
      `${API_BASE}/templates/${templateId}`,
      {
        headers,
      },
    )

    return this.handleResponse<TemplateWithCells>(response)
  }

  async createTemplate(data: CreateTemplateRequest): Promise<Template> {
    const headers = await this.getAuthHeaderWithRefresh()
    const params = new URLSearchParams()
    params.append('name', data.name)
    if (data.description) {
      params.append('description', data.description)
    }
    data.cellIds.forEach((cellId: string) => {
      params.append('cellIds', cellId)
    })
    if (data.gameId) {
      params.append('gameId', data.gameId)
    }

    const response = await this.fetchWithRetry(`${API_BASE}/templates`, {
      method: 'POST',
      headers,
      body: params,
    })

    return this.handleResponse<Template>(response)
  }

  async updateTemplate(
    templateId: string,
    data: CreateTemplateRequest,
  ): Promise<Template> {
    const headers = await this.getAuthHeaderWithRefresh()
    const params = new URLSearchParams()
    params.append('name', data.name)
    if (data.description) {
      params.append('description', data.description)
    }
    data.cellIds.forEach((cellId: string) => {
      params.append('cellIds', cellId)
    })

    const response = await this.fetchWithRetry(
      `${API_BASE}/templates/${templateId}`,
      {
        method: 'PUT',
        headers,
        body: params,
      },
    )

    return this.handleResponse<Template>(response)
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const headers = await this.getAuthHeaderWithRefresh()
    await this.fetchWithRetry(`${API_BASE}/templates/${templateId}`, {
      method: 'DELETE',
      headers,
    })
  }

  async applyTemplate(gameId: string, templateId: string): Promise<void> {
    const headers = await this.getAuthHeaderWithRefresh()
    const params = new URLSearchParams()
    params.append('templateId', templateId)

    await this.fetchWithRetry(`${API_BASE}/templates/apply/${gameId}`, {
      method: 'POST',
      headers,
      body: params,
    })
  }
}
export const apiClient = new ApiClient()
