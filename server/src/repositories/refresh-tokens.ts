import { randomBytes } from 'node:crypto'
import { eq, lt } from 'drizzle-orm'
import db from '../config/database'
import { refreshTokens } from '../schemas'

const addToNowUtc = (duration: { days?: number }): string => {
	const now = new Date()
	if (duration.days) {
		now.setUTCDate(now.getUTCDate() + duration.days)
	}
	return now.toISOString()
}

export interface RefreshTokenData {
	token: string
	userId: string
	expiresAt: Date
	twitchAccessToken: string
	twitchRefreshToken: string
	twitchExpiresAt: Date
}

export interface CreateRefreshTokenData {
	userId: string
	twitchAccessToken: string
	twitchRefreshToken: string
	twitchExpiresAt: Date
	expiresInDays?: number
}

class RefreshTokenRepository {
	private generateToken(): string {
		return randomBytes(32).toString('hex')
	}

	async create(data: CreateRefreshTokenData): Promise<RefreshTokenData> {
		const token = this.generateToken()

		const expiresAtIso = addToNowUtc({ days: data.expiresInDays || 1 })
		const expiresAt = new Date(expiresAtIso)

		const [created] = await db
			.insert(refreshTokens)
			.values({
				token,
				userId: data.userId,
				expiresAt,
				twitchAccessToken: data.twitchAccessToken,
				twitchRefreshToken: data.twitchRefreshToken,
				twitchExpiresAt: data.twitchExpiresAt,
			})
			.returning()

		if (!created) {
			throw new Error('Failed to create refresh token')
		}

		return created
	}

	async findByToken(token: string): Promise<RefreshTokenData | null> {
		const [result] = await db
			.select()
			.from(refreshTokens)
			.where(eq(refreshTokens.token, token))
			.limit(1)

		return result || null
	}

	async delete(token: string): Promise<void> {
		await db.delete(refreshTokens).where(eq(refreshTokens.token, token))
	}

	async deleteByUserId(userId: string): Promise<void> {
		await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))
	}

	async updateTwitchTokens(
		token: string,
		twitchAccessToken: string,
		twitchRefreshToken: string,
		twitchExpiresAt: Date,
	): Promise<void> {
		await db
			.update(refreshTokens)
			.set({
				twitchAccessToken,
				twitchRefreshToken,
				twitchExpiresAt,
			})
			.where(eq(refreshTokens.token, token))
	}

	async cleanupExpired(): Promise<void> {
		const now = new Date()
		await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, now))
	}

	isExpired(tokenData: RefreshTokenData): boolean {
		return new Date() >= tokenData.expiresAt
	}

	isTwitchTokenExpired(
		tokenData: RefreshTokenData,
		bufferMinutes = 5,
	): boolean {
		const now = new Date()
		const buffer = bufferMinutes * 60 * 1000
		return now.getTime() + buffer >= tokenData.twitchExpiresAt.getTime()
	}
}

export const refreshTokenRepository = new RefreshTokenRepository()
