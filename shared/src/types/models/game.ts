export interface Game {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date | null
  creatorId: string
  friendlyId: string
  winnerId?: string | null
  status: 'draft' | 'ready' | 'playing' | 'completed'
  currentTemplateId?: string | null
  creator?: {
    id: string
    displayName: string
  }
  gameCells?: Array<{
    cell?: {
      value: string
    }
  }>
}
