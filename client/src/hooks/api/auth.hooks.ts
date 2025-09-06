import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  profile: (userId: string) => [...authKeys.all, 'profile', userId] as const,
}

export function useUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => apiClient.getCurrentUser(),
    enabled: !!localStorage.getItem('auth_tokens'),
    retry: (failureCount, error) => {
      if (error?.message.includes('Unauthorized')) return false
      return failureCount < 2
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.all })
      queryClient.setQueryData(authKeys.user(), null)
    },
    onError: () => {
      queryClient.removeQueries({ queryKey: authKeys.all })
      localStorage.removeItem('auth_tokens')
    },
  })
}

export function useRefreshToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.refreshToken(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
    onError: () => {
      queryClient.removeQueries({ queryKey: authKeys.all })
      localStorage.removeItem('auth_tokens')
    },
  })
}
