import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthTokens } from 'shared'
import { AuthContext } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api'

interface AuthProviderProps {
  readonly children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [isInitialized, setIsInitialized] = useState(false)
  const [storedTokens, setStoredTokens] = useState<{
    access_token: string | null
    refresh_token: string | null
  } | null>(null)

  const getStoredTokens = useCallback((): AuthTokens | null => {
    try {
      const stored = localStorage.getItem('auth_tokens')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    apiClient.setQueryClient(queryClient)
    setIsInitialized(true)
    // Initialize stored tokens
    setStoredTokens(getStoredTokens())
  }, [queryClient, getStoredTokens])

  const {
    data: user,
    isLoading: isQueryLoading,
    isError,
    refetch: queryRefetch,
    error,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => apiClient.getCurrentUser(),
    enabled: isInitialized && !!getStoredTokens()?.access_token,
    retry: (failureCount, error) => {
      if (error?.message.includes('Unauthorized')) return false
      return failureCount < 2
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    throwOnError: false,
  })

  useEffect(() => {
    if (error?.message.includes('Unauthorized')) {
      localStorage.removeItem('auth_tokens')
      setStoredTokens({ access_token: null, refresh_token: null })
    }
  }, [error])

  useEffect(() => {
    const handleStorageChange = () => {
      const newTokens = getStoredTokens()
      setStoredTokens(newTokens)
    }

    window.addEventListener('storage', handleStorageChange)

    const interval = setInterval(() => {
      const currentTokens = getStoredTokens()
      const currentHasToken = !!currentTokens?.access_token
      const stateHasToken = !!storedTokens?.access_token

      if (currentHasToken !== stateHasToken) {
        setStoredTokens(currentTokens)
      }
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [getStoredTokens, storedTokens])

  const login = useCallback(() => apiClient.initiateLogin(), [])

  const logout = useCallback(async () => {
    await apiClient.logout()
    setStoredTokens({ access_token: null, refresh_token: null })
    queryClient.removeQueries({ queryKey: ['auth'] })
  }, [queryClient])

  const refetch = useCallback(() => {
    const newTokens = getStoredTokens()
    setStoredTokens(newTokens)
    queryRefetch()
  }, [queryRefetch, getStoredTokens])

  const isLoading = !isInitialized || isQueryLoading
  const isAuthenticated = !!(user && !isError && getStoredTokens())

  const tokens = useMemo(() => {
    return storedTokens || { access_token: null, refresh_token: null }
  }, [storedTokens])

  const contextValue = useMemo(
    () => ({
      user: user || null,
      isAuthenticated,
      isLoading,
      tokens,
      login,
      logout,
      refetch,
    }),
    [user, isAuthenticated, isLoading, tokens, login, logout, refetch],
  )

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

AuthProvider.displayName = 'AuthProvider'
