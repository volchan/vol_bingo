import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../schemas'
import env from './env'
import { createDrizzleLogger } from './logger'

const pool = new Pool({
	connectionString: env.DATABASE_URL,
	options: '-c timezone=UTC -c TimeZone=UTC',
})

const db = drizzle(pool, {
	logger: createDrizzleLogger(),
	schema,
	casing: 'snake_case',
})

export const checkDatabaseConnection = async () => {
	try {
		await db.execute('SELECT 1;')

		console.log('✅ Database connection successful')
	} catch (error) {
		console.error('❌ Database connection failed:', error)
		process.exit(1)
	}
}

export default db
