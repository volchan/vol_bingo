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
	access_token: string
	refresh_token: string
	expires_in: number
}

export interface AuthState {
	user: TwitchUser | null
	tokens: AuthTokens | null
	isLoading: boolean
}
