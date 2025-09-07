import { and, asc, desc, eq, ne } from 'drizzle-orm'
import type {
  CreateTemplateRequest,
  Template,
  TemplateWithCells,
  TemplateWithCreator,
} from 'shared'
import db from '../config/database'
import { games, templateCells, templates } from '../schemas'

export const templateRepository = {
  async create(userId: string, data: CreateTemplateRequest): Promise<Template> {
    return await db.transaction(async (tx) => {
      try {
        const [template] = await tx
          .insert(templates)
          .values({
            name: data.name,
            description: data.description || null,
            creatorId: userId,
          })
          .returning()

        if (!template) {
          throw new Error('Failed to create template')
        }

        await tx.insert(templateCells).values(
          data.cellIds.map((cellId, index) => ({
            templateId: template.id,
            cellId,
            position: index,
          })),
        )

        return template
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === '23505' &&
          'constraint' in error &&
          error.constraint === 'templates_name_creator_unique'
        ) {
          throw new Error(`Template name '${data.name}' already exists`)
        }
        throw error
      }
    })
  },

  async getByUserId(userId: string): Promise<TemplateWithCreator[]> {
    return await db.query.templates.findMany({
      where: eq(templates.creatorId, userId),
      with: {
        creator: true,
      },
      orderBy: desc(templates.createdAt),
    })
  },

  async existsByName(
    name: string,
    userId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const conditions = [
      eq(templates.name, name),
      eq(templates.creatorId, userId),
    ]

    if (excludeId) {
      conditions.push(ne(templates.id, excludeId))
    }

    const existing = await db.query.templates.findFirst({
      where: and(...conditions),
    })

    return !!existing
  },

  async getByIdWithCells(
    templateId: string,
    userId: string,
  ): Promise<TemplateWithCells | null> {
    const template = await db.query.templates.findFirst({
      where: and(eq(templates.id, templateId), eq(templates.creatorId, userId)),
      with: {
        creator: true,
        templateCells: {
          with: {
            cell: {
              columns: {
                id: true,
                value: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: asc(templateCells.position),
        },
      },
    })

    return template || null
  },

  async update(
    templateId: string,
    userId: string,
    data: CreateTemplateRequest,
  ): Promise<Template | null> {
    return await db.transaction(async (tx) => {
      try {
        const [updatedTemplate] = await tx
          .update(templates)
          .set({
            name: data.name,
            description: data.description || null,
            updatedAt: new Date(),
          })
          .where(
            and(eq(templates.id, templateId), eq(templates.creatorId, userId)),
          )
          .returning()

        if (!updatedTemplate) {
          return null
        }

        await tx
          .delete(templateCells)
          .where(eq(templateCells.templateId, templateId))

        await tx.insert(templateCells).values(
          data.cellIds.map((cellId, index) => ({
            templateId: templateId,
            cellId,
            position: index,
          })),
        )

        return updatedTemplate
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === '23505' &&
          'constraint' in error &&
          error.constraint === 'templates_name_creator_unique'
        ) {
          throw new Error(`Template name '${data.name}' already exists`)
        }
        throw error
      }
    })
  },

  async isUsedInGames(templateId: string): Promise<boolean> {
    const game = await db.query.games.findFirst({
      where: eq(games.currentTemplateId, templateId),
    })
    return !!game
  },

  async isUsedInNonDraftGames(templateId: string): Promise<boolean> {
    const nonDraftGames = await db.query.games.findMany({
      where: and(
        eq(games.currentTemplateId, templateId),
        ne(games.status, 'draft'),
      ),
    })
    return nonDraftGames.length > 0
  },

  async delete(templateId: string, userId: string): Promise<boolean> {
    const isUsedInNonDraft = await this.isUsedInNonDraftGames(templateId)
    if (isUsedInNonDraft) {
      throw new Error('Cannot delete template that is used in non-draft games')
    }

    const result = await db
      .delete(templates)
      .where(and(eq(templates.id, templateId), eq(templates.creatorId, userId)))

    return (result.rowCount ?? 0) > 0
  },

  async applyToGame(
    templateId: string,
    _gameId: string,
    userId: string,
  ): Promise<string[]> {
    const template = await this.getByIdWithCells(templateId, userId)
    if (!template) {
      throw new Error('Template not found')
    }

    if (template.templateCells.length !== 25) {
      throw new Error('Template must have exactly 25 cells')
    }

    return template.templateCells
      .sort((a, b) => a.position - b.position)
      .map((tc) => tc.cellId)
  },
}
