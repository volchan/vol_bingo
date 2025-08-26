import db from '@server/config/database'
import { playerBoards, users } from '@server/schemas'
import type { User } from '@shared/types/models/user'
import { eq } from 'drizzle-orm'

const usersRepository = {
	async create(
		data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
	): Promise<User> {
		const [user] = await db.insert(users).values(data).returning()
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
		data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
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
}

export default usersRepository
