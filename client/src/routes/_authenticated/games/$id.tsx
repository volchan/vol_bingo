import { createFileRoute } from '@tanstack/react-router'
import { Copy, Crown, Loader2, Play } from 'lucide-react'
import { useState } from 'react'
import { BingoGrid } from '@/components/bingo-grid'
import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useGame, useStartGame } from '@/hooks/api/games.hooks'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/_authenticated/games/$id')({
	component: RouteComponent,
})

function RouteComponent() {
	const params = Route.useParams()
	const { data: game, isLoading, error } = useGame(params.id)
	const { user } = useAuth()
	const startGameMutation = useStartGame()
	const [isCopied, setIsCopied] = useState(false)

	// Mock bingo data - this should come from the game data eventually
	const bingoItems = [
		'Get a kill',
		'Find a rare item',
		'Complete a quest',
		'Level up',
		'Die to fall damage',
		'Get lost',
		'Find a secret area',
		'Craft something',
		'Tame an animal',
		'Build a house',
		'Mine diamonds',
		'Fight a boss',
		'Trade with villager',
		'Get achievement',
		'Use a portal',
		'Find treasure',
		'Make a friend',
		'Get scared',
		'Break your tool',
		'Get poisoned',
		'Ride a horse',
		'Catch a fish',
		'Plant crops',
		'Explore cave',
		'Find hidden chest',
	]

	if (isLoading) {
		return (
			<div className="container mx-auto p-4 space-y-6">
				<div className="text-center">
					<div className="animate-pulse">
						<div className="h-8 bg-muted rounded w-64 mx-auto mb-2"></div>
						<div className="h-4 bg-muted rounded w-32 mx-auto"></div>
					</div>
				</div>
				<div className="w-full max-w-2xl mx-auto">
					<div className="grid grid-cols-5 gap-2 aspect-square">
						{Array.from({ length: 25 }, (_, i) => (
							<div
								key={`loading-cell-${i + 1}`}
								className="aspect-square bg-muted rounded animate-pulse"
							></div>
						))}
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="container mx-auto p-4 space-y-6">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight text-destructive">
						Game Not Found
					</h1>
					<p className="text-muted-foreground">
						The game with ID "{params.id}" could not be found.
					</p>
				</div>
			</div>
		)
	}

	if (!game) {
		return (
			<div className="container mx-auto p-4 space-y-6">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
				</div>
			</div>
		)
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'draft':
				return 'bg-yellow-500'
			case 'active':
				return 'bg-green-500'
			default:
				return 'bg-gray-500'
		}
	}

	const getStatusText = (status: string) => {
		switch (status) {
			case 'draft':
				return 'Waiting to Start'
			case 'active':
				return 'Game in Progress'
			default:
				return 'Game Completed'
		}
	}

	const handleCopyGameLink = async () => {
		const gameUrl = `${window.location.origin}/games/${game.friendlyId}`
		try {
			await navigator.clipboard.writeText(gameUrl)
			setIsCopied(true)
			setTimeout(() => setIsCopied(false), 2000) // Hide tooltip after 2 seconds
		} catch {
			// For browsers that don't support clipboard API, we could show an error
			// or provide alternative instructions
			console.warn('Clipboard API not supported')
			setIsCopied(true)
			setTimeout(() => setIsCopied(false), 2000)
		}
	}

	const handleStartGame = () => {
		if (!game || !user) return

		startGameMutation.mutate(game.friendlyId)
	}

	const isGameCreator =
		user && game && game.creator && user.id === game.creator.id

	return (
		<div className="container mx-auto p-4 space-y-6">
			<div className="text-left">
				<h1 className="text-3xl font-bold tracking-tight">{game.title}</h1>
				<p className="text-muted-foreground">
					Created by {game.creator?.displayName || 'Unknown'} • Game ID:{' '}
					{game.friendlyId}
				</p>
			</div>

			{/* Game Status Box */}
			<div className="border rounded-lg p-6 bg-card">
				<div className="flex justify-between items-start mb-4">
					{/* Game Status */}
					<div className="flex items-center gap-2">
						<div
							className={`w-2 h-2 rounded-full ${getStatusColor(game.status)}`}
						></div>
						<span className="font-medium">{getStatusText(game.status)}</span>
					</div>

					{/* Action Buttons - Top Right of Status Box */}
					<div className="flex items-center gap-2">
						{/* Start Game Button - Only show for creator when game is draft */}
						{isGameCreator && game.status === 'draft' && (
							<Button
								type="button"
								variant="default"
								size="sm"
								onClick={handleStartGame}
								disabled={startGameMutation.isPending}
								className="flex items-center gap-2"
							>
								{startGameMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Starting...
									</>
								) : (
									<>
										<Play size={16} />
										Start Game
									</>
								)}
							</Button>
						)}

						{/* Copy Button */}
						<TooltipProvider>
							<Tooltip open={isCopied}>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onClick={handleCopyGameLink}
										className="flex items-center gap-2"
									>
										<Copy size={16} />
										{game.friendlyId}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Copied to clipboard!</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>

				<div className="space-y-4">
					{/* Players List */}
					<div>
						<h3 className="font-semibold mb-2">Players ({1})</h3>
						<div className="space-y-2">
							{game.creator && (
								<div className="flex items-center gap-2">
									<div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">
										{game.creator.displayName?.charAt(0).toUpperCase() || '?'}
									</div>
									<span className="text-sm">
										{game.creator.displayName || 'Unknown'}
									</span>
									<Crown className="w-4 h-4 text-yellow-500" />
								</div>
							)}
						</div>
					</div>

					{/* Invitation Message */}
					<div className="bg-muted/50 rounded-md p-3">
						<p className="text-sm text-muted-foreground">
							🎮 Waiting for the game to start! Share the game code{' '}
							<strong>{game.friendlyId}</strong> or use the copy button above to
							invite your friends to join the bingo game.
						</p>
					</div>
				</div>
			</div>

			<BingoGrid items={bingoItems} disabled={game.status !== 'active'} />
		</div>
	)
}
