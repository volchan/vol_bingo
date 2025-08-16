import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export const authKeys = {
	all: ['games'] as const,
	list: () => [...authKeys.all, 'list'] as const,
	create: () => [...authKeys.all, 'create'] as const,
}

export function useListGames() {
	return useQuery({
		queryKey: authKeys.list(),
		queryFn: () => apiClient.getGames(),
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

export function useCreateGame() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: authKeys.create(),
		mutationFn: (gameData: { title: string; friendlyId?: string }) =>
			apiClient.createGame(gameData),
		onSuccess: (newGame) => {
			queryClient.invalidateQueries({ queryKey: authKeys.all })
			queryClient.setQueryData(authKeys.create(), newGame)
		},
		onError: () => {
			queryClient.removeQueries({ queryKey: authKeys.create() })
		},
	})
}
