import db from '@server/config/database'
import { gameCells, playerBoardCells, playerBoards } from '@server/schemas'
import type { PlayerBoard } from '@shared/types'
import { and, eq } from 'drizzle-orm'
import type { DbTransaction } from './utils'

export type CreatePlayerBoardData = Omit<
  PlayerBoard,
  'id' | 'createdAt' | 'updatedAt' | 'status'
>

const playerBoardsRepository = {
  create: async (data: CreatePlayerBoardData, tx?: DbTransaction) => {
    const executor = tx || db
    const [playerBoard] = await executor
      .insert(playerBoards)
      .values(data)
      .returning()
    if (!playerBoard) throw new Error('Failed to create player board')

    return playerBoard
  },

  findByPlayerAndGame: async (
    playerId: string,
    gameId: string,
    tx?: DbTransaction,
  ) => {
    const executor = tx || db
    const [playerBoard] = await executor
      .select()
      .from(playerBoards)
      .where(
        and(
          eq(playerBoards.playerId, playerId),
          eq(playerBoards.gameId, gameId),
        ),
      )
      .limit(1)

    return playerBoard || null
  },

  findById: async (id: string, tx?: DbTransaction) => {
    const executor = tx || db
    const [playerBoard] = await executor
      .select()
      .from(playerBoards)
      .where(eq(playerBoards.id, id))
      .limit(1)

    return playerBoard || null
  },

  createIfNotExists: async (
    data: CreatePlayerBoardData,
    tx?: DbTransaction,
  ) => {
    const existing = await playerBoardsRepository.findByPlayerAndGame(
      data.playerId,
      data.gameId,
      tx,
    )
    if (existing) {
      return existing
    }
    return await playerBoardsRepository.create(data, tx)
  },

  initializePlayerBoardCells: async (
    playerBoardId: string,
    gameId: string,
    tx?: DbTransaction,
  ) => {
    const executor = tx || db

    const gameGameCells = await executor
      .select()
      .from(gameCells)
      .where(eq(gameCells.gameId, gameId))
      .orderBy(gameCells.createdAt)

    if (gameGameCells.length === 0) {
      return []
    }

    const shuffledCells = [...gameGameCells].sort(() => Math.random() - 0.5)

    const playerBoardCellData = shuffledCells.map((gameCell, index) => ({
      playerBoardId,
      gameCellId: gameCell.id,
      position: index,
    }))

    const createdCells = await executor
      .insert(playerBoardCells)
      .values(playerBoardCellData)
      .returning()

    return createdCells
  },

  getPlayerBoardWithCells: async (
    playerId: string,
    gameId: string,
    tx?: DbTransaction,
  ) => {
    const executor = tx || db

    const playerBoard = await executor.query.playerBoards.findFirst({
      where: (table) =>
        and(eq(table.playerId, playerId), eq(table.gameId, gameId)),
      with: {
        playerBoardCells: {
          with: {
            gameCell: {
              with: {
                cell: true,
              },
            },
          },
          orderBy: (table, { asc }) => asc(table.position),
        },
      },
    })

    return playerBoard || null
  },

  shufflePlayerBoard: async (
    playerId: string,
    gameId: string,
    tx?: DbTransaction,
  ) => {
    const executor = tx || db

    const playerBoard = await playerBoardsRepository.findByPlayerAndGame(
      playerId,
      gameId,
      tx,
    )
    if (!playerBoard) {
      throw new Error('Player board not found')
    }

    const gameGameCells = await executor
      .select()
      .from(gameCells)
      .where(eq(gameCells.gameId, gameId))
      .orderBy(gameCells.createdAt)

    if (gameGameCells.length === 0) {
      throw new Error('No game cells found')
    }

    const shuffledCells = [...gameGameCells].sort(() => Math.random() - 0.5)

    await executor
      .delete(playerBoardCells)
      .where(eq(playerBoardCells.playerBoardId, playerBoard.id))

    const playerBoardCellData = shuffledCells.map((gameCell, index) => ({
      playerBoardId: playerBoard.id,
      gameCellId: gameCell.id,
      position: index,
    }))

    const createdCells = await executor
      .insert(playerBoardCells)
      .values(playerBoardCellData)
      .returning()

    return createdCells
  },

  clearAllPlayerBoardCells: async (gameId: string, tx?: DbTransaction) => {
    const executor = tx || db

    const gamePlayerBoards = await executor
      .select()
      .from(playerBoards)
      .where(eq(playerBoards.gameId, gameId))

    for (const playerBoard of gamePlayerBoards) {
      await executor
        .delete(playerBoardCells)
        .where(eq(playerBoardCells.playerBoardId, playerBoard.id))
    }

    console.log(`Cleared player board cells for game ${gameId}`)
  },

  async setPlayerConnected(
    playerId: string,
    gameId: string,
    connected: boolean,
  ) {
    const [updatedPlayerBoard] = await db
      .update(playerBoards)
      .set({ connected })
      .where(
        and(
          eq(playerBoards.playerId, playerId),
          eq(playerBoards.gameId, gameId),
        ),
      )
      .returning()

    return updatedPlayerBoard
  },

  getAllForGame: async (gameId: string, tx?: DbTransaction) => {
    const executor = tx || db

    const playerBoardsList = await executor.query.playerBoards.findMany({
      where: (table) => eq(table.gameId, gameId),
      with: {
        player: true,
        playerBoardCells: {
          with: {
            gameCell: {
              with: {
                cell: true,
              },
            },
          },
        },
      },
    })

    return playerBoardsList
  },
}

export default playerBoardsRepository
