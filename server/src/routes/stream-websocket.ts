import { wsLogger } from '@server/config/websocket-logger'
import gamesRepository from '@server/repositories/games'
import playerBoardsRepository from '@server/repositories/player-boards'
import usersRepository from '@server/repositories/users'
import type {
  StreamIncomingMessage,
  StreamOutgoingMessage,
} from '@shared/types/websocket'
import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/bun'
import type { WSContext } from 'hono/ws'

const app = new Hono()

interface StreamConnection {
  userId: string
  connectionId: string
  ws: WSContext
  lastActivity: number
}

const streamConnections = new Map<string, StreamConnection>()

const broadcastToStream = (userId: string, message: StreamOutgoingMessage) => {
  const connection = streamConnections.get(userId)
  if (connection) {
    try {
      connection.ws.send(JSON.stringify(message))
    } catch (error) {
      wsLogger.error(
        connection.connectionId,
        'Failed to send stream message',
        error as Error,
      )
      streamConnections.delete(userId)
    }
  }
}

app.get(
  '/stream',
  upgradeWebSocket(async () => {
    let streamConnection: StreamConnection | null = null

    return {
      onOpen(_event, _ws) {
        wsLogger.connectionOpened('stream', 'stream-pending-auth')
      },

      async onMessage(event, ws) {
        try {
          const data = JSON.parse(
            event.data.toString(),
          ) as StreamIncomingMessage

          if (data.type === 'authenticate_stream' && data.token) {
            try {
              const user = await usersRepository.findByStreamToken(data.token)
              if (!user) {
                ws.send(
                  JSON.stringify({
                    type: 'error',
                    data: { message: 'Invalid stream token' },
                  }),
                )
                ws.close()
                return
              }

              const connectionId = `stream-${user.id}-${Date.now()}`
              streamConnection = {
                userId: user.id,
                connectionId,
                ws,
                lastActivity: Date.now(),
              }

              streamConnections.set(user.id, streamConnection)
              wsLogger.connectionAuthenticated(connectionId, user.id, 'stream')

              ws.send(
                JSON.stringify({
                  type: 'authenticated',
                  data: { connectionId, userId: user.id },
                }),
              )

              const displayGame = await gamesRepository.getDisplayOnStreamGame(
                user.id,
              )

              if (displayGame) {
                const creatorPlayerBoard =
                  await playerBoardsRepository.getByGameAndPlayer(
                    displayGame.id,
                    user.id,
                  )

                if (creatorPlayerBoard) {
                  ws.send(
                    JSON.stringify({
                      type: 'stream_game_update',
                      data: {
                        gameId: displayGame.id,
                        gameTitle: displayGame.title,
                        playerBoard: creatorPlayerBoard,
                      },
                    }),
                  )
                } else {
                  ws.send(
                    JSON.stringify({
                      type: 'no_stream_game',
                    }),
                  )
                }
              } else {
                ws.send(
                  JSON.stringify({
                    type: 'no_stream_game',
                  }),
                )
              }
            } catch (error) {
              wsLogger.error(
                'stream-connection',
                'Stream authentication failed',
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
          } else if (data.type === 'ping') {
            if (streamConnection) {
              streamConnection.lastActivity = Date.now()
            }
          }
        } catch (error) {
          wsLogger.error(
            streamConnection?.connectionId || 'unknown',
            'Error processing stream WebSocket message',
            error as Error,
          )
        }
      },

      async onClose(_event, _ws) {
        if (streamConnection) {
          wsLogger.connectionClosed(
            streamConnection.connectionId,
            'stream_disconnect',
          )
          streamConnections.delete(streamConnection.userId)
        }
      },

      async onError(event, _ws) {
        const errorType = event.type || 'unknown_error'
        const connectionId = streamConnection?.connectionId || 'unknown'
        wsLogger.error(
          connectionId,
          `Stream WebSocket error (${errorType})`,
          event as unknown as Error,
        )

        if (streamConnection) {
          streamConnections.delete(streamConnection.userId)
        }
      },
    }
  }),
)

export const broadcastGameUpdateToStream = async (
  userId: string,
  gameId: string,
) => {
  const connection = streamConnections.get(userId)
  if (!connection) return

  try {
    const displayGame = await gamesRepository.getDisplayOnStreamGame(userId)

    if (displayGame && displayGame.id === gameId) {
      const creatorPlayerBoard =
        await playerBoardsRepository.getByGameAndPlayer(gameId, userId)

      if (creatorPlayerBoard) {
        broadcastToStream(userId, {
          type: 'stream_game_update',
          data: {
            gameId: displayGame.id,
            gameTitle: displayGame.title,
            playerBoard: creatorPlayerBoard,
          },
        })
      }
    }
  } catch (error) {
    wsLogger.error(
      connection.connectionId,
      'Failed to broadcast game update to stream',
      error as Error,
    )
  }
}

export const broadcastNoGameToStream = async (userId: string) => {
  broadcastToStream(userId, {
    type: 'no_stream_game',
  })
}

setInterval(() => {
  const now = Date.now()
  const timeout = 5 * 60 * 1000

  for (const [userId, connection] of streamConnections.entries()) {
    if (now - connection.lastActivity > timeout) {
      wsLogger.connectionCleanup(connection.connectionId, 'stream_timeout')
      try {
        connection.ws.close()
      } catch (_error) {}
      streamConnections.delete(userId)
    }
  }
}, 60 * 1000)

export default app
