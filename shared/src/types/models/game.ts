export interface Game {
	id: string
	title: string
	createdAt: Date
	updatedAt: Date | null
	creatorId: string
	friendlyId: string
}
