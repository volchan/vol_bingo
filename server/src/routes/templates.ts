import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import db from '../config/database'
import { jwtAuth } from '../middlewares/jwt-auth'
import { gameCellRepository } from '../repositories/game-cells'
import gameRepository from '../repositories/games'
import { templateRepository } from '../repositories/templates'

const templates = new Hono()

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  cellIds: z.array(z.string()).length(25),
  gameId: z.string().optional(),
})

const applyTemplateSchema = z.object({
  templateId: z.string(),
})

templates.use(jwtAuth)

templates.post('/', zValidator('form', createTemplateSchema), async (c) => {
  const user = c.get('currentUser')
  const data = c.req.valid('form')

  try {
    const template = await templateRepository.create(user.id, data)

    if (data.gameId) {
      const game = await gameRepository.getByFriendlyId(data.gameId)
      if (game) {
        await gameRepository.update({ ...game, currentTemplateId: template.id })
      }
    }

    return c.json(template)
  } catch (_error) {
    return c.json({ message: 'Failed to create template' }, 500)
  }
})

templates.get('/', async (c) => {
  const user = c.get('currentUser')

  try {
    const userTemplates = await templateRepository.getByUserId(user.id)

    const templatesWithUsage = await Promise.all(
      userTemplates.map(async (template) => {
        const isUsedInGames = await templateRepository.isUsedInGames(
          template.id,
        )
        const isUsedInNonDraftGames =
          await templateRepository.isUsedInNonDraftGames(template.id)

        return {
          ...template,
          isUsedInGames,
          isUsedInNonDraftGames,
          canDelete: !isUsedInNonDraftGames,
          canEdit: true,
        }
      }),
    )

    return c.json(templatesWithUsage)
  } catch (_error) {
    return c.json({ message: 'Failed to fetch templates' }, 500)
  }
})

const checkNameSchema = z.object({
  name: z.string().min(1),
  excludeId: z.string().optional(),
})

templates.get(
  '/check-name',
  zValidator('query', checkNameSchema),
  async (c) => {
    const user = c.get('currentUser')
    const { name, excludeId } = c.req.valid('query')

    try {
      const exists = await templateRepository.existsByName(
        name,
        user.id,
        excludeId,
      )
      return c.json({ exists })
    } catch (_error) {
      return c.json({ message: 'Failed to check template name' }, 500)
    }
  },
)

templates.get('/:id', async (c) => {
  const user = c.get('currentUser')
  const templateId = c.req.param('id')

  try {
    const template = await templateRepository.getByIdWithCells(
      templateId,
      user.id,
    )
    if (!template) {
      return c.json({ message: 'Template not found' }, 404)
    }
    return c.json(template)
  } catch (_error) {
    return c.json({ message: 'Failed to fetch template' }, 500)
  }
})

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  cellIds: z.array(z.string()).length(25),
})

templates.put('/:id', zValidator('form', updateTemplateSchema), async (c) => {
  const user = c.get('currentUser')
  const templateId = c.req.param('id')
  const data = c.req.valid('form')

  try {
    const updated = await templateRepository.update(templateId, user.id, data)
    if (!updated) {
      return c.json({ message: 'Template not found' }, 404)
    }
    return c.json(updated)
  } catch (_error) {
    return c.json({ message: 'Failed to update template' }, 500)
  }
})

templates.delete('/:id', async (c) => {
  const user = c.get('currentUser')
  const templateId = c.req.param('id')

  try {
    const deleted = await templateRepository.delete(templateId, user.id)
    if (!deleted) {
      return c.json(
        {
          message:
            'Template not found or you do not have permission to delete it',
        },
        404,
      )
    }
    return c.json({ message: 'Template deleted successfully' })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete template'
    return c.json({ message }, 400)
  }
})

templates.post(
  '/apply/:gameId',
  zValidator('form', applyTemplateSchema),
  async (c) => {
    const user = c.get('currentUser')
    const gameId = c.req.param('gameId')
    const { templateId } = c.req.valid('form')

    try {
      const game = await gameRepository.getByFriendlyId(gameId)
      if (!game) {
        return c.json({ message: 'Game not found' }, 404)
      }

      if (game.creatorId !== user.id) {
        return c.json(
          { message: 'Only the game creator can apply templates' },
          403,
        )
      }

      if (game.status !== 'draft') {
        return c.json(
          { message: 'Can only apply templates to draft games' },
          400,
        )
      }

      await db.transaction(async (tx) => {
        const cellIds = await templateRepository.applyToGame(
          templateId,
          game.id,
          user.id,
        )

        await gameCellRepository.applyTemplate(game.id, cellIds, templateId, tx)

        await gameRepository.update(
          { ...game, currentTemplateId: templateId },
          tx,
        )
      })

      return c.json({ message: 'Template applied successfully' })
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ message: error.message }, 400)
      }
      return c.json({ message: 'Failed to apply template' }, 500)
    }
  },
)

export default templates
