export function decodeJwt(token: string) {
	try {
		const parts = token.split('.')
		if (parts.length !== 3) {
			throw new Error('Invalid JWT format')
		}

		const payload = JSON.parse(atob(parts[1]!))
		return payload
	} catch (error) {
		console.error('Failed to decode JWT:', error)
		return null
	}
}

export function isJwtExpired(token: string, bufferSeconds = 60): boolean {
	const payload = decodeJwt(token)
	if (!payload?.exp) return true

	const now = Math.floor(Date.now() / 1000)
	return payload.exp <= now + bufferSeconds
}

export function getJwtTimeToExpiry(token: string): number {
	const payload = decodeJwt(token)
	if (!payload?.exp) return 0

	const now = Math.floor(Date.now() / 1000)
	return Math.max(0, payload.exp - now)
}
