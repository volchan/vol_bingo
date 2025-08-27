import { createContext } from 'react'
import type { User } from 'shared'

interface AuthContextType {
	user: User | null
	isAuthenticated: boolean
	isLoading: boolean
	login: () => void
	logout: () => Promise<void>
	refetch: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export type { AuthContextType }
