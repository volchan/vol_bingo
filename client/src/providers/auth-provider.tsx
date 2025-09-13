import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthTokens } from 'shared'
import { AuthContext } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api'
import { tokenManager } from '@/lib/token-manager'

interface AuthProviderProps {
  readonly children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentTokens, setCurrentTokens] = useState<AuthTokens | null>(null)

  useEffect(() => {
    apiClient.setQueryClient(queryClient)
    setIsInitialized(true)
    setCurrentTokens(tokenManager.getTokens())
  }, [queryClient])

  const {
    data: user,
    isLoading: isQueryLoading,
    isError,
    refetch: queryRefetch,
    error,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => apiClient.getCurrentUser(),
    enabled: isInitialized && !!currentTokens?.access_token,
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
      tokenManager.clear()
    }
  }, [error])

  useEffect(() => {
    const unsubscribe = tokenManager.subscribe((tokens) => {
      setCurrentTokens(tokens)
      if (!tokens) {
        queryClient.removeQueries({ queryKey: ['auth'] })
      }
    })

    return unsubscribe
  }, [queryClient])

  const login = useCallback(() => apiClient.initiateLogin(), [])

  const logout = useCallback(async () => {
    await apiClient.logout()
    tokenManager.clear()
    queryClient.removeQueries({ queryKey: ['auth'] })
  }, [queryClient])

  const refetch = useCallback(() => {
    setCurrentTokens(tokenManager.getTokens())
    queryRefetch()
  }, [queryRefetch])

  const isLoading = !isInitialized || isQueryLoading
  const isAuthenticated = !!(user && !isError && currentTokens)

  const tokens = useMemo(() => {
    return currentTokens || { access_token: null, refresh_token: null }
  }, [currentTokens])

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
