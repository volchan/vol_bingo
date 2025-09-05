export interface WebSocketMessage {
	type: string
	data?: unknown
}

export interface GameStateChangeMessage extends WebSocketMessage {
	type: 'game_state_change'
	data: {
		gameId: string
		status: 'draft' | 'ready' | 'playing' | 'completed'
		linkedCellsCount?: number
	}
}

export interface CellMarkedMessage extends WebSocketMessage {
	type: 'cell_marked'
	data: {
		gameId: string
		gameCellId: string
		marked: boolean
	}
}

export interface PlayersListUpdateMessage extends WebSocketMessage {
	type: 'players_list_update'
	data: {
		gameId: string
		players: Array<{
			id: string
			displayName: string
			connected: boolean
		}>
	}
}

export interface GameCellAddedMessage extends WebSocketMessage {
	type: 'game_cell_added'
	data: {
		gameId: string
		cellValue: string
		linkedCellsCount: number
	}
}

export interface GameCellRemovedMessage extends WebSocketMessage {
	type: 'game_cell_removed'
	data: {
		gameId: string
		cellValue: string
		linkedCellsCount: number
	}
}

export interface BingoAchievedMessage extends WebSocketMessage {
	type: 'bingo_achieved'
	data: {
		gameId: string
		bingoPlayers: Array<{
			playerId: string
			playerBoardId: string
			playerName: string
			bingoCount: number
			isMegaBingo: boolean
		}>
		newBingoPlayers: Array<{
			playerId: string
			playerBoardId: string
			playerName: string
			bingoCount: number
			isMegaBingo: boolean
		}>
		isMegaBingo: boolean
	}
}

export type GameMessage =
	| GameStateChangeMessage
	| CellMarkedMessage
	| PlayersListUpdateMessage
	| GameCellAddedMessage
	| GameCellRemovedMessage
	| BingoAchievedMessage
