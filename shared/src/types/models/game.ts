export interface Game {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date | null
  creatorId: string
  friendlyId: string
  status: 'draft' | 'ready' | 'playing' | 'completed'
  currentTemplateId?: string | null
  displayOnStream: boolean
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
