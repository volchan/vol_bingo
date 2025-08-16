import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import JoinGameForm from '@/components/forms/join-game'
import NewGameForm from '@/components/forms/new-game'
import { DashboardSkeleton } from '@/components/loading'
import { useListGames } from '@/hooks/api/games.hooks'

export const Route = createFileRoute('/_authenticated/dashboard')({
	component: RouteComponent,
	loader: ({ context }) => context,
	pendingComponent: DashboardSkeleton,
	errorComponent: ({ error }) => (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4 text-destructive">
				Dashboard Error
			</h1>
			<p className="text-muted-foreground">
				{error?.message || 'Failed to load dashboard'}
			</p>
		</div>
	),
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
	const listGamesQuery = useListGames()

	return (
		<>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<div className="p-4 rounded-lg border bg-card">
					<h3 className="font-semibold mb-2">Quick Stats</h3>
					<p className="text-muted-foreground">
						Your dashboard statistics will appear here.
					</p>
				</div>
				<div className="p-4 rounded-lg border bg-card">
					<h3 className="font-semibold mb-2">Recent Activity</h3>
					<p className="text-muted-foreground">
						Your recent activity will appear here.
					</p>
				</div>
				<div className="p-4 rounded-lg border bg-card">
					<h3 className="font-semibold mb-2">Notifications</h3>
					<p className="text-muted-foreground">
						Your notifications will appear here.
					</p>
				</div>
			</div>

			<div className="mt-6">
				<h2 className="text-xl font-semibold mb-4">Your Games</h2>
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
						<ul className="space-y-4">
							{listGamesQuery.data.map((game) => (
								<li key={game.id} className="p-4 rounded-lg border bg-card">
									<h3 className="font-semibold">{game.title}</h3>
									<p className="text-muted-foreground">
										ID: {game.friendlyId} | Created at:{' '}
										{new Date(game.createdAt).toLocaleString()} | Creator:{' '}
										{game.creator.displayName}
									</p>
								</li>
							))}
						</ul>
					))}
			</div>
		</>
	)
}
