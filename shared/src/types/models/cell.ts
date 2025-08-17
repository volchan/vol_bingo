export interface Cell {
	id: string
	value: string
	userId: string
	createdAt: Date
	updatedAt: Date | null
}

export interface GameCell {
	id: string
	gameId: string
	cellId: string
	createdAt: Date
	updatedAt: Date | null
	cell?: Cell
}
