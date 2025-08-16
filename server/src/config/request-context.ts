import { AsyncLocalStorage } from 'node:async_hooks'

interface RequestContext {
	requestId: string
	timestamp: string
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>()

export const getCurrentRequestId = (): string | undefined => {
	const context = requestContextStorage.getStore()
	return context?.requestId
}

export const getCurrentRequestTimestamp = (): string | undefined => {
	const context = requestContextStorage.getStore()
	return context?.timestamp
}

export const setRequestContext = (requestId: string, timestamp?: string) => {
	const context: RequestContext = {
		requestId,
		timestamp: timestamp || new Date().toISOString(),
	}
	return context
}

export const runWithRequestContext = <T>(
	requestId: string,
	fn: () => T,
	timestamp?: string,
): T => {
	const context = setRequestContext(requestId, timestamp)
	return requestContextStorage.run(context, fn)
}
