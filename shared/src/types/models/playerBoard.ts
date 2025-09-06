export interface PlayerBoard {
  id: string
  playerId: string
  gameId: string
  createdAt: Date
  updatedAt: Date
  playerBoardCells?: PlayerBoardCellWithGameCell[]
}

export interface PlayerBoardCell {
  id: string
  playerBoardId: string
  gameCellId: string
  position: number
  createdAt: Date
  updatedAt: Date
}

export interface PlayerBoardCellWithGameCell extends PlayerBoardCell {
  gameCell?: {
    marked: boolean
    cell?: {
      value: string
    }
  }
}
