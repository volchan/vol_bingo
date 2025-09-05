import { ApiError, AuthError, NetworkError } from '@/lib/errors'

export type ErrorType = 
	| 'network'
	| 'unauthorized'
	| 'forbidden'
	| 'not-found'
	| 'server'
	| 'validation'
	| 'unknown'

export interface ErrorInfo {
	type: ErrorType
	message: string
	statusCode?: number
	details?: string
}

export function getErrorType(error: unknown): ErrorType {
	if (error instanceof NetworkError) {
		return 'network'
	}
	
	if (error instanceof AuthError) {
		if (error.status === 401) return 'unauthorized'
		if (error.status === 403) return 'forbidden'
	}
	
	if (error instanceof ApiError) {
		if (error.status === 404) return 'not-found'
		if (error.status >= 400 && error.status < 500) return 'validation'
		if (error.status >= 500) return 'server'
	}
	
	if (error instanceof Error) {
		const message = error.message.toLowerCase()
		if (message.includes('network') || message.includes('fetch')) return 'network'
		if (message.includes('unauthorized') || message.includes('401')) return 'unauthorized'
		if (message.includes('forbidden') || message.includes('403')) return 'forbidden'
		if (message.includes('not found') || message.includes('404')) return 'not-found'
		if (message.includes('server') || message.includes('500')) return 'server'
	}
	
	return 'unknown'
}

export function getErrorStatus(error: unknown): number | undefined {
	if (error instanceof ApiError || error instanceof AuthError) {
		return error.status
	}
	
	if (error instanceof Error) {
		const match = error.message.match(/HTTP (\d+)/)
		if (match) {
			return parseInt(match[1], 10)
		}
	}
	
	return undefined
}

export function getErrorInfo(error: unknown): ErrorInfo {
	const type = getErrorType(error)
	
	if (error instanceof ApiError || error instanceof AuthError) {
		return {
			type,
			message: error.message,
			statusCode: error.status,
			details: error.details
		}
	}
	
	if (error instanceof NetworkError) {
		return {
			type: 'network',
			message: 'Unable to connect to the server',
			details: error.message
		}
	}
	
	if (error instanceof Error) {
		return {
			type,
			message: error.message,
		}
	}
	
	return {
		type: 'unknown',
		message: 'An unexpected error occurred',
		details: String(error)
	}
}

export function getUserFriendlyErrorMessage(error: unknown): string {
	const info = getErrorInfo(error)
	
	switch (info.type) {
		case 'network':
			return 'Unable to connect to the server. Please check your internet connection.'
		case 'unauthorized':
			return 'You need to sign in to access this resource.'
		case 'forbidden':
			return "You don't have permission to access this resource."
		case 'not-found':
			return 'The requested resource could not be found.'
		case 'server':
			return 'A server error occurred. Please try again later.'
		case 'validation':
			return info.message || 'Please check your input and try again.'
		default:
			return info.message || 'An unexpected error occurred.'
	}
}

export function logError(error: unknown, context?: string) {
	const info = getErrorInfo(error)
	const prefix = context ? `[${context}]` : '[Error]'
	
	console.error(
		`${prefix} ${info.type.toUpperCase()}:`,
		info.message,
		{
			type: info.type,
			statusCode: info.statusCode,
			details: info.details,
			originalError: error
		}
	)
}

export function shouldRetry(error: unknown): boolean {
	const info = getErrorInfo(error)
	return info.type === 'network' || info.type === 'server'
}

export function shouldRedirectToLogin(error: unknown): boolean {
	const info = getErrorInfo(error)
	return info.type === 'unauthorized'
}