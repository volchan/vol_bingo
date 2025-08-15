import type { AuthTokens, User } from 'shared'
import { apiClient } from '@/lib/api'

export interface RouterContext {
	authentication: {
		user: User | null
		isAuthenticated: boolean
		isLoading: boolean
	}
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

		// Try to parse stored tokens to validate they're valid JSON
		let parsedTokens: AuthTokens
		try {
			parsedTokens = JSON.parse(stored)
		} catch (parseError) {
			console.error('Invalid JSON in stored tokens:', parseError)
			localStorage.removeItem('auth_tokens')
			return { user: null, isAuthenticated: false }
		}

		if (!parsedTokens?.access_token) {
			console.warn('No access token found in stored tokens')
			localStorage.removeItem('auth_tokens')
			return { user: null, isAuthenticated: false }
		}

		const user = await apiClient.getCurrentUser()
		return {
			user,
			isAuthenticated: true,
		}
	} catch (error) {
		console.error('Authentication validation failed:', error)
		localStorage.removeItem('auth_tokens')
		return { user: null, isAuthenticated: false }
	}
}
