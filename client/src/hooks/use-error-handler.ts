import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { logError, shouldRedirectToLogin } from '@/lib/error-utils'

interface UseErrorHandlerOptions {
	context?: string
	redirectOnAuth?: boolean
	onError?: (error: unknown) => void
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
	const navigate = useNavigate()
	const { context, redirectOnAuth = true, onError } = options

	const handleError = useCallback(
		(error: unknown) => {
			logError(error, context)

			if (redirectOnAuth && shouldRedirectToLogin(error)) {
				navigate({ to: '/' })
				return
			}

			onError?.(error)
		},
		[navigate, context, redirectOnAuth, onError],
	)

	const handleAsyncError = useCallback(
		async <T>(asyncFn: () => Promise<T>): Promise<T> => {
			try {
				return await asyncFn()
			} catch (error) {
				handleError(error)
				throw error
			}
		},
		[handleError],
	)

	return {
		handleError,
		handleAsyncError,
	}
}
