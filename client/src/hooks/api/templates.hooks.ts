import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateTemplateRequest,
  Template,
  TemplateWithCells,
  TemplateWithCreator,
} from 'shared'
import { apiClient } from '@/lib/api'

// Get user's templates
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: (): Promise<TemplateWithCreator[]> => apiClient.getTemplates(),
  })
}

// Check if template name exists
export function useCheckTemplateName(
  name: string,
  excludeId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['templates', 'check-name', name, excludeId],
    queryFn: (): Promise<{ exists: boolean }> =>
      apiClient.checkTemplateName(name, excludeId),
    enabled: enabled && !!name.trim(),
    staleTime: 1000, // 1 second
  })
}

// Get template with cells
export function useTemplate(templateId: string, enabled = true) {
  return useQuery({
    queryKey: ['templates', templateId],
    queryFn: (): Promise<TemplateWithCells> =>
      apiClient.getTemplate(templateId),
    enabled: enabled && !!templateId,
  })
}

// Create template
export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTemplateRequest): Promise<Template> =>
      apiClient.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

// Update template
export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string
      data: CreateTemplateRequest
    }): Promise<Template> => apiClient.updateTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

// Delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (templateId: string): Promise<void> =>
      apiClient.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

// Apply template to game
export function useApplyTemplate() {
  return useMutation({
    mutationFn: ({
      gameId,
      templateId,
    }: {
      gameId: string
      templateId: string
    }): Promise<void> => apiClient.applyTemplate(gameId, templateId),
  })
}
