export interface Game {
	id: string
	title: string
	createdAt: Date
	updatedAt: Date | null
	creatorId: string
	friendlyId: string
	winnerId?: string | null
	status: 'draft' | 'active' | 'completed'
}
