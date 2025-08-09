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
