import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export const authKeys = {
	all: ['games'] as const,
	played: () => [...authKeys.all, 'played'] as const,
	detail: (friendlyId: string) =>
		[...authKeys.all, 'game', friendlyId] as const,
	players: (friendlyId: string) =>
		[...authKeys.all, 'game', friendlyId, 'players'] as const,
	create: () => [...authKeys.all, 'game'] as const,
}

export function usePlayedGames() {
	return useQuery({
		queryKey: authKeys.played(),
		queryFn: () => apiClient.getPlayedGames(),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		retry: (failureCount, error) => {
			if (error?.message.includes('Unauthorized')) return false
			return failureCount < 2
		},
	})
}

export function useGame(friendlyId: string) {
	return useQuery({
		queryKey: authKeys.detail(friendlyId),
		queryFn: () => apiClient.getGameByFriendlyId(friendlyId),
		staleTime: 0, // Always consider stale so invalidation works immediately
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false, // Reduce aggressive refetching
		refetchOnMount: true,
		retry: (failureCount, error) => {
			if (error?.message.includes('Unauthorized')) return false
			return failureCount < 2
		},
		enabled: !!friendlyId, // Only run query if friendlyId is provided
	})
}

export function useGamePlayers(friendlyId: string) {
	return useQuery({
		queryKey: authKeys.players(friendlyId),
		queryFn: () => apiClient.getGamePlayers(friendlyId),
		staleTime: 0, // Always consider stale for immediate updates
		gcTime: 5 * 60 * 1000,
		refetchOnWindowFocus: true, // Refresh when window gains focus
		refetchOnMount: true,
		refetchInterval: 5 * 1000, // Refresh every 5 seconds as fallback
		retry: (failureCount, error) => {
			if (error?.message.includes('Unauthorized')) return false
			return failureCount < 2
		},
		enabled: !!friendlyId,
	})
}

export function useCreateGame() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: authKeys.create(),
		mutationFn: (gameData: { title: string; friendlyId?: string }) =>
			apiClient.createGame(gameData),
		onSuccess: (newGame) => {
			queryClient.setQueryData(authKeys.create(), newGame)
		},
		onError: () => {
			queryClient.removeQueries({ queryKey: authKeys.create() })
		},
	})
}

export function useReadyGame() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (friendlyId: string) => apiClient.readyGame(friendlyId),
		onSuccess: (updatedGame) => {
			try {
				// Update the individual game cache with the complete data
				queryClient.setQueryData(
					authKeys.detail(updatedGame.friendlyId),
					updatedGame,
				)
				// Invalidate the games list to refresh it
				queryClient.invalidateQueries({
					queryKey: authKeys.played(),
					exact: true,
				})
			} catch (_error) {
				// Fallback to invalidating all game queries
				queryClient.invalidateQueries({ queryKey: authKeys.all })
			}
		},
		onError: (_error, friendlyId) => {
			try {
				// Only invalidate the specific game query on error
				queryClient.invalidateQueries({
					queryKey: authKeys.detail(friendlyId),
					exact: true,
				})
			} catch (_error) {}
		},
	})
}

export function useStartGame() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (friendlyId: string) => apiClient.startGame(friendlyId),
		onSuccess: (updatedGame) => {
			try {
				// Update the individual game cache with the complete data
				queryClient.setQueryData(
					authKeys.detail(updatedGame.friendlyId),
					updatedGame,
				)
				// Invalidate the games list to refresh it
				queryClient.invalidateQueries({
					queryKey: authKeys.played(),
					exact: true,
				})
			} catch (_error) {
				// Fallback to invalidating all game queries
				queryClient.invalidateQueries({ queryKey: authKeys.all })
			}
		},
		onError: (_error, friendlyId) => {
			try {
				// Only invalidate the specific game query on error
				queryClient.invalidateQueries({
					queryKey: authKeys.detail(friendlyId),
					exact: true,
				})
			} catch (_error) {}
		},
	})
}

export function useEditGame() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (friendlyId: string) => apiClient.editGame(friendlyId),
		onSuccess: (updatedGame) => {
			try {
				// Update the individual game cache with the complete data
				queryClient.setQueryData(
					authKeys.detail(updatedGame.friendlyId),
					updatedGame,
				)
				// Invalidate the games list to refresh it
				queryClient.invalidateQueries({
					queryKey: authKeys.played(),
					exact: true,
				})
			} catch (_error) {
				// Fallback to invalidating all game queries
				queryClient.invalidateQueries({ queryKey: authKeys.all })
			}
		},
		onError: (_error, friendlyId) => {
			try {
				// Only invalidate the specific game query on error
				queryClient.invalidateQueries({
					queryKey: authKeys.detail(friendlyId),
					exact: true,
				})
			} catch (_error) {}
		},
	})
}
