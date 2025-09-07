import { Link } from '@tanstack/react-router'
import { Calendar1, Gamepad2 } from 'lucide-react'
import type { PlayedGame, User } from 'shared'
import { formatLocal } from '@/lib/date-utils'
import { Badge } from '../ui/badge'

interface GameListProps {
  readonly currentUser: User
  readonly games: PlayedGame[]
}

export function GameList({ games }: GameListProps) {
  const hasBingo = (game: PlayedGame) => game.userHasBingo
  const badgeVariants = (game: PlayedGame) => {
    switch (game.status) {
      case 'draft':
        return 'warning'
      case 'playing':
        return 'default'
      case 'completed':
        return 'success'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="mt-6 w-full">
      <h2 className="text-xl font-semibold mb-4">Past games</h2>
      <ul className="flex flex-wrap gap-4">
        {games && games.length > 0 ? (
          games.map((game) => (
            <li
              key={game.friendlyId}
              className={`p-4 rounded-lg border-2 transition-all flex-1/4 ${
                hasBingo(game)
                  ? 'border-green-200 bg-green-50 hover:bg-green-100 hover:shadow-md hover:shadow-green-200 hover:border-green-300 transition-all'
                  : 'border-gray-200 bg-card hover:bg-gray-100 hover:shadow-md hover:shadow-gray-200 hover:border-gray-300 transition-all'
              }`}
            >
              <Link to={`/games/$id`} params={{ id: game.friendlyId }}>
                <div className="flex justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={badgeVariants(game)} className="text-xs">
                        {game.status}
                      </Badge>
                      <span className="font-semibold truncate">
                        {game.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar1 />
                        <span>{formatLocal(game.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Gamepad2 />
                        <span>
                          {game.players.length}{' '}
                          {game.players.length === 1 ? 'player' : 'players'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))
        ) : (
          <li className="text-muted-foreground">No past games found.</li>
        )}
      </ul>
    </div>
  )
}
