import db from '@server/config/database'
import { jwtAuth } from '@server/middlewares/jwt-auth'
import gameCellRepository from '@server/repositories/game-cells'
import gamesRepository, {
  type CreateGameData,
} from '@server/repositories/games'
import playerBoardsRepository from '@server/repositories/player-boards'
import {
  broadcastGameUpdateToStream,
  broadcastNoGameToStream,
} from '@server/routes/websocket'
import { wsManager } from '@server/websocket/websocket-manager'
import type { Game } from '@shared/types'
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from './utils'

const app = new Hono()

app.use('*', jwtAuth)

app.get('/', async (c) => {
  const games = await gamesRepository.getAll(c.get('currentUser').id)
  if (!games) {
    return c.json({ error: 'Failed to fetch games' }, 500)
  }

  return c.json(games, 200)
})

const GameDetailSchema = z.object({
  friendlyId: z.string(),
})

app.get('/:friendlyId', zValidator('param', GameDetailSchema), async (c) => {
  const { friendlyId } = c.req.valid('param')
  const user = c.get('currentUser')
  const game = await gamesRepository.getByFriendlyId(friendlyId)

  if (!game) {
    return c.json({ error: 'Game not found' }, 404)
  }

  const playerBoard = await playerBoardsRepository.createIfNotExists({
    playerId: user.id,
    gameId: game.id,
  })

  if (game.status === 'ready' || game.status === 'playing') {
    const existingCells = await db.query.playerBoardCells.findFirst({
      where: (table, { eq }) => eq(table.playerBoardId, playerBoard.id),
    })

    if (!existingCells) {
      await playerBoardsRepository.initializePlayerBoardCells(
        playerBoard.id,
        game.id,
      )
    }
  }

  return c.json(game, 200)
})

app.get(
  '/:friendlyId/cells',
  zValidator('param', GameDetailSchema),
  async (c) => {
    const { friendlyId } = c.req.valid('param')
    const user = c.get('currentUser')
    const game = await gamesRepository.getByFriendlyId(friendlyId, user.id)

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    if (game.status !== 'playing') {
      return c.json({ error: 'Game is not playing' }, 400)
    }

    const cells = await gameCellRepository.getAllByGameId(game.id)

    return c.json(cells, 200)
  },
)

app.patch(
  '/:friendlyId/ready',
  zValidator('param', GameDetailSchema),
  async (c) => {
    const { friendlyId } = c.req.valid('param')
    const user = c.get('currentUser')
    const game = await gamesRepository.getByFriendlyId(friendlyId, user.id)

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    if (game.creatorId !== user.id) {
      return c.json(
        { error: 'Only the game creator can make the game ready' },
        403,
      )
    }

    if (game.status !== 'draft') {
      return c.json({ error: 'Game cannot be made ready' }, 400)
    }

    const gameCells = await gameCellRepository.getAllByGameId(game.id)
    if (gameCells.length !== 25) {
      return c.json(
        {
          error: `Game needs exactly 25 cells to be ready. Currently has ${gameCells.length} cells.`,
        },
        400,
      )
    }

    let updatedGame: Game | null = null
    await db.transaction(async (tx) => {
      updatedGame = await gamesRepository.update(
        {
          ...game,
          status: 'ready',
        },
        tx,
      )

      await playerBoardsRepository.clearAllPlayerBoardCells(game.id, tx)

      const existingPlayerBoards = await tx.query.playerBoards.findMany({
        where: (table, { eq }) => eq(table.gameId, game.id),
      })

      for (const playerBoard of existingPlayerBoards) {
        await playerBoardsRepository.initializePlayerBoardCells(
          playerBoard.id,
          game.id,
          tx,
        )
      }
    })

    if (!updatedGame) {
      return c.json({ error: 'Failed to make game ready' }, 500)
    }

    wsManager.broadcastToGame(game.id, {
      type: 'game_state_change',
      data: {
        gameId: game.id,
        friendlyId: game.friendlyId,
        status: 'ready',
        linkedCellsCount: gameCells.length,
      },
      timestamp: Date.now(),
    })

    return c.json(updatedGame, 200)
  },
)

app.patch(
  '/:friendlyId/start',
  zValidator('param', GameDetailSchema),
  async (c) => {
    const { friendlyId } = c.req.valid('param')
    const user = c.get('currentUser')
    const game = await gamesRepository.getByFriendlyId(friendlyId, user.id)

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    if (game.creatorId !== user.id) {
      return c.json({ error: 'Only the game creator can start the game' }, 403)
    }

    if (game.status !== 'ready') {
      return c.json({ error: 'Game must be in ready state to start' }, 400)
    }

    const updatedGame = await gamesRepository.update({
      ...game,
      status: 'playing',
    })

    if (!updatedGame) {
      return c.json({ error: 'Failed to start game' }, 500)
    }

    wsManager.broadcastToGame(game.id, {
      type: 'game_state_change',
      data: {
        gameId: game.id,
        friendlyId: game.friendlyId,
        status: 'playing',
      },
      timestamp: Date.now(),
    })

    return c.json(updatedGame, 200)
  },
)

app.patch(
  '/:friendlyId/edit',
  zValidator('param', GameDetailSchema),
  async (c) => {
    const { friendlyId } = c.req.valid('param')
    const user = c.get('currentUser')
    const game = await gamesRepository.getByFriendlyId(friendlyId, user.id)

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    if (game.creatorId !== user.id) {
      return c.json({ error: 'Only the game creator can edit the game' }, 403)
    }

    if (game.status !== 'ready') {
      return c.json({ error: 'Game must be in ready state to edit' }, 400)
    }

    let updatedGame: Game | null = null
    await db.transaction(async (tx) => {
      updatedGame = await gamesRepository.update(
        {
          ...game,
          status: 'draft',
        },
        tx,
      )

      await playerBoardsRepository.clearAllPlayerBoardCells(game.id, tx)
    })

    if (!updatedGame) {
      return c.json({ error: 'Failed to switch game to edit mode' }, 500)
    }

    wsManager.broadcastToGame(game.id, {
      type: 'game_state_change',
      data: {
        gameId: game.id,
        friendlyId: game.friendlyId,
        status: 'draft',
      },
    })

    return c.json(updatedGame, 200)
  },
)

const DisplayOnStreamSchema = z.object({
  displayOnStream: z.boolean(),
})

const GameIdSchema = z.object({
  gameId: z.string(),
})

app.patch(
  '/:gameId/display_on_stream',
  zValidator('param', GameIdSchema),
  zValidator('json', DisplayOnStreamSchema),
  async (c) => {
    const { gameId } = c.req.valid('param')
    const { displayOnStream } = c.req.valid('json')
    const user = c.get('currentUser')

    const game = await gamesRepository.getById(gameId)
    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    if (game.creatorId !== user.id) {
      return c.json(
        { error: 'Only the game creator can change stream settings' },
        403,
      )
    }

    if (game.status === 'draft') {
      return c.json({ error: 'Cannot display draft games on stream' }, 400)
    }

    try {
      const updatedGame = await gamesRepository.setDisplayOnStream(
        gameId,
        user.id,
        displayOnStream,
      )

      // Broadcast to stream integration
      if (displayOnStream) {
        await broadcastGameUpdateToStream(user.id, gameId)
      } else {
        await broadcastNoGameToStream(user.id)
      }

      return c.json(updatedGame, 200)
    } catch (error) {
      console.error('Error setting display on stream:', error)
      return c.json({ error: 'Failed to update stream settings' }, 500)
    }
  },
)

app.get(
  '/:friendlyId/players',
  zValidator('param', GameDetailSchema),
  async (c) => {
    const { friendlyId } = c.req.valid('param')
    const game = await gamesRepository.getByFriendlyId(friendlyId)

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    const players = await db.query.playerBoards.findMany({
      where: (table, { eq }) => eq(table.gameId, game.id),
      with: {
        player: {
          columns: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    return c.json(
      players.map((pb) => ({
        id: pb.player.id,
        displayName: pb.player.displayName,
        connected: pb.connected,
      })),
      200,
    )
  },
)

app.get(
  '/:friendlyId/player-board',
  zValidator('param', GameDetailSchema),
  async (c) => {
    const { friendlyId } = c.req.valid('param')
    const user = c.get('currentUser')
    const game = await gamesRepository.getByFriendlyId(friendlyId)

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    if (game.status === 'draft') {
      return c.json(
        { error: 'Player board not available until game is ready' },
        400,
      )
    }

    const playerBoard = await playerBoardsRepository.getPlayerBoardWithCells(
      user.id,
      game.id,
    )

    if (!playerBoard) {
      return c.json({ error: 'Player board not found' }, 404)
    }

    return c.json(playerBoard, 200)
  },
)

const CreateGameSchema = z.object({
  title: z.string().min(1),
})

app.post('/', zValidator('form', CreateGameSchema), async (c) => {
  const data = c.req.valid('form') as CreateGameData
  const user = c.get('currentUser')

  data.creatorId = user.id

  let newGame: Game | null = null
  await db.transaction(async (tx) => {
    newGame = await gamesRepository.create(data, tx)
    await playerBoardsRepository.create(
      { playerId: user.id, gameId: newGame.id },
      tx,
    )
  })

  if (!newGame) {
    return c.json({ error: 'Failed to create game' }, 500)
  }

  return c.json(newGame, 201)
})

export default app
