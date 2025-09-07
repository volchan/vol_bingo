import confetti from 'canvas-confetti'
import { Trophy } from 'lucide-react'
import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BingoPlayer {
  playerId: string
  playerBoardId: string
  playerName: string
  bingoCount: number
  isMegaBingo: boolean
}

interface BingoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bingoPlayers: BingoPlayer[]
  newBingoPlayers: BingoPlayer[]
  isMegaBingo: boolean
}

export function BingoDialog({
  open,
  onOpenChange,
  bingoPlayers,
  newBingoPlayers,
  isMegaBingo,
}: BingoDialogProps) {
  // Bingo celebration effect
  useEffect(() => {
    if (open) {
      const duration = isMegaBingo ? 5000 : 2000
      const animationEnd = Date.now() + duration

      const runConfetti = () => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) return

        const dialogElement = document.querySelector('[role="dialog"]')
        let originY = 0.5
        let originX = 0.5

        if (dialogElement) {
          const dialogRect = dialogElement.getBoundingClientRect()
          const centerX = dialogRect.left + dialogRect.width / 2
          const topY = dialogRect.top + 20

          originX = centerX / window.innerWidth
          originY = topY / window.innerHeight
        }

        if (isMegaBingo) {
          confetti({
            particleCount: 30,
            startVelocity: 60,
            spread: 80,
            angle: 90,
            origin: { x: originX - 0.2, y: originY },
            colors: [
              '#FFD700',
              '#FFA500',
              '#FF6347',
              '#32CD32',
              '#1E90FF',
              '#9932CC',
            ],
          })
          confetti({
            particleCount: 30,
            startVelocity: 60,
            spread: 80,
            angle: 90,
            origin: { x: originX + 0.2, y: originY },
            colors: [
              '#FFD700',
              '#FFA500',
              '#FF6347',
              '#32CD32',
              '#1E90FF',
              '#9932CC',
            ],
          })
          confetti({
            particleCount: 30,
            startVelocity: 70,
            spread: 90,
            angle: 90,
            origin: { x: originX, y: originY - 0.02 },
            colors: [
              '#FFD700',
              '#FFA500',
              '#FF6347',
              '#32CD32',
              '#1E90FF',
              '#9932CC',
            ],
          })
          setTimeout(() => requestAnimationFrame(runConfetti), 100)
        } else {
          confetti({
            particleCount: 30,
            startVelocity: 40,
            spread: 70,
            angle: 90,
            origin: {
              x: originX,
              y: originY,
            },
            colors: [
              '#FFD700',
              '#FFA500',
              '#FF6347',
              '#32CD32',
              '#1E90FF',
              '#9932CC',
            ],
          })
          setTimeout(() => requestAnimationFrame(runConfetti), 200)
        }
      }

      runConfetti()

      // Auto-close timer
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [open, isMegaBingo, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            {isMegaBingo ? '🎆 MEGA BINGO! 🎆' : '🎉 BINGO! 🎉'}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            {isMegaBingo ? (
              <span className="space-y-2 block">
                <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400 block">
                  ENTIRE GRID COMPLETED!
                </span>
                <span className="block">
                  Ultimate bingo achievement unlocked! 🏆
                </span>
              </span>
            ) : (
              <span className="space-y-3 block">
                {/* Show who got NEW bingos (not in mega bingo) */}
                {newBingoPlayers.length === 1 ? (
                  <span className="block text-green-600 dark:text-green-400 font-bold">
                    🎉 <strong>{newBingoPlayers[0]?.playerName}</strong> just
                    got a new bingo!
                  </span>
                ) : newBingoPlayers.length > 1 ? (
                  <span className="space-y-1 block">
                    {newBingoPlayers.length <= 5 ? (
                      <>
                        <span className="block text-green-600 dark:text-green-400 font-bold">
                          🎉 New bingos achieved by:
                        </span>
                        {newBingoPlayers
                          .sort((a, b) =>
                            a.playerName.localeCompare(b.playerName),
                          )
                          .map((player) => (
                            <span
                              key={`${player.playerId}-${player.playerBoardId}`}
                              className="block text-green-600 dark:text-green-400 font-semibold"
                            >
                              <strong>{player.playerName}</strong>
                            </span>
                          ))}
                      </>
                    ) : (
                      <span className="block text-green-600 dark:text-green-400 font-bold">
                        🎉 {newBingoPlayers.length} players just got new bingos!
                      </span>
                    )}
                  </span>
                ) : null}

                {/* Show current bingo status */}
                {bingoPlayers.length === 1 ? (
                  <span className="block">
                    <strong>{bingoPlayers[0]?.playerName}</strong> has{' '}
                    {bingoPlayers[0]?.bingoCount > 1 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                        {bingoPlayers[0]?.bingoCount} bingos
                      </span>
                    ) : (
                      'a bingo'
                    )}
                    !
                  </span>
                ) : bingoPlayers.length > 1 ? (
                  <span className="space-y-1 block">
                    <span className="block">
                      {bingoPlayers.length <= 5
                        ? 'Current bingo standings:'
                        : 'Top 5 bingo leaders:'}
                    </span>
                    {bingoPlayers
                      .sort((a, b) => b.bingoCount - a.bingoCount)
                      .slice(0, 5)
                      .map((player) => (
                        <span
                          key={`${player.playerId}-${player.playerBoardId}`}
                          className="font-semibold block"
                        >
                          <strong>{player.playerName}</strong>{' '}
                          {player.bingoCount > 1 ? (
                            <span className="text-yellow-600 dark:text-yellow-400">
                              ({player.bingoCount} bingos)
                            </span>
                          ) : (
                            '(1 bingo)'
                          )}
                        </span>
                      ))}
                    {bingoPlayers.length > 5 && (
                      <span className="block text-sm text-muted-foreground">
                        ...and {bingoPlayers.length - 5} more players
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="block">Someone achieved a bingo!</span>
                )}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
