import type {
	ColumnDef,
	ColumnFiltersState,
	RowSelectionState,
	SortingState,
	VisibilityState,
} from '@tanstack/react-table'
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table'
import React from 'react'
import { Input } from '@/components/ui/input'
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
export function DataTable<TData, TValue>({
	columns,
	data,
	filterColumn = 'value',
}: Readonly<{
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	filterColumn?: string
}>) {
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	)
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({})
	const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

	// Default pagination state (not synced with URL for generic use)
	const pageSize = 25
	const pageIndex = 0
	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination: { pageSize, pageIndex },
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		debugTable: false,
	})

	return (
		<div>
			<div className="flex items-center py-4 gap-2">
				<Input
					placeholder={`Filter ${filterColumn}...`}
					value={
						(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ''
					}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						table.getColumn(filterColumn)?.setFilterValue(event.target.value)
					}
					className="max-w-sm"
				/>
			</div>
			<div className="overflow-hidden rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="py-4 flex">
				<div className="self-start flex-1 flex items-center gap-2">
					<span className="text-sm font-medium">Rows per page</span>
					<Select
						value={String(Math.max(table.getState().pagination.pageSize, 25))}
						onValueChange={(value) => {
							table.setPageSize(Number(value))
						}}
					>
						<SelectTrigger className="h-8 w-[70px] min-w-fit">
							<SelectValue
								placeholder={String(table.getState().pagination.pageSize)}
							/>
						</SelectTrigger>
						<SelectContent side="top">
							{[25, 50, 100, 200].map((pageSize) => (
								<SelectItem key={pageSize} value={String(pageSize)}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href="#"
									onClick={(e) => {
										e.preventDefault()
										if (table.getCanPreviousPage()) {
											table.previousPage()
										}
									}}
								/>
							</PaginationItem>
							{Array.from({ length: table.getPageCount() }).map((_, i) => {
								const page = i + 1
								return (
									<PaginationItem key={page}>
										<PaginationLink
											href="#"
											isActive={table.getState().pagination.pageIndex === i}
											aria-disabled={
												table.getState().pagination.pageIndex === i
											}
											tabIndex={
												table.getState().pagination.pageIndex === i ? -1 : 0
											}
											onClick={(e) => {
												e.preventDefault()
												if (table.getState().pagination.pageIndex !== i) {
													table.setPageIndex(i)
												}
											}}
										>
											{page}
										</PaginationLink>
									</PaginationItem>
								)
							})}
							<PaginationItem>
								<PaginationNext
									href="#"
									aria-disabled={!table.getCanNextPage()}
									tabIndex={!table.getCanNextPage() ? -1 : 0}
									onClick={(e) => {
										e.preventDefault()
										if (table.getCanNextPage()) {
											table.nextPage()
										}
									}}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			</div>
		</div>
	)
}
