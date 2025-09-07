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

  async setDisplayOnStream(
    gameId: string,
    userId: string,
    displayOnStream: boolean,
    tx?: DbTransaction,
  ): Promise<Game> {
    const executor = tx || db

    if (displayOnStream) {
      console.log(
        `Setting displayOnStream=true for game ${gameId}, turning off all other games for creator ${userId}`,
      )

      // First, set all other games by this creator to displayOnStream = false
      const result = await executor
        .update(games)
        .set({ displayOnStream: false, updatedAt: new Date() })
        .where(eq(games.creatorId, userId))

      console.log(
        `Turned off displayOnStream for ${result.rowCount || 0} games`,
      )
    } else {
      console.log(`Setting displayOnStream=false for game ${gameId}`)
    }

    // Then set the target game's displayOnStream value
    const [updatedGame] = await executor
      .update(games)
      .set({ displayOnStream, updatedAt: new Date() })
      .where(eq(games.id, gameId))
      .returning()

    if (!updatedGame) {
      throw new Error('Failed to update game display on stream status')
    }

    // Fetch the complete game with relations
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

  async getDisplayOnStreamGame(userId: string): Promise<Game | null> {
    const game = await db.query.games.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.creatorId, userId), eq(table.displayOnStream, true)),
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

    return game || null
  },
}

export default gamesRepository
