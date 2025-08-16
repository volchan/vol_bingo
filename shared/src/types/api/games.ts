import type { Game } from '../models/game'

export interface GameWithCreator extends Omit<Game, 'createdAt' | 'updatedAt'> {
	createdAt: string
	updatedAt: string | null
	status: 'draft' | 'active' | 'completed'
	creator: {
		displayName: string
		id: string
	}
}

export interface GameListResponse {
	games: GameWithCreator[]
}

export interface GameCreateResponse {
	game: Game
}
