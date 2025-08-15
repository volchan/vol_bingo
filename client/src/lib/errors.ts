export class ApiError extends Error {
	constructor(
		public status: number,
		public statusText: string,
		message?: string,
	) {
		super(message || `HTTP ${status}: ${statusText}`)
		this.name = 'ApiError'
	}
}

export class AuthError extends ApiError {
	constructor(status: number, statusText: string, message?: string) {
		super(status, statusText, message)
		this.name = 'AuthError'
	}
}

export class NetworkError extends Error {
	constructor(message?: string) {
		super(message || 'Network error occurred')
		this.name = 'NetworkError'
	}
}

export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError
}

export function isAuthError(error: unknown): error is AuthError {
	return error instanceof AuthError
}

export function isNetworkError(error: unknown): error is NetworkError {
	return error instanceof NetworkError
}

export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
} as const

export function isClientError(status: number): boolean {
	return status >= 400 && status < 500
}

export function isServerError(status: number): boolean {
	return status >= 500
}

export function isAuthenticationError(status: number): boolean {
	return status === HTTP_STATUS.UNAUTHORIZED || status === HTTP_STATUS.FORBIDDEN
}
