import type { User } from '@shared/types/models/user'

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
