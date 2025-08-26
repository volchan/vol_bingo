import { createFileRoute } from '@tanstack/react-router'
import { Loader2, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { z } from 'zod'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { columns as baseColumns, type Cell } from '@/components/ui/columns'
import { DataTable } from '@/components/ui/data-table'
import {
	useDeleteCell,
	useGetCells,
	useUpdateCell,
} from '@/hooks/api/cells.hooks'

const cellsSearchSchema = z.object({
	page: z.coerce.number().default(0),
	pageSize: z.coerce.number().default(25),
})

export const Route = createFileRoute('/_authenticated/cells')({
	component: CellsPage,
	validateSearch: (search) => cellsSearchSchema.parse(search),
})

function CellsPage() {
	// const { user } = useAuth()
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
				onError: (error: any) => {
					setErrorMsg(error?.message || 'Failed to update cell.')
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

	const tableData: Cell[] = cells.map((cell) => ({
		id: cell.id,
		value: cell.value,
		createdAt:
			typeof cell.createdAt === 'string'
				? cell.createdAt
				: cell.createdAt.toISOString(),
		onDelete: handleDelete,
		// Editing props for controlled cell UI
		isEditing: editingId === cell.id,
		editingValue: editingId === cell.id ? editingValue : cell.value,
		isUpdating,
		editError: editingId === cell.id ? errorMsg : null,
		onEditInit: handleEditInit,
		onEditChange: (val: string) => setEditingValue(val),
		onEditSave: handleEditSave,
		onEditCancel: handleEditCancel,
		// For type compatibility
		onEdit: handleEditInit,
	}))

	const columns = baseColumns.map((col) => {
		if (col.id === 'actions') {
			return {
				...col,
				cell: ({ row }: { row: { original: Cell } }) => (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => row.original.onDelete?.(row.original.id)}
						className="text-destructive"
						disabled={isPending && deletingId === row.original.id}
					>
						{isPending && deletingId === row.original.id ? (
							<Loader2 className="animate-spin" />
						) : (
							<Trash2 />
						)}
					</Button>
				),
			}
		}
		if (col.id === 'value') {
			return {
				...col,
				cell: ({ row }: { row: { original: Cell } }) => {
					const isEditingRow = editingId === row.original.id
					if (isEditingRow) {
						return (
							<div className="flex gap-2 items-center">
								<input
									className="border rounded px-2 py-1 text-sm"
									value={editingValue}
									onChange={(e) => setEditingValue(e.target.value)}
									disabled={isUpdating}
								/>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleEditSave(row.original.id)}
									disabled={isUpdating}
								>
									Save
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={handleEditCancel}
									disabled={isUpdating}
								>
									Cancel
								</Button>
							</div>
						)
					}
					return (
						<button
							type="button"
							className="cursor-pointer hover:underline bg-transparent border-none p-0 text-left"
							onClick={() =>
								handleEditInit(row.original.id, row.original.value)
							}
						>
							{row.original.value}
						</button>
					)
				},
			}
		}
		return col
	})

	return (
		<ErrorBoundary>
			<div className="p-4 w-full">
				<h1 className="text-2xl font-bold mb-4">Cells</h1>
				{errorMsg && (
					<div className="mb-2 text-red-600 bg-red-100 border border-red-300 rounded px-3 py-2">
						{errorMsg}
					</div>
				)}
				<DataTable columns={columns} data={tableData} filterColumn="value" />
			</div>
		</ErrorBoundary>
	)
}
