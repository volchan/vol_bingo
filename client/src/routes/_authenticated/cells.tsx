import { createFileRoute } from '@tanstack/react-router'
import { Blocks, Edit2, Loader2, Save, Trash2 } from 'lucide-react'
import { useCallback, useId, useState } from 'react'
import { z } from 'zod'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import type { Cell } from '@/components/ui/columns'
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
  useDeleteCell,
  useGetCells,
  useUpdateCell,
} from '@/hooks/api/cells.hooks'

const cellsSearchSchema = z.object({
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(25),
})

export const Route = createFileRoute('/_authenticated/cells')({
  component: CellsPage,
  validateSearch: (search) => cellsSearchSchema.parse(search),
})

function CellsPage() {
  const { page, pageSize } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: cells = [] } = useGetCells()
  const { mutate: deleteCellMutation, isPending } = useDeleteCell()
  const { mutate: updateCellMutation, isPending: isUpdating } = useUpdateCell()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<{
    value?: string
  }>({})

  const cellValueId = useId()

  const handleDelete = (id: string) => {
    setDeletingId(id)
    deleteCellMutation(id, {
      onSettled: () => setDeletingId(null),
    })
  }

  const handleEditInit = (id: string, value: string) => {
    setEditingId(id)
    setEditingValue(value)
  }

  const handleEditSave = () => {
    if (!editingId) return

    updateCellMutation(
      { id: editingId, value: editingValue },
      {
        onError: (error: unknown) => {
          setFieldErrors({})

          if (typeof error === 'object' && error !== null) {
            const errorObj = error as Record<string, unknown>

            if (Array.isArray(errorObj.issues)) {
              const newFieldErrors: { value?: string } = {}

              errorObj.issues.forEach((issue: Record<string, unknown>) => {
                if (Array.isArray(issue.path) && issue.path.length > 0) {
                  const field = issue.path[0]
                  if (field === 'value') {
                    newFieldErrors.value = String(
                      issue.message || 'Invalid value',
                    )
                  }
                }
              })

              setFieldErrors(newFieldErrors)
            } else if (errorObj.message) {
              const message = String(errorObj.message)
              setFieldErrors({ value: message })
            } else {
              setFieldErrors({ value: 'Failed to update cell.' })
            }
          } else {
            setFieldErrors({ value: 'Failed to update cell.' })
          }
        },
        onSuccess: () => {
          setEditingId(null)
          setEditingValue('')
        },
      },
    )
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setFieldErrors({})
    setTimeout(() => {
      setEditingValue('')
    }, 150)
  }

  const tableData = cells.map((cell) => ({
    id: cell.id,
    value: cell.value,
    createdAt:
      typeof cell.createdAt === 'string'
        ? cell.createdAt
        : cell.createdAt.toISOString(),
    canEdit: cell.canEdit,
    canDelete: cell.canDelete,
  }))

  const columns = [
    {
      id: 'value',
      header: 'Value',
      accessorKey: 'value',
      cell: ({ row }: { row: { original: Cell } }) => (
        <div>
          <div className="font-medium">{row.original.value}</div>
        </div>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: Cell } }) => {
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
      cell: ({ row }: { row: { original: Cell } }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditInit(row.original.id, row.original.value)}
            className={
              row.original.canEdit
                ? 'text-orange-600 hover:text-orange-700'
                : 'text-muted-foreground'
            }
            disabled={!row.original.canEdit}
          >
            <Edit2
              className={`h-4 w-4 ${!row.original.canEdit ? 'opacity-50' : ''}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            className={
              row.original.canDelete
                ? 'text-destructive'
                : 'text-muted-foreground'
            }
            disabled={
              (isPending && deletingId === row.original.id) ||
              !row.original.canDelete
            }
          >
            {isPending && deletingId === row.original.id ? (
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
            <Blocks className="h-8 w-8" />
            Cells
          </h1>
          <p className="text-muted-foreground">Manage your bingo cells</p>
        </div>
        <DataTable
          columns={columns}
          data={tableData}
          filterColumn="value"
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
          open={!!editingId}
          onOpenChange={(open) => {
            if (!open) {
              handleEditCancel()
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Cell</DialogTitle>
              <DialogDescription>Update the cell value</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor={cellValueId} className="text-sm font-medium">
                  Value
                </label>
                <Input
                  id={cellValueId}
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  disabled={isUpdating}
                  placeholder="Cell value"
                  autoFocus
                  className={
                    fieldErrors.value
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                />
                {fieldErrors.value && (
                  <p className="text-sm text-red-600">{fieldErrors.value}</p>
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
                  disabled={isUpdating || !editingValue.trim()}
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
