import db from '@server/config/database'
import { users } from '@server/db/schemas'
import type { User } from '@shared/types/models/user'
import { eq } from 'drizzle-orm'

export default {
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
}
