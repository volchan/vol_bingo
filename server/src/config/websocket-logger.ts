import { isProduction } from './security-utils'

const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
}

const colorize = (color: keyof typeof colors, text: string) =>
	`${colors[color]}${text}${colors.reset}`
const dim = (text: string) => `${colors.dim}${text}${colors.reset}`

class WebSocketLogger {
	private formatTimestamp(): string {
		return dim(new Date().toISOString())
	}

	private formatConnectionId(connectionId: string): string {
		// Extract last 8 chars for shorter display
		const shortId =
			connectionId.split('-').pop()?.slice(-8) || connectionId.slice(-8)
		return colorize('magenta', `[${shortId}]`)
	}

	private formatGameId(gameId: string): string {
		return colorize('cyan', gameId)
	}

	private formatUserId(userId: string): string {
		return colorize('blue', userId)
	}

	public connectionOpened(gameId: string, connectionId: string): void {
		const timestamp = this.formatTimestamp()
		const connId = this.formatConnectionId(connectionId)
		const game = this.formatGameId(gameId)
		console.log(
			`${timestamp} ${connId} ${colorize('green', 'CONNECT')} ${game}`,
		)
	}

	public connectionAuthenticated(
		connectionId: string,
		userId: string,
		gameId: string,
	): void {
		const timestamp = this.formatTimestamp()
		const connId = this.formatConnectionId(connectionId)
		const user = this.formatUserId(userId)
		const game = this.formatGameId(gameId)
		console.log(
			`${timestamp} ${connId} ${colorize('green', 'AUTH')} ${user} → ${game}`,
		)
	}

	public connectionClosed(
		connectionId: string,
		reason: string,
		code?: number,
	): void {
		const timestamp = this.formatTimestamp()
		const connId = this.formatConnectionId(connectionId)
		const reasonColored = colorize('yellow', reason)
		const codeInfo = code ? ` (${code})` : ''
		console.log(
			`${timestamp} ${connId} ${colorize('red', 'CLOSE')} ${reasonColored}${codeInfo}`,
		)
	}

	public playerDisconnected(
		userId: string,
		gameId: string,
		reason: string,
	): void {
		const timestamp = this.formatTimestamp()
		const user = this.formatUserId(userId)
		const game = this.formatGameId(gameId)
		const reasonColored = colorize('yellow', reason)
		console.log(
			`${timestamp} ${colorize('red', 'OFFLINE')} ${user} from ${game} (${reasonColored})`,
		)
	}

	public playerReconnected(userId: string, gameId: string): void {
		const timestamp = this.formatTimestamp()
		const user = this.formatUserId(userId)
		const game = this.formatGameId(gameId)
		console.log(
			`${timestamp} ${colorize('green', 'ONLINE')} ${user} to ${game}`,
		)
	}

	public connectionManagerStats(
		total: number,
		gameId?: string,
		gameConnections?: number,
	): void {
		if (isProduction()) return // Skip stats in production

		const timestamp = this.formatTimestamp()
		const totalColored = colorize('cyan', total.toString())
		let message = `${timestamp} ${colorize('blue', 'STATS')} ${totalColored} total`

		if (gameId && gameConnections !== undefined) {
			const game = this.formatGameId(gameId)
			const gameConns = colorize('cyan', gameConnections.toString())
			message += ` | ${game}: ${gameConns}`
		}

		console.log(message)
	}

	public connectionCleanup(connectionId: string, reason: string): void {
		const timestamp = this.formatTimestamp()
		const connId = this.formatConnectionId(connectionId)
		const reasonColored = colorize('yellow', reason)
		console.log(
			`${timestamp} ${connId} ${colorize('yellow', 'CLEANUP')} ${reasonColored}`,
		)
	}

	public broadcastMessage(
		gameId: string,
		messageType: string,
		recipientCount: number,
	): void {
		const timestamp = this.formatTimestamp()
		const game = this.formatGameId(gameId)
		const type = colorize('magenta', messageType)
		const count = colorize('cyan', recipientCount.toString())
		console.log(
			`${timestamp} ${colorize('green', 'BROADCAST')} ${type} to ${count} in ${game}`,
		)
	}

	public error(
		connectionId: string | undefined,
		message: string,
		error?: Error,
	): void {
		const timestamp = this.formatTimestamp()
		const connId = connectionId
			? this.formatConnectionId(connectionId)
			: colorize('red', '[NO_ID]')
		const errorMessage = colorize('red', message)

		console.log(
			`${timestamp} ${connId} ${colorize('red', 'ERROR')} ${errorMessage}`,
		)

		if (error && !isProduction()) {
			console.log(
				`${timestamp} ${connId} ${colorize('red', '   →')} ${error.message}`,
			)
		}
	}
}

export const wsLogger = new WebSocketLogger()
