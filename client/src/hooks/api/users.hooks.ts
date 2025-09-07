import { useMutation, useQuery } from '@tanstack/react-query'
import type { User } from 'shared'
import { apiClient } from '@/lib/api'

interface StreamTokenResponse {
  success: boolean
  token?: string
  error?: string
}

export const useUser = () => {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async (): Promise<User> => {
      return await apiClient.getUser()
    },
  })
}

export const useGenerateStreamToken = () => {
  return useMutation({
    mutationFn: async (): Promise<StreamTokenResponse> => {
      return await apiClient.generateStreamToken()
    },
    onSuccess: (data) => {
      if (data.success) {
        console.log('Stream token generated successfully')
      } else {
        throw new Error(data.error || 'Failed to generate stream token')
      }
    },
  })
}

export const useRollStreamToken = () => {
  return useMutation({
    mutationFn: async (): Promise<StreamTokenResponse> => {
      return await apiClient.rollStreamToken()
    },
    onSuccess: (data) => {
      if (data.success) {
        console.log('Stream token rolled successfully')
      } else {
        throw new Error(data.error || 'Failed to roll stream token')
      }
    },
  })
}
