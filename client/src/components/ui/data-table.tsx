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
import { useMemo, useState } from 'react'
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
  pagination,
}: Readonly<{
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: string
  pagination?: {
    pageIndex: number
    pageSize: number
    onPaginationChange: (updater: ((prev: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number }) | { pageIndex: number; pageSize: number }) => void
  }
}>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const defaultPageSize = 25
  const defaultPageIndex = 0

  // For uncontrolled pagination (when no pagination prop is provided)
  const [uncontrolledPagination, setUncontrolledPagination] = useState({
    pageIndex: defaultPageIndex,
    pageSize: defaultPageSize,
  })

  // Use controlled pagination if provided, otherwise use uncontrolled
  const isControlled = !!pagination
  const currentPagination = isControlled 
    ? { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }
    : uncontrolledPagination

  // When using manual pagination, we need to slice the data ourselves
  const displayData = useMemo(() => {
    if (isControlled) {
      const startIndex = currentPagination.pageIndex * currentPagination.pageSize
      const endIndex = startIndex + currentPagination.pageSize
      return data.slice(startIndex, endIndex)
    }
    return data
  }, [data, isControlled, currentPagination.pageIndex, currentPagination.pageSize])

  const table = useReactTable({
    data: displayData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: currentPagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: isControlled ? pagination.onPaginationChange : setUncontrolledPagination,
    manualPagination: isControlled, // This tells TanStack Table to not manage pagination internally
    rowCount: isControlled ? data.length : undefined, // Tell TanStack Table the total number of rows
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
            value={String(Math.max(table.getState().pagination.pageSize, 10))}
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
              {[10, 25, 50, 100, 200].map((pageSize) => (
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
                  onClick={() => {
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
                      isActive={table.getState().pagination.pageIndex === i}
                      aria-disabled={
                        table.getState().pagination.pageIndex === i
                      }
                      tabIndex={
                        table.getState().pagination.pageIndex === i ? -1 : 0
                      }
                      onClick={() => {
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
                  aria-disabled={!table.getCanNextPage()}
                  tabIndex={!table.getCanNextPage() ? -1 : 0}
                  onClick={() => {
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
