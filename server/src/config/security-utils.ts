export const isProduction = () => {
	return Bun.env.NODE_ENV === 'production' || Bun.env.APP_ENV === 'production'
}

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

const SENSITIVE_SQL_PATTERNS = [
	/refresh_tokens/i,
	/user_sessions/i,
	/auth_tokens/i,
	/emails/i,
	/user_emails/i,
]

export const isSensitiveField = (fieldName: string): boolean => {
	return SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName))
}

export const isSensitiveSQL = (sql: string): boolean => {
	return SENSITIVE_SQL_PATTERNS.some((pattern) => pattern.test(sql))
}

const getRedactionType = (value: string): string => {
	if (value.startsWith('eyJ')) return '[JWT_TOKEN]'
	if (value.includes('@')) return '[EMAIL]'

	if (value.length >= 32 && /^[a-f0-9]+$/i.test(value)) return '[TOKEN]'
	if (value.length > 50) return '[TOKEN]'
	return '[REDACTED]'
}

const isSensitiveValue = (value: string): boolean => {
	const patterns = [
		/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,

		/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}/,

		/^[A-Za-z0-9+/=]{32,}$/,
	]

	return patterns.some((pattern) => pattern.test(value))
}

export const redactSensitiveParams = (params: unknown[]): unknown[] => {
	if (!isProduction()) {
		return params
	}

	return params.map((param) => {
		if (param === null || param === undefined) {
			return param
		}

		if (typeof param === 'string') {
			if (isSensitiveValue(param)) {
				return getRedactionType(param)
			}
		}

		return param
	})
}

export const redactSensitiveObject = (obj: unknown): unknown => {
	if (!isProduction()) {
		return obj
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

export const redactSensitiveSQL = (
	sql: string,
	params: unknown[],
): { sql: string; params: unknown[] } => {
	if (!isProduction()) {
		return { sql, params }
	}

	let redactedSql = sql

	redactedSql = redactedSql.replace(
		/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}/g,
		'[EMAIL]',
	)

	redactedSql = redactedSql.replace(
		/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
		'[JWT_TOKEN]',
	)

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

export const getRedactionLevel = (): 'none' | 'partial' | 'full' => {
	if (isProduction()) {
		return 'full'
	}
	if (Bun.env.NODE_ENV === 'staging' || Bun.env.NODE_ENV === 'test') {
		return 'partial'
	}
	return 'none'
}
