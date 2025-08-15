import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthTokens, User } from 'shared'
import { apiClient } from '@/lib/api'

interface AuthContextType {
	user: User | null
	isAuthenticated: boolean
	isLoading: boolean
	login: () => void
	logout: () => Promise<void>
	refetch: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export { AuthContext }

interface AuthProviderProps {
	readonly children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
	const queryClient = useQueryClient()
	const [isInitialized, setIsInitialized] = useState(false)

	useEffect(() => {
		apiClient.setQueryClient(queryClient)
		setIsInitialized(true)
	}, [queryClient])

	const getStoredTokens = useCallback((): AuthTokens | null => {
		try {
			const stored = localStorage.getItem('auth_tokens')
			return stored ? JSON.parse(stored) : null
		} catch {
			return null
		}
	}, [])

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
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		throwOnError: false,
	})

	useEffect(() => {
		if (error?.message.includes('Unauthorized')) {
			localStorage.removeItem('auth_tokens')
		}
	}, [error])

	const login = useCallback(() => apiClient.initiateLogin(), [])

	const logout = useCallback(async () => {
		await apiClient.logout()
		queryClient.removeQueries({ queryKey: ['auth'] })
	}, [queryClient])

	const refetch = useCallback(() => {
		queryRefetch()
	}, [queryRefetch])

	const isLoading = !isInitialized || isQueryLoading
	const isAuthenticated = !!(user && !isError && getStoredTokens())

	const contextValue = useMemo(
		() => ({
			user: user || null,
			isAuthenticated,
			isLoading,
			login,
			logout,
			refetch,
		}),
		[user, isAuthenticated, isLoading, login, logout, refetch],
	)

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	)
}

AuthProvider.displayName = 'AuthProvider'
