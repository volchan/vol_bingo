import type { User } from 'shared'
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
		const stored = localStorage.getItem('twitch_tokens')
		if (!stored) {
			return { user: null, isAuthenticated: false }
		}

		// Try to get current user (this will handle token refresh automatically)
		const user = await apiClient.getCurrentUser()
		return {
			user,
			isAuthenticated: true
		}
	} catch (error) {
		// If validation fails, clear invalid tokens and log the error
		console.error('Authentication validation failed:', error)
		localStorage.removeItem('twitch_tokens')
		return { user: null, isAuthenticated: false }
	}
}
