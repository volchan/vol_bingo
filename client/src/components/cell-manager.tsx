import { useDebouncedValue } from '@tanstack/react-pacer'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { Cell, GameCell } from 'shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	useCreateCell,
	useLinkCellToGame,
	useSearchCells,
	useUnlinkCell,
} from '@/hooks/api/cells.hooks'
import { cn } from '@/lib/utils'

interface CellManagerProps {
	readonly gameId: string
	readonly gameCells: GameCell[]
	readonly onCellLinked?: (cell: Cell) => void
	readonly onCellUnlinked?: (cellId: string) => void
}

export function CellManager({
	gameId,
	gameCells,
	onCellLinked,
	onCellUnlinked,
}: CellManagerProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)
	const [dropdownHovered, setDropdownHovered] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	// Debounce search query using TanStack Pacer
	const [debouncedQuery] = useDebouncedValue(searchQuery, { wait: 300 })

	// API hooks
	const { data: searchResults = [], isLoading: isSearching } =
		useSearchCells(debouncedQuery)
	const createCellMutation = useCreateCell()
	const linkCellMutation = useLinkCellToGame()
	const unlinkCellMutation = useUnlinkCell()

	// Extract linked cell IDs for quick lookup
	const linkedCellIds = useMemo(
		() => new Set(gameCells.map((gc) => gc.cellId)),
		[gameCells],
	)

	// Add isLinked property to search results
	const searchResultsWithStatus = useMemo(
		() =>
			searchResults.map((cell) => ({
				...cell,
				isLinked: linkedCellIds.has(cell.id),
			})),
		[searchResults, linkedCellIds],
	)

	// Check if search query doesn't match any results
	const hasExactMatch = searchResultsWithStatus.some(
		(cell) => cell.value.toLowerCase() === debouncedQuery.toLowerCase(),
	)
	const showCreateOption =
		debouncedQuery.length >= 1 && !hasExactMatch && !isSearching

	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query)
	}, [])

	const handleInputFocus = useCallback(() => {
		setIsDropdownOpen(true)
	}, [])

	// Only close dropdown if not hovered
	const handleInputBlur = useCallback(() => {
		setTimeout(() => {
			if (!dropdownHovered) setIsDropdownOpen(false)
		}, 100)
	}, [dropdownHovered])

	const handleDropdownMouseEnter = useCallback(() => {
		setDropdownHovered(true)
	}, [])
	const handleDropdownMouseLeave = useCallback(() => {
		setDropdownHovered(false)
		// If input is not focused, close dropdown
		if (document.activeElement !== inputRef.current) setIsDropdownOpen(false)
	}, [])

	const handleLinkCell = async (cell: Cell) => {
		try {
			await linkCellMutation.mutateAsync({
				cellId: cell.id,
				gameId,
			})
			onCellLinked?.(cell)
			setSearchQuery('')
		} catch (error) {
			console.error('Failed to link cell:', error)
		}
	}

	const handleUnlinkCell = async (cellId: string) => {
		const gameCell = gameCells.find((gc) => gc.cellId === cellId)
		if (!gameCell) return

		try {
			await unlinkCellMutation.mutateAsync({
				gameCellId: gameCell.id,
				gameId,
			})
			onCellUnlinked?.(cellId)
		} catch (error) {
			console.error('Failed to unlink cell:', error)
		}
	}

	const handleCreateAndLink = async () => {
		if (!debouncedQuery.trim()) return

		try {
			const newCell = await createCellMutation.mutateAsync({
				value: debouncedQuery,
			})
			await linkCellMutation.mutateAsync({
				cellId: newCell.id,
				gameId,
			})
			setSearchQuery('')
			onCellLinked?.(newCell)
		} catch (error) {
			console.error('Failed to create and link cell:', error)
		}
	}

	// Extract linked cells with their cell data
	const linkedCells = useMemo(
		() => gameCells.filter((gc) => gc.cell).map((gc) => gc.cell!),
		[gameCells],
	)

	return (
		<div className="border rounded-lg p-4 bg-card min-h-[400px]">
			<div className="space-y-4">
				<div className="flex flex-col gap-2">
					<h3 className="font-semibold text-sm">Manage Cells</h3>

					{/* Search Dropdown */}
					<div className="relative">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								ref={inputRef}
								placeholder="Search or create cells..."
								value={searchQuery}
								onChange={(e) => handleSearch(e.target.value)}
								onFocus={handleInputFocus}
								onBlur={handleInputBlur}
								className="pl-10"
								autoComplete="off"
							/>
						</div>
						{/* Dropdown */}
						{(isDropdownOpen || dropdownHovered) && (
							<div
								data-dropdown
								role="menu"
								tabIndex={0}
								className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto"
								onMouseEnter={handleDropdownMouseEnter}
								onMouseLeave={handleDropdownMouseLeave}
							>
								{(!debouncedQuery || debouncedQuery.trim().length === 0) && (
									<div className="p-3 text-sm text-muted-foreground">
										Type to search
									</div>
								)}
								{debouncedQuery && isSearching && (
									<div className="p-3 text-sm text-muted-foreground">
										Searching...
									</div>
								)}
								{debouncedQuery &&
									!isSearching &&
									searchResultsWithStatus.length === 0 &&
									!showCreateOption && (
										<div className="p-3 text-sm text-muted-foreground">
											No cells found
										</div>
									)}
								{/* Create Option */}
								{showCreateOption && (
									<div>
										<div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
											Create New
										</div>
										<button
											type="button"
											onClick={handleCreateAndLink}
											onMouseDown={(e) => e.preventDefault()}
											disabled={
												createCellMutation.isPending ||
												linkCellMutation.isPending
											}
											className="w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none text-left"
										>
											<Plus className="mr-2 h-4 w-4" />
											Create "{debouncedQuery}"
										</button>
									</div>
								)}
								{/* Search Results */}
								{searchResultsWithStatus.length > 0 && (
									<div>
										<div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
											Existing Cells
										</div>
										{searchResultsWithStatus.map((cell) => (
											<button
												type="button"
												key={cell.id}
												onClick={() => !cell.isLinked && handleLinkCell(cell)}
												onMouseDown={(e) => e.preventDefault()}
												disabled={cell.isLinked || linkCellMutation.isPending}
												className={cn(
													'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none text-left',
													cell.isLinked && 'cursor-not-allowed',
												)}
											>
												<span className="flex-1">{cell.value}</span>
												{cell.isLinked && (
													<span className="text-xs text-muted-foreground ml-2">
														Already linked
													</span>
												)}
											</button>
										))}
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Linked Cells */}
				<div className="space-y-2">
					<span className="text-xs text-muted-foreground">
						Linked Cells ({linkedCells.length})
					</span>
					<div className="space-y-1">
						{linkedCells.map((cell) => (
							<div
								key={cell.id}
								className="flex items-center justify-between p-2 text-xs rounded bg-muted/50"
							>
								<span className="truncate flex-1">{cell.value}</span>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => handleUnlinkCell(cell.id)}
									disabled={unlinkCellMutation.isPending}
									className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							</div>
						))}
						{linkedCells.length === 0 && (
							<div className="text-xs text-muted-foreground py-2">
								No cells linked yet. Search and add cells above.
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
