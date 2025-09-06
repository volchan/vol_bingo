export * from './api/games'
export * from './models/cell'
export * from './models/game'
export * from './models/playerBoard'
export * from './models/template'
export * from './models/user'

export interface ApiResponse {
  message: string
  success: boolean
}

export interface TwitchUser {
  id: string
  login: string
  display_name: string
  email: string
  profile_image_url: string
  created_at: string
}

export interface AuthResponse {
  user: TwitchUser
  token: string
}

export interface AuthTokens {
  access_token: string // This is the JWT token (for backward compatibility)
  refresh_token: string
  expires_in: number
}

export interface AuthState {
  user: TwitchUser | null
  tokens: AuthTokens | null
  isLoading: boolean
}
