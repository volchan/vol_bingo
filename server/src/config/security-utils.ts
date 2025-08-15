/**
 * Security utilities for logging - handles sensitive data redaction
 */

// Environment detection
export const isProduction = () => {
	return Bun.env.NODE_ENV === 'production' || Bun.env.APP_ENV === 'production'
}

// Sensitive field patterns (case-insensitive) - emails and tokens only
const SENSITIVE_FIELD_PATTERNS = [
	/token/i,
	/auth/i,
	/bearer/i,
	/jwt/i,
	/session/i,
	/oauth/i,
	/refresh/i,
	/access/i,
	/email/i,
	/mail/i,
]

// SQL table/column patterns that might contain sensitive data - emails and tokens only
const SENSITIVE_SQL_PATTERNS = [
	/refresh_tokens/i,
	/user_sessions/i,
	/auth_tokens/i,
	/emails/i,
	/user_emails/i,
]

/**
 * Check if a field name appears to be sensitive
 */
export const isSensitiveField = (fieldName: string): boolean => {
	return SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName))
}

/**
 * Check if SQL query involves sensitive tables/operations
 */
export const isSensitiveSQL = (sql: string): boolean => {
	return SENSITIVE_SQL_PATTERNS.some((pattern) => pattern.test(sql))
}

/**
 * Determine redaction type for a sensitive value
 */
const getRedactionType = (value: string): string => {
	if (value.startsWith('eyJ')) return '[JWT_TOKEN]'
	if (value.includes('@')) return '[EMAIL]'
	// For other token-like patterns
	if (value.length >= 32 && /^[a-f0-9]+$/i.test(value)) return '[TOKEN]'
	if (value.length > 50) return '[TOKEN]'
	return '[REDACTED]'
}

/**
 * Check if a string value matches sensitive patterns
 */
const isSensitiveValue = (value: string): boolean => {
	// Only check for emails and tokens
	const patterns = [
		// JWT tokens
		/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
		// Email addresses
		/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}/,
		// Long strings that might be tokens (32+ chars)
		/^[A-Za-z0-9+/=]{32,}$/,
	]

	return patterns.some((pattern) => pattern.test(value))
}

/**
 * Redact sensitive parameters for logging
 */
export const redactSensitiveParams = (params: unknown[]): unknown[] => {
	if (!isProduction()) {
		return params // In development, show everything
	}

	return params.map((param) => {
		if (param === null || param === undefined) {
			return param
		}

		// Redact string values that look sensitive
		if (typeof param === 'string') {
			// Check against sensitive value patterns
			if (isSensitiveValue(param)) {
				return getRedactionType(param)
			}
		}

		return param
	})
}

/**
 * Redact sensitive object properties
 */
export const redactSensitiveObject = (obj: unknown): unknown => {
	if (!isProduction()) {
		return obj // In development, show everything
	}

	if (typeof obj !== 'object' || obj === null) {
		return obj
	}

	if (Array.isArray(obj)) {
		return obj.map(redactSensitiveObject)
	}

	const redacted: Record<string, unknown> = {}

	for (const [key, value] of Object.entries(obj)) {
		if (isSensitiveField(key)) {
			redacted[key] = '[REDACTED]'
		} else if (typeof value === 'object') {
			redacted[key] = redactSensitiveObject(value)
		} else {
			redacted[key] = value
		}
	}

	return redacted
}

/**
 * Redact sensitive SQL query content for production
 */
export const redactSensitiveSQL = (
	sql: string,
	params: unknown[],
): { sql: string; params: unknown[] } => {
	if (!isProduction()) {
		return { sql, params } // In development, show everything
	}

	let redactedSql = sql

	// Redact email addresses and JWT tokens in SQL strings
	redactedSql = redactedSql.replace(
		/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}/g,
		'[EMAIL]',
	)
	// Redact JWT tokens in SQL
	redactedSql = redactedSql.replace(
		/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
		'[JWT_TOKEN]',
	)

	// If the query involves token/email tables, redact more aggressively
	if (isSensitiveSQL(sql)) {
		return {
			sql: redactedSql.replace(/VALUES\s*\([^)]+\)/gi, 'VALUES ([REDACTED])'),
			params: params.map(() => '[REDACTED]'),
		}
	}

	return {
		sql: redactedSql,
		params: redactSensitiveParams(params),
	}
}

/**
 * Get redaction level based on environment
 */
export const getRedactionLevel = (): 'none' | 'partial' | 'full' => {
	if (isProduction()) {
		return 'full'
	}
	if (Bun.env.NODE_ENV === 'staging' || Bun.env.NODE_ENV === 'test') {
		return 'partial'
	}
	return 'none'
}
