import { DrizzleHonoLogger, DrizzleHonoLoggerCompact } from './drizzle-logger'

/**
 * Factory function to create the appropriate logger based on environment
 */
export const createDrizzleLogger = () => {
	// Use compact logger in production for better performance
	if (Bun.env.NODE_ENV === 'production') {
		return new DrizzleHonoLoggerCompact()
	}

	// Use full logger in development for better debugging
	return new DrizzleHonoLogger()
}

/**
 * Export individual loggers for manual selection
 */
export { DrizzleHonoLogger, DrizzleHonoLoggerCompact }

/**
 * Default export - auto-selects based on environment
 */
export default createDrizzleLogger()
