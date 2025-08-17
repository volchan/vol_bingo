import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export const cellsKeys = {
	all: ['cells'] as const,
	list: () => [...cellsKeys.all, 'cells'] as const,
	search: (query: string) => [...cellsKeys.all, 'search', query] as const,
}

export function useGetCells() {
	return useQuery({
		queryKey: cellsKeys.list(),
		queryFn: () => apiClient.getCells(),
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		retry: (failureCount, error) => {
			if (error?.message.includes('Unauthorized')) return false
			return failureCount < 2
		},
	})
}

export function useSearchCells(query: string) {
	return useQuery({
		queryKey: cellsKeys.search(query),
		queryFn: () => apiClient.searchCells(query),
		enabled: !!query.trim() && query.length >= 1,
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 2 * 60 * 1000, // 2 minutes
	})
}

export function useCreateCell() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: { value: string }) => apiClient.createCell(data),
		onSuccess: () => {
			// Invalidate search queries to include the new cell
			queryClient.invalidateQueries({ queryKey: cellsKeys.all })
		},
	})
}

export function useLinkCellToGame() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: { cellId: string; gameId: string }) =>
			apiClient.linkCellToGame(data.cellId, data.gameId),
		onSuccess: () => {
			// Invalidate all game queries to refresh linked cells
			queryClient.invalidateQueries({
				queryKey: ['games'],
			})
		},
	})
}

export function useUnlinkCell() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: { gameCellId: string; gameId: string }) =>
			apiClient.unlinkCell(data.gameCellId),
		onSuccess: () => {
			// Invalidate all game queries to refresh linked cells
			queryClient.invalidateQueries({
				queryKey: ['games'],
			})
		},
	})
}

export function useDeleteCell() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (cellId: string) => apiClient.deleteCell(cellId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: cellsKeys.all })
		},
	})
}

export function useUpdateCell() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: { id: string; value: string }) =>
			apiClient.updateCell(data.id, data.value),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: cellsKeys.all })
		},
	})
}
