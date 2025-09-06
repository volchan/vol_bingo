import { createFileRoute } from '@tanstack/react-router'
import { Edit2, Loader2, Save, Trash2, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { z } from 'zod'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import type { Cell } from '@/components/ui/columns'
import { DataTable } from '@/components/ui/data-table'
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  const handleEditSave = (id: string) => {
    updateCellMutation(
      { id, value: editingValue },
      {
        onError: (error: unknown) => {
          const message =
            typeof error === 'object' && error !== null && 'message' in error
              ? (error as { message?: string }).message
              : undefined
          setErrorMsg(message || 'Failed to update cell.')
          if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
          errorTimeoutRef.current = setTimeout(() => setErrorMsg(null), 4000)
        },
        onSettled: () => {
          setEditingId(null)
          setEditingValue('')
        },
      },
    )
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingValue('')
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
      cell: ({ row }: { row: { original: Cell } }) => {
        const isEditingRow = editingId === row.original.id
        if (isEditingRow) {
          return (
            <div className="space-y-2">
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                disabled={isUpdating}
                placeholder="Cell value"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditSave(row.original.id)}
                  disabled={isUpdating || !editingValue.trim()}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEditCancel}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )
        }
        return (
          <div>
            <div className="font-medium">{row.original.value}</div>
          </div>
        )
      },
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
            disabled={editingId === row.original.id || !row.original.canEdit}
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
        <h1 className="text-2xl font-bold mb-4">Cells</h1>
        {errorMsg && (
          <div className="mb-2 text-red-600 bg-red-100 border border-red-300 rounded px-3 py-2">
            {errorMsg}
          </div>
        )}
        <DataTable 
          columns={columns} 
          data={tableData} 
          filterColumn="value"
          pagination={{
            pageIndex: page - 1,
            pageSize,
            onPaginationChange: useCallback((updater) => {
              const currentState = { pageIndex: page - 1, pageSize }
              const newPagination = typeof updater === 'function' 
                ? updater(currentState)
                : updater
              
              if (newPagination.pageIndex !== currentState.pageIndex || newPagination.pageSize !== currentState.pageSize) {
                navigate({
                  search: {
                    page: newPagination.pageIndex + 1,
                    pageSize: newPagination.pageSize,
                  },
                })
              }
            }, [page, pageSize, navigate]),
          }}
        />
      </div>
    </ErrorBoundary>
  )
}
