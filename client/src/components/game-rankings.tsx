import { Medal, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'

interface Ranking {
  id: string
  displayName: string
  bingoCount: number
}

interface GameRankingsProps {
  rankings: Ranking[]
}

export function GameRankings({ rankings }: GameRankingsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const top10 = rankings.slice(0, 10)

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return (
          <div className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">
            {position}
          </div>
        )
    }
  }

  const getBingoText = (count: number) => {
    if (count === 0) return 'No bingos'
    if (count === 1) return '1 bingo'
    return `${count} bingos`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Final Rankings
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              View All ({rankings.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Complete Rankings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {rankings.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(index + 1)}
                    <span className="font-medium">{player.displayName}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {getBingoText(player.bingoCount)}
                  </span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3">
        {top10.map((player, index) => (
          <div
            key={player.id}
            className="flex flex-col items-center p-3 rounded-lg border bg-card text-center"
          >
            <div className="mb-2">{getRankIcon(index + 1)}</div>
            <div
              className="font-medium text-sm truncate w-full"
              title={player.displayName}
            >
              {player.displayName}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {getBingoText(player.bingoCount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
