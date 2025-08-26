import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import type * as Schema from '../schemas'

export type DbTransaction = PgTransaction<
	PostgresJsQueryResultHKT,
	typeof Schema,
	ExtractTablesWithRelations<typeof Schema>
>
