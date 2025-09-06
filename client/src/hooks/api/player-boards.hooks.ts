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
    staleTime: 500, // 500ms buffer to reduce excessive refetching
    gcTime: 10 * 60 * 1000,
    enabled: !!friendlyId && enabled,
    retry: (failureCount, error) => {
      if (error?.message.includes('Unauthorized')) return false
      if (error?.message.includes('not available')) return false // Don't retry if board not available
      return failureCount < 2
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
  })
}
