import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PlayerBoard } from 'shared'
import { apiClient } from '@/lib/api'

export const playerBoardKeys = {
	all: ['playerBoards'] as const,
	detail: (friendlyId: string) =>
		[...playerBoardKeys.all, 'board', friendlyId] as const,
}

export function usePlayerBoard(friendlyId: string, enabled: boolean = true) {
	return useQuery({
		queryKey: playerBoardKeys.detail(friendlyId),
		queryFn: () => apiClient.getPlayerBoard(friendlyId),
		staleTime: 0, // Always consider stale so it refetches when needed
		gcTime: 10 * 60 * 1000,
		enabled: !!friendlyId && enabled,
		retry: (failureCount, error) => {
			if (error?.message.includes('Unauthorized')) return false
			if (error?.message.includes('not available')) return false // Don't retry if board not available
			return failureCount < 2
		},
	})
}

export function useMarkGameCell() {
	return useMutation({
		mutationFn: (data: { gameCellId: string; marked: boolean }) =>
			apiClient.markGameCell(data.gameCellId, data.marked),
		onError: (error) => {
			console.error('Failed to mark cell:', error)
		},
	})
}

export function useShufflePlayerBoard() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (playerBoardId: string) =>
			apiClient.shufflePlayerBoard(playerBoardId),
		onSuccess: (updatedPlayerBoard, playerBoardId) => {
			queryClient.setQueriesData(
				{ queryKey: playerBoardKeys.all },
				(old: PlayerBoard | undefined) => {
					if (old?.id === playerBoardId) {
						return updatedPlayerBoard
					}
					return old
				},
			)
		},
		onError: (error) => {
			console.error('Failed to shuffle player board:', error)
		},
	})
}
