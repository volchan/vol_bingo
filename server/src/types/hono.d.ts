import type { User } from '@shared/types/models/user'

// Extend Hono's context variable map to include our custom variables
declare module 'hono' {
	interface ContextVariableMap {
		currentUser: User
		jwtPayload: {
			userId: string
			refreshToken: string
			iat: number
			exp: number
		}
		refreshToken: string
	}
}
