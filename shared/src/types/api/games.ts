import type { Game } from '../models/game'

export interface GameListResponse {
	games: (Game & {
		creator: {
			displayName: string
			id: string
		}
	})[]
}
