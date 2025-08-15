import { sign } from 'hono/jwt'
import env from '../../config/env'

export interface JwtPayload {
	twitchToken: string
	refreshToken: string
	iat: number
	exp: number
	[key: string]: string | number
}

export async function generateJwtToken(
	twitchToken: string,
	refreshToken: string,
): Promise<string> {
	const now = Math.floor(Date.now() / 1000)
	const payload: JwtPayload = {
		twitchToken,
		refreshToken,
		iat: now,
		exp: now + 10 * 60, // 10 minutes
	}

	return await sign(payload, env.JWT_SECRET)
}
