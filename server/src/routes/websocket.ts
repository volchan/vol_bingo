import db from '@server/config/database'
import { wsLogger } from '@server/config/websocket-logger'
import gameCellRepository from '@server/repositories/game-cells'
import gamesRepository from '@server/repositories/games'
import playerBoardsRepository from '@server/repositories/player-boards'
import usersRepository from '@server/repositories/users'
import { verifyJWT } from '@server/utils/jwt'
import { wsManager } from '@server/websocket/websocket-manager'
import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/bun'

const app = new Hono()

interface BingoResult {
	playerId: string
	playerBoardId: string
	playerName: string
	bingoCount: number
	isMegaBingo: boolean
}

interface PlayerBoardCellForBingo {
	position: number
	gameCell?: {
		marked?: boolean
	} | null
}

async function broadcastPlayersList(gameId: string) {
	const allPlayers = await db.query.playerBoards.findMany({
		where: (table, { eq }) => eq(table.gameId, gameId),
		with: {
			player: {
				columns: {
					id: true,
					displayName: true,
				},
			},
		},
	})

	const playersData = allPlayers.map((pb) => ({
		id: pb.player.id,
		displayName: pb.player.displayName,
		connected: pb.connected,
	}))

	wsManager.broadcastToGame(gameId, {
		type: 'players_list_update',
		data: {
			gameId,
			players: playersData,
		},
		timestamp: Date.now(),
	})
}

const checkForBingo = async (gameId: string, size: number = 5) => {
	const playerBoards = await playerBoardsRepository.getAllForGame(gameId)
	const bingoResults = []

	for (const playerBoard of playerBoards) {
		if (!playerBoard.playerBoardCells) continue

		const cells = playerBoard.playerBoardCells
		const result = checkBingoPattern(cells, size)

		if (result.hasBingo) {
			bingoResults.push({
				playerId: playerBoard.playerId,
				playerBoardId: playerBoard.id,
				playerName: playerBoard.player?.displayName || 'Player',
				bingoCount: result.bingoCount,
				isMegaBingo: result.isMegaBingo,
			})
		}
	}

	return bingoResults
}

const checkForBingoBefore = async (
	gameId: string,
	excludeGameCellId: string,
	size: number = 5,
) => {
	const playerBoards = await playerBoardsRepository.getAllForGame(gameId)
	const bingoResults = []

	for (const playerBoard of playerBoards) {
		if (!playerBoard.playerBoardCells) continue

		const cellsWithoutCurrent = playerBoard.playerBoardCells.filter(
			(cell) => cell.gameCellId !== excludeGameCellId,
		)

		const result = checkBingoPattern(cellsWithoutCurrent, size)

		if (result.hasBingo) {
			bingoResults.push({
				playerId: playerBoard.playerId,
				playerBoardId: playerBoard.id,
				playerName: playerBoard.player?.displayName || 'Player',
				bingoCount: result.bingoCount,
				isMegaBingo: result.isMegaBingo,
			})
		}
	}

	return bingoResults
}

const getNewBingos = (
	previousResults: BingoResult[],
	currentResults: BingoResult[],
) => {
	const newBingos = []

	for (const current of currentResults) {
		const previous = previousResults.find(
			(p) => p.playerId === current.playerId,
		)

		if (!previous) {
			newBingos.push(current)
		} else if (
			current.bingoCount > previous.bingoCount ||
			(current.isMegaBingo && !previous.isMegaBingo)
		) {
			newBingos.push(current)
		}
	}

	return newBingos
}

const checkBingoPattern = (
	cells: PlayerBoardCellForBingo[],
	size: number = 5,
) => {
	const grid = Array(size)
		.fill(null)
		.map(() => Array(size).fill(false))

	cells.forEach((cell) => {
		const row = Math.floor(cell.position / size)
		const col = cell.position % size
		if (row >= 0 && row < size && col >= 0 && col < size && grid[row]) {
			grid[row][col] = cell.gameCell?.marked || false
		}
	})

	let bingoCount = 0

	for (let row = 0; row < size; row++) {
		if (grid[row] && grid[row]!.every((cell) => cell)) {
			bingoCount++
		}
	}

	for (let col = 0; col < size; col++) {
		if (grid.every((row) => row?.[col])) {
			bingoCount++
		}
	}

	if (grid.every((row, i) => row?.[i])) {
		bingoCount++
	}

	if (grid.every((row, i) => row?.[size - 1 - i])) {
		bingoCount++
	}

	const isMegaBingo = grid.every((row) => row?.every((cell) => cell))

	return {
		hasBingo: bingoCount > 0,
		bingoCount,
		isMegaBingo,
	}
}

function getDisconnectReason(code: number, reason: string): string {
	if (reason) return reason
	switch (code) {
		case 1000:
			return 'normal_close'
		case 1001:
			return 'going_away'
		case 1002:
			return 'protocol_error'
		case 1003:
			return 'unsupported_data'
		case 1006:
			return 'abnormal_close'
		case 1011:
			return 'server_error'
		case 1012:
			return 'server_restart'
		case 1013:
			return 'try_again_later'
		default:
			return `unknown_code_${code}`
	}
}

app.get(
	'/games/:friendlyId',
	upgradeWebSocket(async (c) => {
		const friendlyId = c.req.param('friendlyId')

		if (!friendlyId) {
			throw new Error('Game friendly ID is required')
		}

		const game = await gamesRepository.getByFriendlyId(friendlyId)
		if (!game) {
			throw new Error('Game not found')
		}
		const gameId = game.id

		let currentConnectionId: string | null = null
		let isGracefulClose = false

		return {
			onOpen(_event, _ws) {
				wsLogger.connectionOpened(gameId, `${gameId}-pending-auth`)
			},

			async onMessage(event, ws) {
				try {
					const data = JSON.parse(event.data.toString())

					if (data.type === 'disconnect') {
						const reason = data.reason || 'unknown'

						isGracefulClose = true

						const removedConnection = currentConnectionId
							? wsManager.getConnection(currentConnectionId)
							: null

						if (removedConnection && currentConnectionId) {
							wsLogger.connectionClosed(currentConnectionId, reason)

							wsManager.removeConnection(currentConnectionId)

							if (
								!wsManager.hasActiveConnections(
									removedConnection.userId,
									removedConnection.gameId,
								)
							) {
								await playerBoardsRepository.setPlayerConnected(
									removedConnection.userId,
									removedConnection.gameId,
									false,
								)
								wsLogger.playerDisconnected(
									removedConnection.userId,
									removedConnection.gameId,
									reason,
								)
								await broadcastPlayersList(removedConnection.gameId)
							}
						}

						ws.close(1000, `Graceful disconnect: ${reason}`)
						return
					}

					if (currentConnectionId) {
						wsManager.updateActivity(currentConnectionId)
					}

					if (data.type === 'ping') {
						return
					}

					if (data.type === 'mark_cell' && data.data) {
						try {
							const { gameCellId, marked } = data.data
							const connection = currentConnectionId
								? wsManager.getConnection(currentConnectionId)
								: null

							if (!connection) {
								ws.send(
									JSON.stringify({
										type: 'error',
										data: { message: 'Connection not found' },
									}),
								)
								return
							}

							const gameCell = await gameCellRepository.getById(gameCellId)
							if (!gameCell) {
								ws.send(
									JSON.stringify({
										type: 'error',
										data: { message: 'Game cell not found' },
									}),
								)
								return
							}

							const game = await gamesRepository.getById(gameCell.gameId)
							if (!game) {
								ws.send(
									JSON.stringify({
										type: 'error',
										data: { message: 'Game not found' },
									}),
								)
								return
							}

							if (game.status !== 'playing') {
								ws.send(
									JSON.stringify({
										type: 'error',
										data: { message: 'Can only mark cells during gameplay' },
									}),
								)
								return
							}

							if (game.creatorId !== connection.userId) {
								ws.send(
									JSON.stringify({
										type: 'error',
										data: { message: 'Only the game creator can mark cells' },
									}),
								)
								return
							}

							const updatedGameCell = await gameCellRepository.markCell(
								gameCellId,
								marked,
							)
							if (!updatedGameCell) {
								ws.send(
									JSON.stringify({
										type: 'error',
										data: { message: 'Failed to mark cell' },
									}),
								)
								return
							}

							wsManager.broadcastToGame(game.id, {
								type: 'cell_marked',
								data: {
									gameId: game.id,
									gameCellId,
									marked,
								},
							})

							if (marked) {
								const previousBingoResults = await checkForBingoBefore(
									game.id,
									gameCellId,
								)
								const currentBingoResults = await checkForBingo(game.id)

								const newBingos = getNewBingos(
									previousBingoResults,
									currentBingoResults,
								)

								if (newBingos.length > 0) {
									const hasMegaBingo = currentBingoResults.some(
										(player) => player.isMegaBingo,
									)

									wsManager.broadcastToGame(game.id, {
										type: 'bingo_achieved',
										data: {
											gameId: game.id,
											bingoPlayers: currentBingoResults,
											newBingoPlayers: newBingos,
											isMegaBingo: hasMegaBingo,
										},
									})
								}
							}
						} catch (error) {
							wsLogger.error(
								currentConnectionId || undefined,
								'Error processing mark_cell message',
								error as Error,
							)
							ws.send(
								JSON.stringify({
									type: 'error',
									data: { message: 'Failed to mark cell' },
								}),
							)
						}
					} else if (data.type === 'authenticate' && data.token) {
						try {
							const payload = await verifyJWT(data.token)
							const userId = payload.userId as string

							const _user = await usersRepository.findById(userId)

							const connectionId = `${gameId}-${userId}-${Date.now()}`
							currentConnectionId = connectionId

							wsManager.addConnection(connectionId, gameId, userId, ws)
							wsLogger.connectionAuthenticated(connectionId, userId, gameId)

							await playerBoardsRepository.setPlayerConnected(
								userId,
								gameId,
								true,
							)

							ws.send(
								JSON.stringify({
									type: 'authenticated',
									data: { connectionId, userId },
								}),
							)

							const allPlayers = await db.query.playerBoards.findMany({
								where: (table, { eq }) => eq(table.gameId, gameId),
								with: {
									player: {
										columns: {
											id: true,
											displayName: true,
										},
									},
								},
							})

							const playersData = allPlayers.map((pb) => ({
								id: pb.player.id,
								displayName: pb.player.displayName,
								connected: pb.connected,
							}))

							ws.send(
								JSON.stringify({
									type: 'players_list_update',
									data: {
										gameId,
										players: playersData,
									},
									timestamp: Date.now(),
								}),
							)

							await broadcastPlayersList(gameId)
						} catch (error) {
							wsLogger.error(
								currentConnectionId || undefined,
								'Authentication failed',
								error as Error,
							)
							ws.send(
								JSON.stringify({
									type: 'error',
									data: { message: 'Authentication failed' },
								}),
							)
							ws.close()
						}
					}
				} catch (error) {
					wsLogger.error(
						currentConnectionId || undefined,
						'Error processing WebSocket message',
						error as Error,
					)
				}
			},

			async onClose(event, ws) {
				const disconnectReason = getDisconnectReason(event.code, event.reason)

				if (isGracefulClose) {
					return
				}

				const removedConnection = wsManager.removeConnectionByWs(ws)

				if (removedConnection) {
					wsLogger.connectionClosed(
						currentConnectionId || 'unknown',
						disconnectReason,
						event.code,
					)
					if (
						!wsManager.hasActiveConnections(
							removedConnection.userId,
							removedConnection.gameId,
						)
					) {
						await playerBoardsRepository.setPlayerConnected(
							removedConnection.userId,
							removedConnection.gameId,
							false,
						)
						wsLogger.playerDisconnected(
							removedConnection.userId,
							removedConnection.gameId,
							disconnectReason,
						)
						await broadcastPlayersList(removedConnection.gameId)
					}
				}
			},

			async onError(event, ws) {
				const errorType = event.type || 'unknown_error'
				wsLogger.error(
					currentConnectionId || undefined,
					`WebSocket error (${errorType})`,
					event as unknown as Error,
				)
				const removedConnection = wsManager.removeConnectionByWs(ws)

				if (removedConnection) {
					if (
						!wsManager.hasActiveConnections(
							removedConnection.userId,
							removedConnection.gameId,
						)
					) {
						await playerBoardsRepository.setPlayerConnected(
							removedConnection.userId,
							removedConnection.gameId,
							false,
						)
						wsLogger.playerDisconnected(
							removedConnection.userId,
							removedConnection.gameId,
							errorType,
						)
						await broadcastPlayersList(removedConnection.gameId)
					}
				}
			},
		}
	}),
)

export default app
