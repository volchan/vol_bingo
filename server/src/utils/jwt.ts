import env from '@server/config/env'
import { verify } from 'hono/jwt'

export async function verifyJWT(token: string) {
  try {
    const payload = await verify(token, env.JWT_SECRET)
    return payload
  } catch (_error) {
    throw new Error('Invalid JWT token')
  }
}
