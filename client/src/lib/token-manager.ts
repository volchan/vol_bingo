import type { AuthTokens } from 'shared'
import { isJwtExpired } from './jwt'

type TokenSubscriber = (tokens: AuthTokens | null) => void
type ConnectionSubscriber = (connectionId: string, newToken: string) => void

class TokenManager {
  private tokens: AuthTokens | null = null
  private subscribers: Set<TokenSubscriber> = new Set()
  private connectionSubscribers: Set<ConnectionSubscriber> = new Set()
  private refreshPromise: Promise<AuthTokens | null> | null = null
  private storageKey = 'auth_tokens'

  constructor() {
    this.loadFromStorage()
    this.setupStorageListener()
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.tokens = JSON.parse(stored)
      }
    } catch {
      this.tokens = null
    }
  }

  private setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.loadFromStorage()
        this.notifySubscribers()
      }
    })

    setInterval(() => {
      const currentTokens = this.getTokens()
      const storedTokens = this.getStoredTokens()

      if (JSON.stringify(currentTokens) !== JSON.stringify(storedTokens)) {
        this.loadFromStorage()
        this.notifySubscribers()
      }
    }, 1000)
  }

  private getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => {
      callback(this.tokens)
    })
  }

  getTokens(): AuthTokens | null {
    return this.tokens
  }

  setTokens(tokens: AuthTokens | null) {
    this.tokens = tokens
    if (tokens) {
      localStorage.setItem(this.storageKey, JSON.stringify(tokens))
    } else {
      localStorage.removeItem(this.storageKey)
    }
    this.notifySubscribers()
  }

  subscribe(callback: TokenSubscriber): () => void {
    this.subscribers.add(callback)
    callback(this.tokens)

    return () => {
      this.subscribers.delete(callback)
    }
  }

  subscribeToConnectionUpdates(callback: ConnectionSubscriber): () => void {
    this.connectionSubscribers.add(callback)

    return () => {
      this.connectionSubscribers.delete(callback)
    }
  }

  isTokenExpired(bufferSeconds = 60): boolean {
    if (!this.tokens?.access_token) return true
    return isJwtExpired(this.tokens.access_token, bufferSeconds)
  }

  async getValidToken(): Promise<string | null> {
    if (!this.tokens?.access_token) return null

    if (!this.isTokenExpired()) {
      return this.tokens.access_token
    }

    const refreshed = await this.refreshToken()
    return refreshed?.access_token || null
  }

  async refreshToken(): Promise<AuthTokens | null> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performTokenRefresh()

    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.refreshPromise = null
    }
  }

  private async performTokenRefresh(): Promise<AuthTokens | null> {
    const currentTokens = this.tokens
    if (!currentTokens?.access_token) {
      return null
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_AUTH_URL}/auth/refresh`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentTokens.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        if (response.status === 401) {
          this.setTokens(null)
        }
        return null
      }

      const serverTokens = (await response.json()) as {
        accessToken: string
        refreshToken: string
        expiresIn: number
      }

      const newTokens: AuthTokens = {
        access_token: serverTokens.accessToken,
        refresh_token: serverTokens.refreshToken,
        expires_in: serverTokens.expiresIn,
      }

      this.setTokens(newTokens)

      this.connectionSubscribers.forEach((callback) => {
        callback('*', newTokens.access_token)
      })

      return newTokens
    } catch {
      this.setTokens(null)
      return null
    }
  }

  clear() {
    this.setTokens(null)
  }
}

export const tokenManager = new TokenManager()
