import type { ColumnDef } from '@tanstack/react-table'

export type Cell = {
  id: string
  value: string
  createdAt: string
  onDelete?: (id: string) => void
  onEdit?: (id: string, value: string) => void
  canDelete?: boolean
  canEdit?: boolean
}

export const columns: ColumnDef<Cell>[] = [
  {
    accessorKey: 'value',
    header: 'Value',
    cell: ({ row }) => row.original.value,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <button
        type="button"
        className="text-destructive bg-transparent border-none p-0 cursor-pointer"
        onClick={() => row.original.onDelete?.(row.original.id)}
      >
        Delete
      </button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
]
