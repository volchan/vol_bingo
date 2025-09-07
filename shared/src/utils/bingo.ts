export interface BingoCell {
  position: number
  marked?: boolean
}

export interface BingoResult {
  hasBingo: boolean
  bingoCount: number
  isMegaBingo: boolean
}

/**
 * Checks for bingo patterns in a 5x5 grid
 * @param cells Array of cells with position and marked status
 * @param size Grid size (default: 5)
 * @returns Bingo detection result
 */
export function checkBingoPattern(
  cells: BingoCell[],
  size: number = 5,
): BingoResult {
  const grid = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false))

  // Fill grid with marked cells
  cells.forEach((cell) => {
    const row = Math.floor(cell.position / size)
    const col = cell.position % size
    if (row >= 0 && row < size && col >= 0 && col < size && grid[row]) {
      grid[row][col] = cell.marked || false
    }
  })

  let bingoCount = 0

  // Check rows
  for (let row = 0; row < size; row++) {
    if (grid[row] && grid[row]!.every((cell) => cell)) {
      bingoCount++
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    if (grid.every((row) => row?.[col])) {
      bingoCount++
    }
  }

  // Check main diagonal (top-left to bottom-right)
  if (grid.every((row, i) => row?.[i])) {
    bingoCount++
  }

  // Check anti-diagonal (top-right to bottom-left)
  if (grid.every((row, i) => row?.[size - 1 - i])) {
    bingoCount++
  }

  // Check for mega bingo (all cells marked)
  const isMegaBingo = grid.every((row) => row?.every((cell) => cell))

  return {
    hasBingo: bingoCount > 0,
    bingoCount,
    isMegaBingo,
  }
}
