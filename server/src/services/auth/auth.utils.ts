import env from '@server/config/env'
import type { StateManager } from './auth.types'

class InMemoryStateManager implements StateManager {
	private readonly states = new Set<string>()
	private readonly maxStates = 1000

	generateState(): string {
		const state =
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15)

		this.states.add(state)
		this.cleanupStates()
		return state
	}

	validateState(state: string): boolean {
		const isValid = this.states.has(state)
		if (isValid) this.states.delete(state)

		return isValid
	}

	cleanupStates(): void {
		if (this.states.size > this.maxStates) {
			const statesArray = Array.from(this.states)
			this.states.clear()
			statesArray.slice(-100).forEach((state) => this.states.add(state))
		}
	}
}

export const stateManager = new InMemoryStateManager()

export function buildAuthUrl(config: {
	clientId: string
	redirectUri: string
	scopes: string[]
	state: string
}): string {
	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		response_type: 'code',
		scope: config.scopes.join(' '),
		state: config.state,
	})

	return `${env.TWITCH_OAUTH_URL}/authorize?${params.toString()}`
}

export function buildErrorRedirectUrl(
	frontendUrl: string,
	error: string,
): string {
	const url = new URL(frontendUrl)
	url.searchParams.set('error', error)
	return url.toString()
}

export function buildSuccessRedirectUrl(
	frontendUrl: string,
	token: string,
	refreshToken: string,
	expiresIn: number,
): string {
	const url = new URL(`${frontendUrl}/auth/callback`)

	url.searchParams.set('token', token)
	url.searchParams.set('refresh_token', refreshToken)
	url.searchParams.set('expires_in', expiresIn.toString())
	return url.toString()
}
