import type { AuthTokens, User } from 'shared'
import { apiClient } from '@/lib/api'

export interface AuthenticationContext {
	user: User | null
	isAuthenticated: boolean
	isLoading: boolean
	login: () => void
	logout: () => Promise<void>
	refetch: () => void
}

export interface RouterContext {
	authentication: AuthenticationContext
}

export async function validateAuth(): Promise<{
	user: User | null
	isAuthenticated: boolean
}> {
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

		const user = await apiClient.getCurrentUser()
		return {
			user,
			isAuthenticated: true,
		}
	} catch {
		localStorage.removeItem('auth_tokens')
		return { user: null, isAuthenticated: false }
	}
}
