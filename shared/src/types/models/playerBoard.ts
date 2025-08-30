export interface PlayerBoard {
	id: string
	playerId: string
	gameId: string
	createdAt: Date
	updatedAt: Date
}

export interface PlayerBoardCell {
	id: string
	playerBoardId: string
	gameCellId: string
	position: number
	createdAt: Date
	updatedAt: Date
}
