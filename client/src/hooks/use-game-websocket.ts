import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { authKeys } from './api/games.hooks'
import { playerBoardKeys } from './api/player-boards.hooks'
import { useWebSocket } from './use-websocket'

interface GameWebSocketMessage {
	type:
		| 'game_state_change'
		| 'cell_marked'
		| 'game_cell_added'
		| 'game_cell_removed'
		| 'players_list_update'
		| 'bingo_achieved'
	data: any
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
	const [bingoPlayers, setBingoPlayers] = useState<any[]>([])
	const [newBingoPlayers, setNewBingoPlayers] = useState<any[]>([])
	const [showBingoDialog, setShowBingoDialog] = useState(false)
	const [isMegaBingo, setIsMegaBingo] = useState(false)
	const websocketRef = useRef<any>(null)

	const handleMessage = (message: GameWebSocketMessage) => {
		switch (message.type) {
			case 'game_state_change':
				queryClient.invalidateQueries({
					queryKey: authKeys.detail(friendlyId),
				})
				if (
					message.data.status === 'ready' ||
					message.data.status === 'playing'
				) {
					queryClient.invalidateQueries({
						queryKey: playerBoardKeys.all,
					})
				}
				break

			case 'cell_marked': {
				const { gameCellId, marked } = message.data
				queryClient.setQueriesData(
					{ queryKey: playerBoardKeys.all },
					(old: any) => {
						if (!old?.playerBoardCells) {
							return old
						}

						const updated = {
							...old,
							playerBoardCells: old.playerBoardCells.map((cell: any) =>
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
				const listTimestamp = message.timestamp || Date.now()

				// Check if this update is newer than the last one
				if (listTimestamp > lastUpdateTimestamp) {
					setLastUpdateTimestamp(listTimestamp)

					// Update the complete players list
					setPlayers(message.data.players || [])
					setIsLoadingPlayers(false)
				}
				break
			}

			case 'bingo_achieved':
				setBingoPlayers(message.data.bingoPlayers || [])
				setNewBingoPlayers(message.data.newBingoPlayers || [])
				setIsMegaBingo(message.data.isMegaBingo || false)
				setShowBingoDialog(true)
				break
		}
	}

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
