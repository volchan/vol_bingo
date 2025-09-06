import { DrizzleHonoLogger, DrizzleHonoLoggerCompact } from './drizzle-logger'

export const createDrizzleLogger = () => {
  if (Bun.env.NODE_ENV === 'production') {
    return new DrizzleHonoLoggerCompact()
  }

  return new DrizzleHonoLogger()
}

export { DrizzleHonoLogger, DrizzleHonoLoggerCompact }

export default createDrizzleLogger()
