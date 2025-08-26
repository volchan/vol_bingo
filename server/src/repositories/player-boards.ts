import db from '@server/config/database'
import { playerBoards } from '@server/schemas'
import type { PlayerBoard } from '@shared/types'
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
}

export default playerBoardsRepository
