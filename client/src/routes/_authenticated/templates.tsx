import { createFileRoute } from '@tanstack/react-router'
import { Edit2, Eye, FileText, Loader2, Save, Trash2 } from 'lucide-react'
import { useCallback, useId, useState } from 'react'
import type { TemplateWithCreator } from 'shared'
import { z } from 'zod'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  useDeleteTemplate,
  useTemplate,
  useTemplates,
  useUpdateTemplate,
} from '@/hooks/api/templates.hooks'

const templatesSearchSchema = z.object({
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(25),
})

export const Route = createFileRoute('/_authenticated/templates')({
  component: TemplatesPage,
  validateSearch: (search) => templatesSearchSchema.parse(search),
})

interface TemplateTableData extends TemplateWithCreator {
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onView: (id: string) => void
  isDeleting?: boolean
  canDelete?: boolean
  canEdit?: boolean
}

function TemplatesPage() {
  const { page, pageSize } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: templates = [] } = useTemplates()
  const { mutate: deleteTemplateMutation, isPending } = useDeleteTemplate()
  const { mutate: updateTemplateMutation, isPending: isUpdating } =
    useUpdateTemplate()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>('')
  const [editingDescription, setEditingDescription] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    description?: string
  }>({})

  const { data: viewingTemplate } = useTemplate(viewingId || '', !!viewingId)

  const templateNameId = useId()
  const templateDescriptionId = useId()

  const handleDelete = (id: string) => {
    setDeletingId(id)
    deleteTemplateMutation(id, {
      onSettled: () => setDeletingId(null),
    })
  }

  const handleEditInit = (id: string) => {
    const template = templates.find((t) => t.id === id)
    if (template) {
      setEditingId(id)
      setEditingName(template.name)
      setEditingDescription(template.description || '')
    }
  }

  const editingTemplate = useTemplate(editingId || '', !!editingId)

  const handleEditSave = () => {
    if (!editingId) return

    const template = templates.find((t) => t.id === editingId)
    if (!template) return

    const existingCellIds =
      editingTemplate.data?.templateCells
        ?.sort((a, b) => a.position - b.position)
        ?.map((tc) => tc.cellId) || []

    updateTemplateMutation(
      {
        templateId: editingId,
        data: {
          name: editingName,
          description: editingDescription.trim() || undefined,
          cellIds: existingCellIds,
        },
      },
      {
        onError: (error: unknown) => {
          setFieldErrors({})

          if (typeof error === 'object' && error !== null) {
            const errorObj = error as Record<string, unknown>

            if (Array.isArray(errorObj.issues)) {
              const newFieldErrors: { name?: string; description?: string } = {}

              errorObj.issues.forEach((issue: Record<string, unknown>) => {
                if (Array.isArray(issue.path) && issue.path.length > 0) {
                  const field = issue.path[0]
                  if (field === 'name' || field === 'description') {
                    newFieldErrors[field as keyof typeof newFieldErrors] =
                      String(issue.message || 'Invalid value')
                  }
                }
              })

              setFieldErrors(newFieldErrors)
            } else if (errorObj.message) {
              const message = String(errorObj.message)
              setFieldErrors({ name: message })
            } else {
              setFieldErrors({ name: 'Failed to update template.' })
            }
          } else {
            setFieldErrors({ name: 'Failed to update template.' })
          }
        },
        onSuccess: () => {
          setEditingId(null)
          setEditingName('')
          setEditingDescription('')
        },
      },
    )
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setFieldErrors({})
    setTimeout(() => {
      setEditingName('')
      setEditingDescription('')
    }, 150)
  }

  const handleView = (id: string) => {
    setViewingId(id)
  }

  const tableData: TemplateTableData[] = templates.map((template) => ({
    ...template,
    onDelete: handleDelete,
    onEdit: handleEditInit,
    onView: handleView,
    isDeleting: deletingId === template.id,
    canDelete: template.canDelete !== false,
    canEdit: template.canEdit !== false,
  }))

  const columns = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }: { row: { original: TemplateTableData } }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: TemplateTableData } }) => {
        const date = new Date(row.original.createdAt)
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: TemplateTableData } }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => row.original.onView(row.original.id)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => row.original.onEdit(row.original.id)}
            className="text-orange-600 hover:text-orange-700"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => row.original.onDelete(row.original.id)}
            className={
              row.original.canDelete
                ? 'text-destructive'
                : 'text-muted-foreground'
            }
            disabled={
              (isPending && row.original.isDeleting) || !row.original.canDelete
            }
          >
            {isPending && row.original.isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2
                className={`h-4 w-4 ${!row.original.canDelete ? 'opacity-50' : ''}`}
              />
            )}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <ErrorBoundary>
      <div className="p-4 w-full">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Templates
          </h1>
          <p className="text-muted-foreground">Manage your bingo templates</p>
        </div>
        <DataTable
          columns={columns}
          data={tableData}
          filterColumn="name"
          pagination={{
            pageIndex: page - 1,
            pageSize,
            onPaginationChange: useCallback(
              (updater) => {
                const currentState = { pageIndex: page - 1, pageSize }
                const newPagination =
                  typeof updater === 'function'
                    ? updater(currentState)
                    : updater

                if (
                  newPagination.pageIndex !== currentState.pageIndex ||
                  newPagination.pageSize !== currentState.pageSize
                ) {
                  navigate({
                    search: {
                      page: newPagination.pageIndex + 1,
                      pageSize: newPagination.pageSize,
                    },
                  })
                }
              },
              [page, pageSize, navigate],
            ),
          }}
        />

        <Dialog
          open={!!viewingId}
          onOpenChange={(open) => !open && setViewingId(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Details</DialogTitle>
              <DialogDescription>
                View template cells and information
              </DialogDescription>
            </DialogHeader>

            {viewingTemplate && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {viewingTemplate.name}
                  </h3>
                  {viewingTemplate.description && (
                    <p className="text-muted-foreground mt-1">
                      {viewingTemplate.description}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">
                    Template Cells ({viewingTemplate.templateCells?.length || 0}
                    /25)
                  </h4>
                  <div className="grid grid-cols-5 gap-2 max-w-lg">
                    {viewingTemplate.templateCells
                      ?.sort((a, b) => a.position - b.position)
                      .map((templateCell) => (
                        <div
                          key={templateCell.id}
                          className="aspect-square bg-muted rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center p-1"
                        >
                          <span className="text-xs text-center break-words">
                            {templateCell.cell?.value || '[Deleted]'}
                          </span>
                        </div>
                      )) ||
                      Array.from({ length: 25 }, (_, i) => {
                        const cellNumber = i + 1
                        return (
                          <div
                            key={`empty-cell-${cellNumber}`}
                            className="aspect-square bg-muted/30 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center"
                          >
                            <span className="text-xs text-muted-foreground">
                              {cellNumber}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    Created:{' '}
                    {new Date(viewingTemplate.createdAt).toLocaleString()}
                  </p>
                  {viewingTemplate.updatedAt && (
                    <p>
                      Updated:{' '}
                      {new Date(viewingTemplate.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!editingId}
          onOpenChange={(open) => {
            if (!open) {
              handleEditCancel()
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Update template name and description
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor={templateNameId} className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id={templateNameId}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  disabled={isUpdating}
                  placeholder="Template name"
                  autoFocus
                  className={
                    fieldErrors.name
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                />
                {fieldErrors.name && (
                  <p className="text-sm text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={templateDescriptionId}
                  className="text-sm font-medium"
                >
                  Description (optional)
                </label>
                <Input
                  id={templateDescriptionId}
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  disabled={isUpdating}
                  placeholder="Description"
                  className={
                    fieldErrors.description
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                />
                {fieldErrors.description && (
                  <p className="text-sm text-red-600">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="ghost"
                  onClick={handleEditCancel}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSave}
                  disabled={isUpdating || !editingName.trim()}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  )
}
