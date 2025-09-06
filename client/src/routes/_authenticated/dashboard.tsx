import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { GameList } from '@/components/dashboard/game-list'
import { ErrorBoundary } from '@/components/error-boundary'
import { ServerError } from '@/components/error-pages'
import JoinGameForm from '@/components/forms/join-game'
import NewGameForm from '@/components/forms/new-game'
import { DashboardSkeleton } from '@/components/loading'
import { Card, CardContent } from '@/components/ui/card'
import { usePlayedGames } from '@/hooks/api/games.hooks'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: RouteComponent,
  loader: ({ context }) => context,
  pendingComponent: DashboardSkeleton,
  errorComponent: ({ error }) => {
    return <ServerError error={error} />
  },
})

function RouteComponent() {
  return (
    <ErrorBoundary>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="flex gap-5 mb-5 flex-col md:flex-row">
          <NewGameForm />
          <JoinGameForm />
        </div>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}

function DashboardContent() {
  const listGamesQuery = usePlayedGames()
  const { user } = useAuth()
  const totalGames = listGamesQuery.data?.length || 0
  const wins =
    listGamesQuery.data?.filter((game) => game.winner?.id === user!.id)
      .length || 0
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {listGamesQuery.isLoading && <DashboardSkeleton />}
        {listGamesQuery.isError && (
          <p className="text-destructive">
            Failed to load games: {listGamesQuery.error.message}
          </p>
        )}
        {listGamesQuery.data &&
          Array.isArray(listGamesQuery.data) &&
          !listGamesQuery.isLoading &&
          !listGamesQuery.isError &&
          (listGamesQuery.data.length === 0 ? (
            <p className="text-muted-foreground">
              No games found. Create your first game above!
            </p>
          ) : (
            <>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {totalGames}
                  </div>
                  <div className="text-sm text-gray-600">Total Games</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {wins}
                  </div>
                  <div className="text-sm text-gray-600">Games Won</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {winRate}%
                  </div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </CardContent>
              </Card>
            </>
          ))}
      </div>
      {listGamesQuery.data && (
        <GameList currentUser={user!} games={listGamesQuery.data} />
      )}
    </div>
  )
}
