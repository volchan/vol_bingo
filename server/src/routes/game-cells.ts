import { authMiddleware } from '@server/middlewares'
import gameCellRepository from '@server/repositories/game-cells'
import { wsManager } from '@server/websocket/websocket-manager'
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from './utils'

const app = new Hono()

const CellLinkSchema = z.object({
  id: z.string(),
})

app.use('*', authMiddleware)

app.delete('/:id', zValidator('param', CellLinkSchema), async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('currentUser')

  try {
    const cell = await gameCellRepository.getById(id, user.id)
    if (!cell) {
      return c.json({ error: 'Cell not found' }, 404)
    }

    const gameId = cell.gameId
    await gameCellRepository.delete(id)

    const gameCells = await gameCellRepository.getAllByGameId(gameId)

    wsManager.broadcastToGame(gameId, {
      type: 'game_cell_removed',
      data: {
        gameId,
        cellValue: cell.cell?.value || '',
        linkedCellsCount: gameCells.length,
      },
    })

    return c.json({ message: 'Cell unlinked successfully' }, 200)
  } catch (error) {
    console.error('Error unlinking cell:', error)
    return c.json({ error: 'Failed to unlink cell' }, 500)
  }
})

export default app
