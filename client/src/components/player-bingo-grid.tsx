import { Shuffle } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import type { PlayerBoard } from 'shared'
import { Button } from '@/components/ui/button'
import {
	useMarkGameCell,
	useShufflePlayerBoard,
} from '@/hooks/api/player-boards.hooks'
import { cn } from '@/lib/utils'

interface PlayerBingoGridProps {
	readonly playerBoard: PlayerBoard
	readonly size?: 3 | 5 | 7
	readonly disabled?: boolean
	readonly canMark?: boolean
	readonly canShuffle?: boolean
}

interface PlayerBingoCell {
	id: string
	gameCellId: string
	text: string
	isMarked: boolean
	position: number
}

const PlayerBingoGridComponent = ({
	playerBoard,
	size = 5,
	disabled = false,
	canMark = false,
	canShuffle = false,
}: PlayerBingoGridProps) => {
	const totalCells = size * size
	const centerIndex = Math.floor(totalCells / 2)
	const markCellMutation = useMarkGameCell()
	const shuffleMutation = useShufflePlayerBoard()

	const [localCells, setLocalCells] = useState<PlayerBingoCell[]>([])
	useEffect(() => {
		const gridCells = (playerBoard.playerBoardCells || []).map((pbc) => ({
			id: pbc.id,
			gameCellId: pbc.gameCellId,
			text: pbc.gameCell?.cell?.value || '',
			isMarked: pbc.gameCell?.marked || false,
			position: pbc.position,
		}))

		while (gridCells.length < totalCells) {
			gridCells.push({
				id: `empty-${gridCells.length}`,
				gameCellId: '',
				text: '',
				isMarked: false,
				position: gridCells.length,
			})
		}

		gridCells.sort((a, b) => a.position - b.position)

		setLocalCells(gridCells)
	}, [playerBoard.playerBoardCells, totalCells])

	const toggleCell = useCallback(
		async (cell: PlayerBingoCell) => {
			if (
				disabled ||
				!canMark ||
				!cell.gameCellId ||
				markCellMutation.isPending
			)
				return

			const newMarkedState = !cell.isMarked

			setLocalCells((prev) =>
				prev.map((c) =>
					c.gameCellId === cell.gameCellId
						? { ...c, isMarked: newMarkedState }
						: c,
				),
			)

			try {
				await markCellMutation.mutateAsync({
					gameCellId: cell.gameCellId,
					marked: newMarkedState,
				})
			} catch (error) {
				console.error('Failed to toggle cell:', error)
				setLocalCells((prev) =>
					prev.map((c) =>
						c.gameCellId === cell.gameCellId
							? { ...c, isMarked: !newMarkedState }
							: c,
					),
				)
			}
		},
		[disabled, canMark, markCellMutation],
	)

	const handleShuffle = useCallback(async () => {
		if (!canShuffle || shuffleMutation.isPending) return

		try {
			const updatedPlayerBoard = await shuffleMutation.mutateAsync(
				playerBoard.id,
			)
			const gridCells = (updatedPlayerBoard.playerBoardCells || []).map(
				(pbc) => ({
					id: pbc.id,
					gameCellId: pbc.gameCellId,
					text: pbc.gameCell?.cell?.value || '',
					isMarked: pbc.gameCell?.marked || false,
					position: pbc.position,
				}),
			)

			while (gridCells.length < totalCells) {
				gridCells.push({
					id: `empty-${gridCells.length}`,
					gameCellId: '',
					text: '',
					isMarked: false,
					position: gridCells.length,
				})
			}

			gridCells.sort((a, b) => a.position - b.position)
			setLocalCells(gridCells)
		} catch (error) {
			console.error('Failed to shuffle board:', error)
		}
	}, [canShuffle, shuffleMutation, playerBoard.id, totalCells])

	const hasBingo = useMemo(() => {
		const checkRowComplete = (rowIndex: number): boolean => {
			for (let col = 0; col < size; col++) {
				if (!localCells[rowIndex * size + col]?.isMarked) {
					return false
				}
			}
			return true
		}

		const checkColumnComplete = (colIndex: number): boolean => {
			for (let row = 0; row < size; row++) {
				if (!localCells[row * size + colIndex]?.isMarked) {
					return false
				}
			}
			return true
		}

		const checkDiagonalsComplete = (): boolean => {
			for (let i = 0; i < size; i++) {
				if (!localCells[i * size + i]?.isMarked) {
					break
				}
				if (i === size - 1) return true
			}

			for (let i = 0; i < size; i++) {
				if (!localCells[i * size + (size - 1 - i)]?.isMarked) {
					return false
				}
			}
			return true
		}

		for (let row = 0; row < size; row++) {
			if (checkRowComplete(row)) return true
		}

		for (let col = 0; col < size; col++) {
			if (checkColumnComplete(col)) return true
		}

		return checkDiagonalsComplete()
	}, [localCells, size])

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

			{canShuffle && (
				<div className="text-center">
					<Button
						variant="outline"
						size="sm"
						onClick={handleShuffle}
						disabled={shuffleMutation.isPending}
						className="flex items-center gap-2"
					>
						<Shuffle className="h-4 w-4" />
						{shuffleMutation.isPending ? 'Shuffling...' : 'Shuffle Board'}
					</Button>
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
				{localCells.map((cell, index) => {
					const handleCellClick = () => toggleCell(cell)

					return (
						<PlayerBingoCell
							key={cell.id}
							cell={cell}
							isCenter={index === centerIndex}
							onClick={handleCellClick}
							disabled={
								disabled || !canMark || !cell.text || markCellMutation.isPending
							}
							loading={markCellMutation.isPending}
							className={cn(
								'aspect-square',
								size === 3 && 'text-sm sm:text-base',
								size === 5 && 'text-xs sm:text-sm',
								size === 7 && 'text-xs',
							)}
						/>
					)
				})}
			</div>
		</div>
	)
}

export const PlayerBingoGrid = memo(PlayerBingoGridComponent)

interface PlayerBingoCellProps {
	readonly cell: PlayerBingoCell
	readonly isCenter: boolean
	readonly onClick: () => void
	readonly disabled?: boolean
	readonly loading?: boolean
	readonly className?: string
}

const PlayerBingoCell = memo(
	({
		cell,
		isCenter,
		onClick,
		disabled = false,
		loading = false,
		className,
	}: PlayerBingoCellProps) => {
		return (
			<Button
				variant="outline"
				onClick={onClick}
				disabled={disabled || loading}
				className={cn(
					'h-full w-full p-2 text-center hyphens-auto transition-all duration-200',
					!disabled &&
						!loading &&
						'hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg',
					(disabled || loading) && 'opacity-50 cursor-not-allowed',
					loading && 'animate-pulse',
					cell.isMarked &&
						!isCenter &&
						'bg-green-500 text-white hover:bg-green-600 hover:text-white',
					cell.isMarked &&
						isCenter &&
						'bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white',
					!cell.text && 'bg-muted/30 border-dashed',
					className,
				)}
			>
				<span className="leading-tight text-wrap">{cell.text}</span>
			</Button>
		)
	},
)
