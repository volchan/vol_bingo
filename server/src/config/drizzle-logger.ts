import type { Logger } from 'drizzle-orm'
import {
	getCurrentRequestId,
	getCurrentRequestTimestamp,
} from './request-context'
import { redactSensitiveSQL } from './security-utils'

const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',

	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	gray: '\x1b[90m',

	bgRed: '\x1b[41m',
	bgGreen: '\x1b[42m',
	bgYellow: '\x1b[43m',
	bgBlue: '\x1b[44m',
	bgMagenta: '\x1b[45m',
	bgCyan: '\x1b[46m',
}

const colorize = (color: keyof typeof colors, text: string) =>
	`${colors[color]}${text}${colors.reset}`

const bold = (text: string) => `${colors.bright}${text}${colors.reset}`
const dim = (text: string) => `${colors.dim}${text}${colors.reset}`

/**
 * Highlights SQL syntax with colors
 */
const highlightSQL = (sql: string): string => {
	// SQL keywords to highlight
	const keywords = [
		'SELECT',
		'FROM',
		'WHERE',
		'INSERT',
		'UPDATE',
		'DELETE',
		'CREATE',
		'DROP',
		'ALTER',
		'TABLE',
		'INDEX',
		'CONSTRAINT',
		'PRIMARY',
		'KEY',
		'FOREIGN',
		'REFERENCES',
		'JOIN',
		'LEFT',
		'RIGHT',
		'INNER',
		'OUTER',
		'ON',
		'AS',
		'AND',
		'OR',
		'NOT',
		'NULL',
		'TRUE',
		'FALSE',
		'LIMIT',
		'OFFSET',
		'ORDER',
		'BY',
		'GROUP',
		'HAVING',
		'DISTINCT',
		'COUNT',
		'SUM',
		'AVG',
		'MIN',
		'MAX',
		'CASE',
		'WHEN',
		'THEN',
		'ELSE',
		'END',
		'IF',
		'EXISTS',
		'IN',
		'BETWEEN',
		'LIKE',
		'ILIKE',
		'UNION',
		'EXCEPT',
		'INTERSECT',
		'WITH',
		'RETURNING',
		'VALUES',
		'DEFAULT',
		'AUTOINCREMENT',
		'SERIAL',
		'BIGSERIAL',
		'SMALLSERIAL',
		'INTEGER',
		'BIGINT',
		'SMALLINT',
		'DECIMAL',
		'NUMERIC',
		'REAL',
		'DOUBLE',
		'VARCHAR',
		'CHAR',
		'TEXT',
		'BOOLEAN',
		'DATE',
		'TIME',
		'TIMESTAMP',
		'TIMESTAMPTZ',
		'INTERVAL',
		'UUID',
		'JSON',
		'JSONB',
		'ARRAY',
		'UNIQUE',
		'CHECK',
		'CASCADE',
		'RESTRICT',
		'SET',
		'CONFLICT',
		'DO',
		'NOTHING',
		'UPSERT',
		'BEGIN',
		'COMMIT',
		'ROLLBACK',
		'TRANSACTION',
		'SAVEPOINT',
		'RELEASE',
	]

	let highlighted = sql

	// Highlight SQL keywords in blue
	keywords.forEach((keyword) => {
		const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
		highlighted = highlighted.replace(
			regex,
			colorize('blue', keyword.toUpperCase()),
		)
	})

	// Highlight string literals in green
	highlighted = highlighted.replace(/'([^']*)'/g, colorize('green', "'$1'"))

	// Highlight numbers in yellow
	highlighted = highlighted.replace(
		/\b\d+(\.\d+)?\b/g,
		colorize('yellow', '$&'),
	)

	// Highlight table/column names in cyan (quoted identifiers)
	highlighted = highlighted.replace(/"([^"]*)"/g, colorize('cyan', '"$1"'))

	// Highlight parameters ($1, $2, etc.) in magenta
	highlighted = highlighted.replace(/\$\d+/g, colorize('magenta', '$&'))

	// Highlight placeholders (?) in magenta
	highlighted = highlighted.replace(/\?/g, colorize('magenta', '?'))

	// Highlight comments in gray
	highlighted = highlighted.replace(/--.*$/gm, colorize('gray', '$&'))
	highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, colorize('gray', '$&'))

	return highlighted
}

/**
 * Formats query parameters for display
 */
const formatParams = (params: unknown[]): string => {
	if (!params.length) return ''

	const stringifiedParams = params.map((p) => {
		try {
			if (typeof p === 'string') {
				return colorize('green', `"${p}"`)
			}
			if (typeof p === 'number') {
				return colorize('yellow', String(p))
			}
			if (typeof p === 'boolean') {
				return colorize('blue', String(p))
			}
			if (p === null || p === undefined) {
				return colorize('gray', String(p))
			}
			return colorize('cyan', JSON.stringify(p))
		} catch {
			return colorize('white', String(p))
		}
	})

	return ` ${dim('params:')} [${stringifiedParams.join(', ')}]`
}

/**
 * Drizzle logger that mimics Hono logger style with SQL syntax highlighting
 */
export class DrizzleHonoLogger implements Logger {
	logQuery(query: string, params: unknown[]): void {
		// Try to get the current request ID from the async context
		const requestId = getCurrentRequestId()
		const requestTimestamp = getCurrentRequestTimestamp()

		const timestamp = requestTimestamp || new Date().toISOString()
		const timestampDimmed = dim(timestamp)

		// Use the request ID if available, otherwise generate a query-specific ID
		const queryId = requestId || Math.random().toString(36).substring(2, 8)
		const queryIdColored = colorize('magenta', `[${queryId}]`)

		const sqlLabel = colorize('cyan', bold('SQL:'))

		// Redact sensitive data for production
		const { sql: redactedSQL, params: redactedParams } = redactSensitiveSQL(
			query,
			params,
		)

		// Highlight the SQL query
		const highlightedQuery = highlightSQL(redactedSQL)

		// Format parameters
		const paramsString = formatParams(redactedParams)

		// Log the query with syntax highlighting
		console.log(
			`${timestampDimmed} ${queryIdColored} ${sqlLabel} ${highlightedQuery}${paramsString}`,
		)
	}
}

/**
 * Compact version of the Drizzle logger for production use
 */
export class DrizzleHonoLoggerCompact implements Logger {
	logQuery(query: string, params: unknown[]): void {
		// Try to get the current request ID from the async context
		const requestId = getCurrentRequestId()
		const requestTimestamp = getCurrentRequestTimestamp()

		const timestamp = requestTimestamp || new Date().toISOString()
		const timestampDimmed = dim(timestamp)

		// Use the request ID if available, otherwise generate a query-specific ID
		const queryId = requestId || Math.random().toString(36).substring(2, 6)
		const queryIdColored = colorize('magenta', `[${queryId}]`)

		const sqlLabel = colorize('cyan', 'SQL:')

		// Redact sensitive data for production
		const { sql: redactedSQL, params: redactedParams } = redactSensitiveSQL(
			query,
			params,
		)

		// Simplified highlighting - just keywords
		const highlightedQuery = redactedSQL.replace(
			/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|JOIN|ON|AND|OR|LIMIT|ORDER|BY|GROUP|HAVING)\b/gi,
			(match) => colorize('blue', match.toUpperCase()),
		)

		const paramsString = redactedParams.length
			? ` ${dim(`[${redactedParams.length} params]`)}`
			: ''

		console.log(
			`${timestampDimmed} ${queryIdColored} ${sqlLabel} ${highlightedQuery}${paramsString}`,
		)
	}
}
