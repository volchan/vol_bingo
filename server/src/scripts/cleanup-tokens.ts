import { refreshTokenRepository } from '../repositories/refresh-tokens'

/**
 * Cleanup script to remove expired refresh tokens
 * This should be run periodically (e.g., via cron job)
 */
export async function cleanupExpiredTokens(): Promise<void> {
	try {
		console.log('Starting cleanup of expired refresh tokens...')
		await refreshTokenRepository.cleanupExpired()
		console.log('Successfully cleaned up expired refresh tokens')
	} catch (error) {
		console.error('Failed to cleanup expired tokens:', error)
		throw error
	}
}

// If this script is run directly
if (import.meta.main) {
	cleanupExpiredTokens()
		.then(() => {
			console.log('Cleanup completed successfully')
			process.exit(0)
		})
		.catch((error) => {
			console.error('Cleanup failed:', error)
			process.exit(1)
		})
}
