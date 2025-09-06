import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlayerBoardCellWithGameCell } from 'shared'
import { authKeys } from './api/games.hooks'
import { playerBoardKeys } from './api/player-boards.hooks'
import { useWebSocket } from './use-websocket'

interface BingoPlayer {
	playerId: string
	playerBoardId: string
	playerName: string
	bingoCount: number
	isMegaBingo: boolean
}

interface GameStateChangeData {
	gameId: string
	status: 'draft' | 'ready' | 'playing' | 'completed'
	linkedCellsCount?: number
}

interface CellMarkedData {
	gameId: string
	gameCellId: string
	marked: boolean
}

interface GameCellAddedData {
	gameId: string
	cellValue: string
	linkedCellsCount: number
}

interface GameCellRemovedData {
	gameId: string
	cellValue: string
	linkedCellsCount: number
}

interface PlayersListUpdateData {
	gameId: string
	players: Array<{
		id: string
		displayName: string
		connected: boolean
	}>
}

interface BingoAchievedData {
	gameId: string
	bingoPlayers: BingoPlayer[]
	newBingoPlayers: BingoPlayer[]
	isMegaBingo: boolean
}

interface GameWebSocketMessage {
	type:
		| 'game_state_change'
		| 'cell_marked'
		| 'game_cell_added'
		| 'game_cell_removed'
		| 'players_list_update'
		| 'bingo_achieved'
	data:
		| GameStateChangeData
		| CellMarkedData
		| GameCellAddedData
		| GameCellRemovedData
		| PlayersListUpdateData
		| BingoAchievedData
	timestamp?: number
}

interface Player {
	id: string
	displayName: string
	connected: boolean
}

export function useGameWebSocket(friendlyId: string) {
	const queryClient = useQueryClient()
	const [players, setPlayers] = useState<Player[]>([])
	const [isLoadingPlayers, setIsLoadingPlayers] = useState(true)
	const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0)
	const [bingoPlayers, setBingoPlayers] = useState<BingoPlayer[]>([])
	const [newBingoPlayers, setNewBingoPlayers] = useState<BingoPlayer[]>([])
	const [showBingoDialog, setShowBingoDialog] = useState(false)
	const [isMegaBingo, setIsMegaBingo] = useState(false)
	const websocketRef = useRef<ReturnType<typeof useWebSocket> | null>(null)

	const handleMessage = useCallback(
		(message: GameWebSocketMessage) => {
			switch (message.type) {
				case 'game_state_change': {
					const data = message.data as GameStateChangeData
					queryClient.invalidateQueries({
						queryKey: authKeys.detail(friendlyId),
					})
					if (data.status === 'ready' || data.status === 'playing') {
						queryClient.invalidateQueries({
							queryKey: playerBoardKeys.all,
						})
					}
					break
				}

				case 'cell_marked': {
					const data = message.data as CellMarkedData
					const { gameCellId, marked } = data
					queryClient.setQueriesData(
						{ queryKey: playerBoardKeys.all },
						(
							old:
								| { playerBoardCells?: PlayerBoardCellWithGameCell[] }
								| undefined,
						) => {
							if (!old?.playerBoardCells) {
								return old
							}

							const updated = {
								...old,
								playerBoardCells: old.playerBoardCells.map(
									(cell: PlayerBoardCellWithGameCell) =>
										cell.gameCellId === gameCellId
											? {
													...cell,
													gameCell: {
														...cell.gameCell,
														marked: marked,
													},
												}
											: cell,
								),
							}
							return updated
						},
					)
					break
				}

				case 'game_cell_added':
				case 'game_cell_removed':
					queryClient.invalidateQueries({
						queryKey: authKeys.detail(friendlyId),
					})
					break

				case 'players_list_update': {
					const data = message.data as PlayersListUpdateData
					const listTimestamp = message.timestamp || Date.now()

					// Check if this update is newer than the last one
					if (listTimestamp > lastUpdateTimestamp) {
						setLastUpdateTimestamp(listTimestamp)

						// Update the complete players list
						setPlayers(data.players || [])
						setIsLoadingPlayers(false)
					}
					break
				}

				case 'bingo_achieved': {
					const data = message.data as BingoAchievedData
					setBingoPlayers(data.bingoPlayers || [])
					setNewBingoPlayers(data.newBingoPlayers || [])
					setIsMegaBingo(data.isMegaBingo || false)
					setShowBingoDialog(true)
					break
				}
			}
		},
		[queryClient, friendlyId, lastUpdateTimestamp],
	)

	const websocket = useWebSocket<GameWebSocketMessage>(
		friendlyId,
		handleMessage,
	)

	// Store websocket reference for cleanup
	websocketRef.current = websocket

	// Force disconnect when component unmounts or route changes
	useEffect(() => {
		return () => {
			// Force immediate disconnect on component unmount
			if (websocketRef.current?.isConnected) {
				websocketRef.current.disconnect('route_change')
			}
		}
	}, [])

	// Convert players to the format expected by PlayersList
	const connectedPlayers = players.map((player) => ({
		id: player.id,
		name: player.displayName || 'Player',
		isConnected: player.connected,
	}))

	const markCell = (gameCellId: string, marked: boolean) => {
		websocket.send({
			type: 'mark_cell',
			data: {
				gameCellId,
				marked,
			},
		})
	}

	return {
		...websocket,
		connectedPlayers,
		isLoadingPlayers,
		bingoPlayers,
		newBingoPlayers,
		showBingoDialog,
		setShowBingoDialog,
		isMegaBingo,
		markCell,
	}
}
