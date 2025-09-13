import type { User } from 'shared'
import { tokenManager } from '@/lib/token-manager'

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
  const tokens = tokenManager.getTokens()
  if (!tokens?.access_token) {
    return { user: null, isAuthenticated: false }
  }

  // Just check if we have valid tokens, don't make another API call
  // The AuthContext will handle the actual user fetching
  return {
    user: null, // Will be populated by AuthContext
    isAuthenticated: true,
  }
}
