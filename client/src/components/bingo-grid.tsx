import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BingoGridProps {
	readonly items: readonly string[]
	readonly size?: 3 | 5 | 7
	readonly disabled?: boolean
}

interface BingoCell {
	id: string
	text: string
	isMarked: boolean
}

export function BingoGrid({
	items,
	size = 5,
	disabled = false,
}: BingoGridProps) {
	const totalCells = size * size
	const centerIndex = Math.floor(totalCells / 2)

	// Initialize the grid with items
	const initializeCells = (): BingoCell[] => {
		const cells: BingoCell[] = []

		for (let i = 0; i < totalCells; i++) {
			cells.push({
				id: `cell-${i}`,
				text: items[i] || `Item ${i + 1}`,
				isMarked: false,
			})
		}

		return cells
	}

	const [cells, setCells] = useState<BingoCell[]>(initializeCells())

	const toggleCell = (cellId: string) => {
		if (disabled) return

		setCells((prev) =>
			prev.map((cell) => {
				if (cell.id === cellId) {
					return { ...cell, isMarked: !cell.isMarked }
				}
				return cell
			}),
		)
	}

	const checkRowComplete = (rowIndex: number): boolean => {
		for (let col = 0; col < size; col++) {
			if (!cells[rowIndex * size + col]?.isMarked) {
				return false
			}
		}
		return true
	}

	const checkColumnComplete = (colIndex: number): boolean => {
		for (let row = 0; row < size; row++) {
			if (!cells[row * size + colIndex]?.isMarked) {
				return false
			}
		}
		return true
	}

	const checkDiagonalsComplete = (): boolean => {
		// Check main diagonal (top-left to bottom-right)
		for (let i = 0; i < size; i++) {
			if (!cells[i * size + i]?.isMarked) {
				break
			}
			if (i === size - 1) return true
		}

		// Check anti-diagonal (top-right to bottom-left)
		for (let i = 0; i < size; i++) {
			if (!cells[i * size + (size - 1 - i)]?.isMarked) {
				return false
			}
		}
		return true
	}

	const checkForBingo = (): boolean => {
		// Check all rows
		for (let row = 0; row < size; row++) {
			if (checkRowComplete(row)) return true
		}

		// Check all columns
		for (let col = 0; col < size; col++) {
			if (checkColumnComplete(col)) return true
		}

		// Check diagonals
		return checkDiagonalsComplete()
	}

	const hasBingo = checkForBingo()

	return (
		<div className="w-full max-w-2xl mx-auto space-y-4">
			{hasBingo && (
				<div className="text-center p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
					<h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
						🎉 BINGO! 🎉
					</h2>
					<p className="text-green-600 dark:text-green-300">
						Congratulations! You got a bingo!
					</p>
				</div>
			)}

			<div
				className={cn(
					'grid gap-2 w-full aspect-square',
					size === 3 && 'grid-cols-3',
					size === 5 && 'grid-cols-5',
					size === 7 && 'grid-cols-7',
				)}
			>
				{cells.map((cell, index) => (
					<BingoCell
						key={cell.id}
						cell={cell}
						isCenter={index === centerIndex}
						onClick={() => toggleCell(cell.id)}
						disabled={disabled}
						className={cn(
							'aspect-square',
							// Responsive text sizing
							size === 3 && 'text-sm sm:text-base',
							size === 5 && 'text-xs sm:text-sm',
							size === 7 && 'text-xs',
						)}
					/>
				))}
			</div>

			<div className="flex justify-center gap-2">
				<Button variant="outline" onClick={() => setCells(initializeCells())}>
					Reset Grid
				</Button>
			</div>
		</div>
	)
}

interface BingoCellProps {
	readonly cell: BingoCell
	readonly isCenter: boolean
	readonly onClick: () => void
	readonly disabled?: boolean
	readonly className?: string
}

function BingoCell({
	cell,
	isCenter,
	onClick,
	disabled = false,
	className,
}: BingoCellProps) {
	return (
		<Button
			variant="outline"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				'h-full w-full p-2 text-center hyphens-auto transition-all duration-200',
				!disabled && 'hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg',
				disabled && 'opacity-50 cursor-not-allowed',
				cell.isMarked &&
					!isCenter &&
					'bg-green-500 text-white hover:bg-green-600 hover:text-white',
				cell.isMarked &&
					isCenter &&
					'bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white',
				className,
			)}
		>
			<span className="leading-tight text-wrap">{cell.text}</span>
		</Button>
	)
}
