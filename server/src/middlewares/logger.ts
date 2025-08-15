import { randomUUID } from 'crypto'
import type { Context, Next } from 'hono'
import { isProduction, redactSensitiveObject } from '../config/security-utils'

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

const getStatusColor = (status: number): keyof typeof colors => {
	if (status >= 200 && status < 300) return 'green'
	if (status >= 300 && status < 400) return 'cyan'
	if (status >= 400 && status < 500) return 'yellow'
	if (status >= 500) return 'red'
	return 'white'
}

const getMethodColor = (method: string): keyof typeof colors => {
	const methodColors: Record<string, keyof typeof colors> = {
		GET: 'blue',
		POST: 'green',
		PUT: 'yellow',
		PATCH: 'yellow',
		DELETE: 'red',
		HEAD: 'magenta',
		OPTIONS: 'cyan',
	}
	return methodColors[method] || 'white'
}

const formatDuration = (ms: number) => {
	if (ms < 100) return colorize('green', `${ms}ms`)
	if (ms < 500) return colorize('yellow', `${ms}ms`)
	return colorize('red', `${ms}ms`)
}

function getStatusText(status: number): string {
	const statusTexts: Record<number, string> = {
		200: 'OK',
		201: 'Created',
		204: 'No Content',
		301: 'Moved Permanently',
		302: 'Found',
		304: 'Not Modified',
		400: 'Bad Request',
		401: 'Unauthorized',
		403: 'Forbidden',
		404: 'Not Found',
		422: 'Unprocessable Entity',
		429: 'Too Many Requests',
		500: 'Internal Server Error',
		502: 'Bad Gateway',
		503: 'Service Unavailable',
	}
	return statusTexts[status] || 'Unknown'
}

export const loggerMiddleware = async (c: Context, next: Next) => {
	const requestId = c.get('requestId') || randomUUID()
	const startTime = performance.now()
	const timestamp = new Date().toISOString()

	const method = c.req.method
	const url = c.req.url
	const userAgent = c.req.header('user-agent')

	const timestampDimmed = dim(timestamp)
	const requestIdColored = colorize('magenta', `[${requestId}]`)
	const methodColored = colorize(getMethodColor(method), bold(method))
	const urlColored = colorize('cyan', url)

	console.log(`
${timestampDimmed} ${requestIdColored} Started ${methodColored} "${urlColored}"`)

	const isProd = isProduction()

	const authHeader = c.req.header('authorization')
	const apiKeyHeader = c.req.header('x-api-key')
	const cookieHeader = c.req.header('cookie')

	const importantHeaders = {
		Host: c.req.header('host'),
		'User-Agent': userAgent,
		Accept: c.req.header('accept'),
		'Content-Type': c.req.header('content-type'),
		Authorization: authHeader && ((isProd && '[FILTERED]') || authHeader),
		'X-API-Key': apiKeyHeader && ((isProd && '[FILTERED]') || apiKeyHeader),
		Cookie: cookieHeader && ((isProd && '[FILTERED]') || cookieHeader),
		'X-Forwarded-For': c.req.header('x-forwarded-for'),
		'X-Real-IP': c.req.header('x-real-ip'),
	}

	Object.entries(importantHeaders).forEach(([key, value]) => {
		if (!value) return

		const timestamp = new Date().toISOString()
		const requestIdColored = colorize('magenta', `[${requestId}]`)
		const keyColored = colorize('blue', key)
		const valueDimmed = dim(value)

		console.log(
			`${dim(timestamp)} ${requestIdColored} ${keyColored}: ${valueDimmed}`,
		)
	})

	const contentType = c.req.header('content-type')
	const hasJsonContent =
		contentType?.includes('application/json') && method !== 'GET'

	if (hasJsonContent) {
		const currentTimestamp = new Date().toISOString()
		const currentTimestampDimmed = dim(currentTimestamp)
		const currentRequestIdColored = colorize('magenta', `[${requestId}]`)
		const processingMessage = colorize(
			'yellow',
			'Processing request with JSON payload',
		)

		if (isProd) {
			console.log(
				`${currentTimestampDimmed} ${currentRequestIdColored} ${processingMessage}`,
			)
		} else {
			console.log(
				`${currentTimestampDimmed} ${currentRequestIdColored} ${processingMessage}`,
			)
			try {
				const body = await c.req.text()
				const parsedBody = JSON.parse(body)
				const redactedBody = redactSensitiveObject(parsedBody)
				const bodyColored = colorize('cyan', 'Body:')
				const bodyFormatted = JSON.stringify(redactedBody, null, 2)
				console.log(
					`${currentTimestampDimmed} ${currentRequestIdColored} ${bodyColored} ${bodyFormatted}`,
				)
			} catch {
				const skipMessage = colorize('yellow', 'Body parsing skipped')
				console.log(
					`${currentTimestampDimmed} ${currentRequestIdColored} ${skipMessage}`,
				)
			}
		}
	}

	await next()

	const duration = Math.round(performance.now() - startTime)
	const status = c.res.status

	const responseTimestamp = new Date().toISOString()
	const responseTimestampDimmed = dim(responseTimestamp)
	const responseRequestIdColored = colorize('magenta', `[${requestId}]`)
	const statusColored = colorize(
		getStatusColor(status),
		bold(status.toString()),
	)
	const statusTextValue = getStatusText(status)
	const durationFormatted = formatDuration(duration)

	console.log(
		`${responseTimestampDimmed} ${responseRequestIdColored} Completed ${statusColored} ${statusTextValue} in ${durationFormatted}`,
	)

	const contentLength = c.res.headers.get('content-length')
	const responseType = c.res.headers.get('content-type')
	const hasResponseInfo = contentLength || responseType

	if (hasResponseInfo) {
		const info = []
		responseType && info.push(`Type: ${responseType}`)
		contentLength && info.push(`Size: ${contentLength} bytes`)
		const infoJoined = info.join(' | ')

		console.log(
			`${responseTimestampDimmed} ${responseRequestIdColored} ${dim(infoJoined)}`,
		)
	}

	console.log('')
}

export const errorLoggerMiddleware = (err: Error, c: Context) => {
	const requestId = c.get('requestId') || 'unknown'
	const timestamp = new Date().toISOString()
	const isProd = isProduction()

	const timestampDimmed = dim(timestamp)
	const requestIdColored = colorize('magenta', `[${requestId}]`)
	const errorLabel = colorize('red', bold('ERROR:'))

	console.log(
		`${timestampDimmed} ${requestIdColored} ${errorLabel} ${err.message}`,
	)

	const shouldShowStack = !isProd && err.stack
	if (shouldShowStack) {
		const stackLabel = colorize('red', 'Stack trace:')
		console.log(`${timestampDimmed} ${requestIdColored} ${stackLabel}`)

		err.stack?.split('\n').forEach((line) => {
			if (!line.trim()) return
			const lineColored = colorize('red', line)
			console.log(`${timestampDimmed} ${requestIdColored} ${lineColored}`)
		})
	}
	console.log('')

	const errorResponse = (isProd && 'Internal Server Error') || err.message
	const responseData = {
		error: errorResponse,
		...(isProd ? {} : { stack: err.stack }),
	}

	return c.json(responseData, 500)
}
