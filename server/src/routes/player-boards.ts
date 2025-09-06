import { jwtAuth } from '@server/middlewares/jwt-auth'
import gamesRepository from '@server/repositories/games'
import playerBoardsRepository from '@server/repositories/player-boards'
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from './utils'

const app = new Hono()

app.use('*', jwtAuth)

const PlayerBoardIdSchema = z.object({
  id: z.string().uuid(),
})

app.patch(
  '/:id/shuffle',
  zValidator('param', PlayerBoardIdSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('currentUser')

    const playerBoard = await playerBoardsRepository.findById(id)
    if (!playerBoard) {
      return c.json({ error: 'Player board not found' }, 404)
    }

    if (playerBoard.playerId !== user.id) {
      return c.json({ error: 'Access denied' }, 403)
    }

    const game = await gamesRepository.getById(playerBoard.gameId)
    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    if (game.status !== 'ready') {
      return c.json(
        { error: 'Player board can only be shuffled when game is ready' },
        400,
      )
    }

    try {
      await playerBoardsRepository.shufflePlayerBoard(user.id, game.id)

      const updatedPlayerBoard =
        await playerBoardsRepository.getPlayerBoardWithCells(user.id, game.id)

      if (!updatedPlayerBoard) {
        return c.json({ error: 'Player board not found after shuffle' }, 404)
      }

      return c.json(updatedPlayerBoard, 200)
    } catch (error) {
      console.error('Failed to shuffle player board:', error)
      return c.json({ error: 'Failed to shuffle player board' }, 500)
    }
  },
)

export default app
