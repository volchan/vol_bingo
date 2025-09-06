import db from '@server/config/database'
import { games } from '@server/schemas'
import type { Game } from '@shared/types/models/game'
import { eq } from 'drizzle-orm'
import type { DbTransaction } from './utils'

export type CreateGameData = Omit<Game, 'id' | 'createdAt' | 'updatedAt'>

const generateSecureRandomString = async (): Promise<string> => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const length = 10
  const maxAttempts = 10

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    const randomString = Array.from(
      array,
      (byte) => chars[byte % chars.length],
    ).join('')

    const existingFriendlyId = await db.query.games.findFirst({
      where: (table, { eq }) => eq(table.friendlyId, randomString),
    })

    if (!existingFriendlyId) return randomString
  }

  throw new Error(
    'Failed to generate unique friendly ID after maximum attempts',
  )
}

const beforeInsert = async (data: CreateGameData): Promise<CreateGameData> => {
  if (!data.friendlyId) {
    data.friendlyId = await generateSecureRandomString()
  }
  return data
}

const gamesRepository = {
  async getAll(userId: string): Promise<Game[]> {
    const games = await db.query.games.findMany({
      where: (table, { eq }) => eq(table.creatorId, userId),
      orderBy: (table, { desc }) => desc(table.createdAt),
      with: {
        creator: {
          columns: { displayName: true, id: true },
        },
      },
    })

    if (!games) throw new Error('Failed to fetch games')

    return games
  },

  async getById(id: string): Promise<Game | null> {
    const game = await db.query.games.findFirst({
      where: (table, { eq }) => eq(table.id, id),
    })

    return game || null
  },

  async getByFriendlyId(
    friendlyId: string,
    userId?: string,
  ): Promise<Game | null> {
    const game = await db.query.games.findFirst({
      where: (table, { eq, and }) => {
        const conditions = [eq(table.friendlyId, friendlyId)]
        if (userId) {
          conditions.push(eq(table.creatorId, userId))
        }
        return conditions.length > 1 ? and(...conditions) : conditions[0]
      },
      with: {
        creator: {
          columns: { displayName: true, id: true },
        },
        gameCells: {
          with: {
            cell: true,
          },
        },
      },
    })

    if (!game) return null

    return game
  },

  async create(data: CreateGameData, tx?: DbTransaction): Promise<Game> {
    const processedData = await beforeInsert(data)
    const executor = tx || db
    const [game] = await executor
      .insert(games)
      .values(processedData)
      .returning()
    if (!game) throw new Error('Failed to create game')

    return game
  },

  async update(game: Game, tx?: DbTransaction): Promise<Game> {
    const executor = tx || db

    const [updatedGame] = await executor
      .update(games)
      .set({ ...game, updatedAt: new Date() })
      .where(eq(games.id, game.id))
      .returning()

    if (!updatedGame) throw new Error('Failed to update game')

    const gameWithCreator = await executor.query.games.findFirst({
      where: (table, { eq }) => eq(table.id, updatedGame.id),
      with: {
        creator: {
          columns: { displayName: true, id: true },
        },
        gameCells: {
          with: {
            cell: true,
          },
        },
      },
    })

    if (!gameWithCreator) throw new Error('Failed to fetch updated game')

    return gameWithCreator
  },
}

export default gamesRepository
