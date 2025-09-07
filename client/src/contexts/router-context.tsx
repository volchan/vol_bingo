import type { AuthTokens, User } from 'shared'

export interface AuthenticationContext {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => Promise<void>
  refetch: () => void
}

export interface RouterContext {
  authentication?: AuthenticationContext
}

export function validateAuth(): {
  user: User | null
  isAuthenticated: boolean
} {
  try {
    const stored = localStorage.getItem('auth_tokens')
    if (!stored) {
      return { user: null, isAuthenticated: false }
    }

    let parsedTokens: AuthTokens
    try {
      parsedTokens = JSON.parse(stored)
    } catch {
      localStorage.removeItem('auth_tokens')
      return { user: null, isAuthenticated: false }
    }

    if (!parsedTokens?.access_token) {
      localStorage.removeItem('auth_tokens')
      return { user: null, isAuthenticated: false }
    }

    // Just check if we have valid tokens, don't make another API call
    // The AuthContext will handle the actual user fetching
    return {
      user: null, // Will be populated by AuthContext
      isAuthenticated: true,
    }
  } catch {
    localStorage.removeItem('auth_tokens')
    return { user: null, isAuthenticated: false }
  }
}
