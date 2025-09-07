import db from '@server/config/database'
import { generateSecureHexToken } from '@server/config/security-utils'
import { playerBoards, users } from '@server/schemas'
import type { User } from '@shared/types/models/user'
import { eq } from 'drizzle-orm'

const usersRepository = {
  async create(
    data: Omit<
      User,
      'id' | 'createdAt' | 'updatedAt' | 'streamIntegrationToken'
    >,
  ): Promise<User> {
    // Auto-generate unique stream integration token
    const streamIntegrationToken = await this.generateUniqueStreamToken()

    const [user] = await db
      .insert(users)
      .values({
        ...data,
        streamIntegrationToken,
      })
      .returning()
    if (!user) throw new Error('Failed to create user')
    return user
  },

  async findAll(): Promise<User[]> {
    return db.query.users.findMany()
  },

  async findById(id: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    })

    return user ?? null
  },

  async findByTwitchId(twitchId: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.twitchId, twitchId),
      with: {
        createdGames: true,
      },
    })
    return user ?? null
  },

  async update(
    id: string,
    data: Omit<
      User,
      'id' | 'createdAt' | 'updatedAt' | 'streamIntegrationToken'
    >,
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()

    if (!user) throw new Error('Failed to update user')
    return user
  },

  async delete(id: string) {
    return await db.delete(users).where(eq(users.id, id))
  },

  async getPlayedGames(userId: string) {
    const boards = await db.query.playerBoards.findMany({
      where: eq(playerBoards.playerId, userId),
      columns: {
        id: true,
      },
      with: {
        game: {
          columns: {
            id: true,
            friendlyId: true,
            status: true,
            title: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            creator: {
              columns: {
                displayName: true,
                id: true,
              },
            },
            winner: {
              columns: {
                displayName: true,
                id: true,
              },
            },
            playerBoards: {
              columns: {
                id: true,
              },
              with: {
                player: {
                  columns: {
                    displayName: true,
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    return boards.map((board) => {
      const game = board.game
      return {
        id: game.id,
        title: game.title,
        friendlyId: game.friendlyId,
        status: game.status,
        creator: game.creator,
        winner: game.winner,
        players: game.playerBoards.map((board) => board.player),
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      }
    })
  },

  async generateUniqueStreamToken(): Promise<string> {
    let token: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    do {
      token = generateSecureHexToken(16) // 32 character hex string
      const existing = await db.query.users.findFirst({
        where: eq(users.streamIntegrationToken, token),
      })
      isUnique = !existing
      attempts++
    } while (!isUnique && attempts < maxAttempts)

    if (!isUnique) {
      throw new Error('Failed to generate unique stream integration token')
    }

    return token
  },

  async generateStreamIntegrationToken(userId: string): Promise<string> {
    // Check if user already has a token
    const existingUser = await this.findById(userId)
    if (existingUser?.streamIntegrationToken) {
      return existingUser.streamIntegrationToken
    }

    const token = await this.generateUniqueStreamToken()

    const [updatedUser] = await db
      .update(users)
      .set({
        streamIntegrationToken: token,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    if (!updatedUser) {
      throw new Error('Failed to update user with stream integration token')
    }

    return token
  },

  async rollStreamIntegrationToken(userId: string): Promise<string> {
    const token = await this.generateUniqueStreamToken()

    const [updatedUser] = await db
      .update(users)
      .set({
        streamIntegrationToken: token,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    if (!updatedUser) {
      throw new Error('Failed to update user with stream integration token')
    }

    return token
  },

  async findByStreamToken(token: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.streamIntegrationToken, token),
    })
    return user ?? null
  },
}

export default usersRepository
