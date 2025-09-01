import db from '@server/config/database'
import { wsLogger } from '@server/config/websocket-logger'

interface GameConnection {
	gameId: string
	userId: string
	ws: any
	lastActivity: number
	connectedAt: number
}

class WebSocketManager {
	private connections: Map<string, GameConnection> = new Map()
	private gameConnections: Map<string, Set<string>> = new Map()
	private cleanupInterval: NodeJS.Timeout

	constructor() {
		// Run cleanup more frequently for better responsiveness
		this.cleanupInterval = setInterval(() => {
			this.cleanupAbandonedConnections()
		}, 30 * 1000) // Every 30 seconds instead of 5 minutes
	}

	private async broadcastPlayersList(gameId: string) {
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
		
		const playersData = allPlayers.map(pb => ({
			id: pb.player.id,
			displayName: pb.player.displayName,
			connected: pb.connected
		}))
		
		this.broadcastToGame(gameId, {
			type: 'players_list_update',
			data: {
				gameId,
				players: playersData,
			},
			timestamp: Date.now(),
		})
	}

	addConnection(connectionId: string, gameId: string, userId: string, ws: any) {
		const now = Date.now()
		const connection: GameConnection = {
			gameId,
			userId,
			ws,
			lastActivity: now,
			connectedAt: now,
		}

		this.connections.set(connectionId, connection)

		if (!this.gameConnections.has(gameId)) {
			this.gameConnections.set(gameId, new Set())
		}
		this.gameConnections.get(gameId)!.add(connectionId)

		wsLogger.connectionManagerStats(this.connections.size, gameId, this.getGameConnections(gameId))
	}

	removeConnection(connectionId: string) {
		const connection = this.connections.get(connectionId)
		if (connection) {
			const { gameId } = connection
			this.connections.delete(connectionId)

			const gameConns = this.gameConnections.get(gameId)
			if (gameConns) {
				gameConns.delete(connectionId)
				if (gameConns.size === 0) {
					this.gameConnections.delete(gameId)
				}
			}
		}
	}

	removeConnectionByWs(ws: any): GameConnection | null {
		for (const [connectionId, connection] of this.connections) {
			if (connection.ws === ws) {
				const removedConnection = { ...connection } // Copy before removal
				this.removeConnection(connectionId)
				return removedConnection
			}
		}
		return null
	}

	broadcastToGame(gameId: string, message: any, excludeUserId?: string) {
		const gameConns = this.gameConnections.get(gameId)
		if (!gameConns) {
			return
		}

		let sentCount = 0
		for (const connectionId of gameConns) {
			const connection = this.connections.get(connectionId)
			if (connection) {
				if (excludeUserId && connection.userId === excludeUserId) {
					continue
				}
				
				try {
					connection.ws.send(JSON.stringify(message))
					sentCount++
				} catch (error) {
					wsLogger.error(connectionId, 'Failed to send broadcast message', error as Error)
					this.removeConnection(connectionId)
				}
			}
		}
		wsLogger.broadcastMessage(gameId, message.type, sentCount)
	}

	broadcastToUser(userId: string, message: any) {
		for (const [connectionId, connection] of this.connections) {
			if (connection.userId === userId) {
				try {
					connection.ws.send(JSON.stringify(message))
				} catch (error) {
					wsLogger.error(connectionId, `Failed to send message to user ${userId}`, error as Error)
					this.removeConnection(connectionId)
				}
			}
		}
	}

	getGameConnections(gameId: string): number {
		const gameConns = this.gameConnections.get(gameId)
		return gameConns ? gameConns.size : 0
	}

	getAllConnections(): number {
		return this.connections.size
	}

	private async cleanupAbandonedConnections() {
		const now = Date.now()
		const abandonedTimeout = 2 * 60 * 1000 // Reduce from 15 minutes to 2 minutes

		for (const [connectionId, connection] of this.connections) {
			if (now - connection.lastActivity > abandonedTimeout) {
				wsLogger.connectionCleanup(connectionId, 'abandoned_timeout')
				
				this.removeConnection(connectionId)
				
				if (!this.hasActiveConnections(connection.userId, connection.gameId)) {
					try {
						const playerBoardsRepository = await import('@server/repositories/player-boards')
						await playerBoardsRepository.default.setPlayerConnected(connection.userId, connection.gameId, false)
						
						wsLogger.playerDisconnected(connection.userId, connection.gameId, 'abandoned_timeout')
						
						await this.broadcastPlayersList(connection.gameId)
					} catch (error) {
						wsLogger.error(connectionId, 'Failed to handle abandoned connection', error as Error)
					}
				}
			}
		}
	}

	updateActivity(connectionId: string) {
		const connection = this.connections.get(connectionId)
		if (connection) {
			connection.lastActivity = Date.now()
		}
	}

	updateUserActivity(userId: string, gameId: string) {
		for (const connection of this.connections.values()) {
			if (connection.userId === userId && connection.gameId === gameId) {
				connection.lastActivity = Date.now()
			}
		}
	}

	getConnection(connectionId: string): GameConnection | null {
		return this.connections.get(connectionId) || null
	}

	hasActiveConnections(userId: string, gameId: string): boolean {
		for (const connection of this.connections.values()) {
			if (connection.userId === userId && connection.gameId === gameId) {
				return true
			}
		}
		return false
	}
}

export const wsManager = new WebSocketManager()
