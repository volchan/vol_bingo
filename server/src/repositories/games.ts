import db from '@server/config/database'
import { games } from '@server/db/schemas'
import type { GameWithCreator } from '@shared/types/api/games'
import type { Game } from '@shared/types/models/game'

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

export default {
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

	async create(data: CreateGameData): Promise<Game> {
		const processedData = await beforeInsert(data)
		const [game] = await db.insert(games).values(processedData).returning()
		if (!game) throw new Error('Failed to create game')

		return game
	},
}
