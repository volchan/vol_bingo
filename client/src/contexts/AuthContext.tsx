import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import type { AuthTokens, User } from 'shared'
import { apiClient } from '../lib/api'

interface AuthContextType {
	user: User | null
	isAuthenticated: boolean
	isLoading: boolean
	login: () => void
	logout: () => Promise<void>
	refetch: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({
	children,
}: {
	readonly children: React.ReactNode
}) {
	const queryClient = useQueryClient()
	const [isInitialized, setIsInitialized] = useState(false)

	// Set query client reference for API client
	useEffect(() => {
		apiClient.setQueryClient(queryClient)
		setIsInitialized(true)
	}, [queryClient])

	// Check for stored tokens
	const getStoredTokens = useCallback((): AuthTokens | null => {
		try {
			const stored = localStorage.getItem('twitch_tokens')
			return stored ? JSON.parse(stored) : null
		} catch {
			return null
		}
	}, [])

	// Main auth query - this uses the same /auth/me endpoint that routes use
	const {
		data: user,
		isLoading: isQueryLoading,
		isError,
		refetch: queryRefetch,
	} = useQuery({
		queryKey: ['auth', 'user'],
		queryFn: async () => apiClient.getCurrentUser(),
		enabled: isInitialized && !!getStoredTokens()?.access_token,
		retry: false,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: true, // Refetch when window gains focus
		refetchOnMount: true, // Always refetch on mount
	})

	const login = useCallback(() => apiClient.initiateLogin(), [])

	const logout = useCallback(async () => apiClient.logout(), [])

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

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
