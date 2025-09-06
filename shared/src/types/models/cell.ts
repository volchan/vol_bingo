export interface Cell {
  id: string
  value: string
  userId: string
  createdAt: Date
  updatedAt: Date | null
  isUsedInGames?: boolean
  isUsedInNonDraftGames?: boolean
  canDelete?: boolean
  canEdit?: boolean
}

export interface GameCell {
  id: string
  gameId: string
  cellId: string
  createdAt: Date
  updatedAt: Date | null
  cell?: Cell
}
