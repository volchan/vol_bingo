import { sign } from 'hono/jwt'
import env from '../../config/env'
import {
	type CreateRefreshTokenData,
	refreshTokenRepository,
} from '../../repositories/refresh-token'

export interface JwtPayload {
	userId: string
	refreshToken: string
	iat: number
	exp: number
	[key: string]: unknown
}

export interface TokenPair {
	accessToken: string
	refreshToken: string
	expiresIn: number
}

class AuthService {
	private readonly jwtExpirationMinutes = 10

	private async generateJwtToken(
		userId: string,
		refreshToken: string,
	): Promise<string> {
		const now = Math.floor(Date.now() / 1000)
		const exp = now + this.jwtExpirationMinutes * 60

		const payload: JwtPayload = {
			userId,
			refreshToken,
			iat: now,
			exp,
		}

		return await sign(payload, env.JWT_SECRET)
	}

	async createTokenPair(data: CreateRefreshTokenData): Promise<TokenPair> {
		const refreshTokenData = await refreshTokenRepository.create(data)

		const accessToken = await this.generateJwtToken(
			data.userId,
			refreshTokenData.token,
		)

		return {
			accessToken,
			refreshToken: refreshTokenData.token,
			expiresIn: this.jwtExpirationMinutes * 60,
		}
	}

	async refreshTokenPair(refreshToken: string): Promise<TokenPair | null> {
		const tokenData = await refreshTokenRepository.findByToken(refreshToken)
		if (!tokenData) {
			return null
		}

		if (refreshTokenRepository.isExpired(tokenData)) {
			await refreshTokenRepository.delete(refreshToken)
			return null
		}

		if (refreshTokenRepository.isTwitchTokenExpired(tokenData)) {
			console.log('Twitch token needs refreshing for user:', tokenData.userId)
		}

		const accessToken = await this.generateJwtToken(
			tokenData.userId,
			refreshToken,
		)

		return {
			accessToken,
			refreshToken,
			expiresIn: this.jwtExpirationMinutes * 60,
		}
	}

	async revokeRefreshToken(refreshToken: string): Promise<void> {
		await refreshTokenRepository.delete(refreshToken)
	}

	async revokeAllUserTokens(userId: string): Promise<void> {
		await refreshTokenRepository.deleteByUserId(userId)
	}

	async getTwitchTokens(refreshToken: string): Promise<{
		accessToken: string
		refreshToken: string
	} | null> {
		const tokenData = await refreshTokenRepository.findByToken(refreshToken)
		if (!tokenData || refreshTokenRepository.isExpired(tokenData)) {
			return null
		}

		return {
			accessToken: tokenData.twitchAccessToken,
			refreshToken: tokenData.twitchRefreshToken,
		}
	}

	async updateTwitchTokens(
		refreshToken: string,
		twitchAccessToken: string,
		twitchRefreshToken: string,
		expiresInSeconds: number,
	): Promise<void> {
		const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)
		await refreshTokenRepository.updateTwitchTokens(
			refreshToken,
			twitchAccessToken,
			twitchRefreshToken,
			expiresAt,
		)
	}
}

export const authService = new AuthService()
