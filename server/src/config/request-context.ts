import { AsyncLocalStorage } from 'async_hooks'

interface RequestContext {
	requestId: string
	timestamp: string
}

// AsyncLocalStorage to store request context across async operations
export const requestContextStorage = new AsyncLocalStorage<RequestContext>()

/**
 * Get the current request ID from the async context
 */
export const getCurrentRequestId = (): string | undefined => {
	const context = requestContextStorage.getStore()
	return context?.requestId
}

/**
 * Get the current request timestamp from the async context
 */
export const getCurrentRequestTimestamp = (): string | undefined => {
	const context = requestContextStorage.getStore()
	return context?.timestamp
}

/**
 * Set the request context for the current async operation
 */
export const setRequestContext = (requestId: string, timestamp?: string) => {
	const context: RequestContext = {
		requestId,
		timestamp: timestamp || new Date().toISOString(),
	}
	return context
}

/**
 * Run a function with the given request context
 */
export const runWithRequestContext = <T>(
	requestId: string,
	fn: () => T,
	timestamp?: string,
): T => {
	const context = setRequestContext(requestId, timestamp)
	return requestContextStorage.run(context, fn)
}
