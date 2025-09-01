export interface Game {
	id: string
	title: string
	createdAt: Date
	updatedAt: Date | null
	creatorId: string
	friendlyId: string
	winnerId?: string | null
	status: 'draft' | 'ready' | 'playing' | 'completed'
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
