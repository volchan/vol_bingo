import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../db/schemas'
import env from './env'
import { createDrizzleLogger } from './logger'

const db = drizzle(env.DATABASE_URL, {
	logger: createDrizzleLogger(),
	schema,
	casing: 'snake_case',
})

export const checkDatabaseConnection = async () => {
	try {
		await db.execute('SELECT 1')
		console.log('Database connection successful.')
	} catch (error) {
		console.error('Database connection failed:', error)
		process.exit(1)
	}
}

export default db
