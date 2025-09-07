import type { GameCell } from '../models/cell'
import type { Game } from '../models/game'

export interface GameWithCreator extends Omit<Game, 'createdAt' | 'updatedAt'> {
  createdAt: string
  updatedAt: string | null
  status: 'draft' | 'ready' | 'playing' | 'completed'
  creator: {
    displayName: string
    id: string
  }
  gameCells?: GameCell[]
}

export interface GameListResponse {
  games: GameWithCreator[]
}

export interface GameCreateResponse {
  game: Game
}

export interface PlayedGame {
  id: string
  title: string
  friendlyId: string
  status: 'draft' | 'ready' | 'playing' | 'completed'
  createdAt: string
  updatedAt: string | null
  creator: {
    displayName: string
    id: string
  }
  userHasBingo: boolean
  players: {
    displayName: string
    id: string
  }[]
}
