export interface TwitchTokenResponse {
	access_token: string
	refresh_token?: string
	expires_in: number
	token_type: string
	scope: string[]
}

export interface TwitchUserData {
	id: string
	login: string
	display_name: string
	type: string
	broadcaster_type: string
	description: string
	profile_image_url: string
	offline_image_url: string
	view_count: number
	email: string
	created_at: string
}

export interface TwitchApiResponse {
	data: TwitchUserData[]
}

export interface AuthResult {
	success: boolean
	data?: {
		user: TwitchUserData
		token: string
		refreshToken?: string
	}
	error?: string
	redirectUrl?: string
}

export interface StateManager {
	generateState(): string
	validateState(state: string): boolean
	cleanupStates(): void
}
