import type { QueryClient } from '@tanstack/react-query'
import { authKeys } from '@/hooks/api/auth.hooks'

export class QueryUtils {
	constructor(private readonly queryClient: QueryClient) {}

	clearAuthData() {
		this.queryClient.removeQueries({ queryKey: authKeys.all })
		this.queryClient.setQueryData(authKeys.user(), null)
		localStorage.removeItem('auth_tokens')
	}

	invalidateAuthData() {
		this.queryClient.invalidateQueries({ queryKey: authKeys.all })
	}

	invalidateAll() {
		this.queryClient.invalidateQueries()
	}

	clearAll() {
		this.queryClient.clear()
	}

	async optimisticUpdate<T>(
		queryKey: unknown[],
		updaterFn: (oldData: T | undefined) => T,
	) {
		await this.queryClient.cancelQueries({ queryKey })
		const previousData = this.queryClient.getQueryData<T>(queryKey)
		this.queryClient.setQueryData(queryKey, updaterFn(previousData))
		return { previousData }
	}

	async prefetchQuery<T>(
		queryKey: unknown[],
		queryFn: () => Promise<T>,
		staleTime = 5 * 60 * 1000,
	) {
		return this.queryClient.prefetchQuery({
			queryKey,
			queryFn,
			staleTime,
		})
	}

	getCachedData<T>(queryKey: unknown[]): T | undefined {
		return this.queryClient.getQueryData<T>(queryKey)
	}

	setCachedData<T>(queryKey: unknown[], data: T) {
		this.queryClient.setQueryData(queryKey, data)
	}
}

let queryUtils: QueryUtils | null = null

export function setQueryUtils(queryClient: QueryClient) {
	queryUtils = new QueryUtils(queryClient)
}

export function getQueryUtils(): QueryUtils {
	if (!queryUtils) {
		throw new Error('QueryUtils not initialized. Call setQueryUtils first.')
	}
	return queryUtils
}
