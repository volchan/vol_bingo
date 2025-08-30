import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type * as Schema from '../schemas'

export type DbTransaction = PgTransaction<
	NodePgQueryResultHKT,
	typeof Schema,
	ExtractTablesWithRelations<typeof Schema>
>
