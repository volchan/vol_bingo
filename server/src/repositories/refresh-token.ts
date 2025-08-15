import { randomBytes } from 'crypto'
import { eq, lt } from 'drizzle-orm'
import db from '../config/database'
import { refreshTokens } from '../db/schemas'

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
	expiresInDays?: number // Default to 30 days
}

class RefreshTokenRepository {
	/**
	 * Generate a secure random refresh token
	 */
	private generateToken(): string {
		return randomBytes(32).toString('hex')
	}

	/**
	 * Create a new refresh token for a user
	 */
	async create(data: CreateRefreshTokenData): Promise<RefreshTokenData> {
		const token = this.generateToken()
		const expiresAt = new Date()
		expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 30))

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

	/**
	 * Find a refresh token by token value
	 */
	async findByToken(token: string): Promise<RefreshTokenData | null> {
		const [result] = await db
			.select()
			.from(refreshTokens)
			.where(eq(refreshTokens.token, token))
			.limit(1)

		return result || null
	}

	/**
	 * Delete a refresh token
	 */
	async delete(token: string): Promise<void> {
		await db.delete(refreshTokens).where(eq(refreshTokens.token, token))
	}

	/**
	 * Delete all refresh tokens for a user
	 */
	async deleteByUserId(userId: string): Promise<void> {
		await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))
	}

	/**
	 * Update Twitch tokens for a refresh token
	 */
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

	/**
	 * Clean up expired refresh tokens
	 */
	async cleanupExpired(): Promise<void> {
		const now = new Date()
		await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, now))
	}

	/**
	 * Check if a refresh token is expired
	 */
	isExpired(tokenData: RefreshTokenData): boolean {
		return new Date() >= tokenData.expiresAt
	}

	/**
	 * Check if Twitch token is expired or expires soon
	 */
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
