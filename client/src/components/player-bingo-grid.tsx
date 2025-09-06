import { Shuffle } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PlayerBoard } from 'shared'
import { Button } from '@/components/ui/button'
import { useShufflePlayerBoard } from '@/hooks/api/player-boards.hooks'
import { cn } from '@/lib/utils'

interface PlayerBingoGridProps {
  readonly playerBoard: PlayerBoard
  readonly size?: 3 | 5 | 7
  readonly disabled?: boolean
  readonly canMark?: boolean
  readonly canShuffle?: boolean
  readonly onMarkCell?: (gameCellId: string, marked: boolean) => void
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
  onMarkCell,
}: PlayerBingoGridProps) => {
  const totalCells = size * size
  const centerIndex = Math.floor(totalCells / 2)
  const shuffleMutation = useShufflePlayerBoard()

  const [localCells, setLocalCells] = useState<PlayerBingoCell[]>([])
  const prevPlayerBoardCellsRef = useRef<string>('')

  // Use useMemo to compute cells and only update when actually needed
  const computedCells = useMemo(() => {
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
    return gridCells
  }, [playerBoard.playerBoardCells, totalCells])

  // Only update localCells when computedCells actually changes
  useEffect(() => {
    const currentHash = JSON.stringify(computedCells)
    if (prevPlayerBoardCellsRef.current !== currentHash) {
      setLocalCells(computedCells)
      prevPlayerBoardCellsRef.current = currentHash
    }
  }, [computedCells])

  const toggleCell = useCallback(
    (cell: PlayerBingoCell) => {
      if (disabled || !canMark || !cell.gameCellId || !onMarkCell) return

      const newMarkedState = !cell.isMarked
      onMarkCell(cell.gameCellId, newMarkedState)
    },
    [disabled, canMark, onMarkCell],
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
    } catch (_error) {}
  }, [canShuffle, shuffleMutation, playerBoard.id, totalCells])

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
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
            {shuffleMutation.isPending ? 'Shuffling..' : 'Shuffle Board'}
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
          const handleCellClick = () => {
            toggleCell(cell)
          }

          const isClickable = !disabled && canMark && cell.text

          return (
            <PlayerBingoCell
              key={cell.id}
              cell={cell}
              isCenter={index === centerIndex}
              onClick={isClickable ? handleCellClick : () => {}}
              disabled={!cell.text}
              loading={false}
              showMuted={false}
              className={cn(
                'aspect-square',
                size === 3 && 'text-sm sm:text-base',
                size === 5 && 'text-xs sm:text-sm',
                size === 7 && 'text-xs',
                !isClickable && 'cursor-default',
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

PlayerBingoGridComponent.displayName = 'PlayerBingoGridComponent'

export const PlayerBingoGrid = memo(PlayerBingoGridComponent)

interface PlayerBingoCellProps {
  readonly cell: PlayerBingoCell
  readonly isCenter: boolean
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly loading?: boolean
  readonly showMuted?: boolean
  readonly className?: string
}

const PlayerBingoCell = memo(
  ({
    cell,
    isCenter,
    onClick,
    disabled = false,
    loading = false,
    showMuted = false,
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
          showMuted && (disabled || loading) && 'opacity-50',
          loading && 'animate-pulse',
          cell.isMarked &&
            !isCenter &&
            'bg-green-500 text-white hover:bg-green-600 hover:text-white',
          cell.isMarked &&
            isCenter &&
            'bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white',
          !cell.text && 'bg-muted/30 border-dashed opacity-50',
          className,
        )}
      >
        <span className="leading-tight text-clip">{cell.text}</span>
      </Button>
    )
  },
)

PlayerBingoCell.displayName = 'PlayerBingoCell'
