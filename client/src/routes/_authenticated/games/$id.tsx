import { createFileRoute } from '@tanstack/react-router'
import { Copy, Crown, Edit, Loader2, Play } from 'lucide-react'
import { useState } from 'react'
import { BingoGrid } from '@/components/bingo-grid'
import { CellManager } from '@/components/cell-manager'
import { PlayerBingoGrid } from '@/components/player-bingo-grid'
import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import {
	useEditGame,
	useGame,
	useReadyGame,
	useStartGame,
} from '@/hooks/api/games.hooks'
import { usePlayerBoard } from '@/hooks/api/player-boards.hooks'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/_authenticated/games/$id')({
	component: RouteComponent,
})

function RouteComponent() {
	const params = Route.useParams()
	const { data: game, isLoading, error, refetch } = useGame(params.id)
	const { user } = useAuth()
	const readyGameMutation = useReadyGame()
	const startGameMutation = useStartGame()
	const editGameMutation = useEditGame()
	const { data: playerBoard } = usePlayerBoard(
		params.id,
		game?.status === 'ready' || game?.status === 'playing',
	)
	const [isCopied, setIsCopied] = useState(false)

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

	// Get bingo items from linked game cells
	const bingoItems =
		game.gameCells?.map((gc) => gc.cell?.value || '').slice(0, 25) || []
	const linkedCellsCount = game.gameCells?.length || 0
	const canStartGame = linkedCellsCount === 25

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'draft':
				return 'bg-yellow-500'
			case 'ready':
				return 'bg-blue-500'
			case 'playing':
				return 'bg-green-500'
			default:
				return 'bg-gray-500'
		}
	}

	const getStatusText = (status: string) => {
		switch (status) {
			case 'draft':
				return 'Setting Up'
			case 'ready':
				return 'Ready to Play'
			case 'playing':
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
			setTimeout(() => setIsCopied(false), 2000)
		} catch {
			console.warn('Clipboard API not supported')
			setIsCopied(true)
			setTimeout(() => setIsCopied(false), 2000)
		}
	}

	const handleReadyGame = () => {
		if (!game || !user) return

		readyGameMutation.mutate(game.friendlyId)
	}

	const handleStartGame = () => {
		if (!game || !user) return

		startGameMutation.mutate(game.friendlyId)
	}

	const handleEditGame = () => {
		if (!game || !user) return

		editGameMutation.mutate(game.friendlyId)
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

			<div className="border rounded-lg p-6 bg-card">
				<div className="flex justify-between items-start mb-4">
					<div className="flex items-center gap-2">
						<div
							className={`w-2 h-2 rounded-full ${getStatusColor(game.status)}`}
						/>
						<span className="font-medium">{getStatusText(game.status)}</span>
					</div>

					<div className="flex items-center gap-2">
						{isGameCreator && game.status === 'draft' && (
							<Button
								type="button"
								variant="default"
								size="sm"
								onClick={handleReadyGame}
								disabled={readyGameMutation.isPending || !canStartGame}
								className="flex items-center gap-2"
							>
								{readyGameMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Getting Ready...
									</>
								) : (
									<>
										<Play size={16} />
										Make Ready
									</>
								)}
							</Button>
						)}

						{isGameCreator && game.status === 'ready' && (
							<>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleEditGame}
									disabled={editGameMutation.isPending}
									className="flex items-center gap-2"
								>
									{editGameMutation.isPending ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Editing...
										</>
									) : (
										<>
											<Edit size={16} />
											Edit Game
										</>
									)}
								</Button>
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
							</>
						)}

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

					{game.status === 'draft' && (
						<div className="bg-muted/50 rounded-md p-3 flex items-center gap-3">
							<Loader2 className="animate-spin" />
							<p className="text-sm text-muted-foreground flex flex-col">
								<span>Setting up the game...</span>
								<span>
									Share the game code <strong>{game.friendlyId}</strong> or use
									the copy button above to invite your friends to join the bingo
									game.
								</span>
							</p>
						</div>
					)}

					{game.status === 'ready' && (
						<div className="bg-blue-50 dark:bg-blue-950 rounded-md p-3 flex items-center gap-3">
							<div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
							<p className="text-sm text-blue-700 dark:text-blue-300 flex flex-col">
								<span>Game is ready! Waiting to start...</span>
								<span>
									Players can now see their boards and prepare for the game.
								</span>
							</p>
						</div>
					)}

					{isGameCreator && game.status === 'draft' && (
						<div className="text-center">
							<span className="text-sm text-muted-foreground">
								{linkedCellsCount}/25 cells linked
								{!canStartGame && (
									<span className="block text-xs text-orange-600 dark:text-orange-400 mt-1">
										Add {25 - linkedCellsCount} more cells to start the game
									</span>
								)}
							</span>
						</div>
					)}
				</div>
			</div>

			<div className="flex gap-6">
				{isGameCreator && game.status === 'draft' && (
					<div className="w-80 flex-shrink-0">
						<CellManager
							gameId={game.id}
							gameCells={game.gameCells || []}
							onCellLinked={() => refetch()}
							onCellUnlinked={() => refetch()}
						/>
					</div>
				)}

				<div className="flex-1">
					{game.status === 'draft' && !isGameCreator ? (
						<div className="w-full max-w-2xl mx-auto">
							<div className="text-center p-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30">
								<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
								<h3 className="text-lg font-semibold mb-2 text-muted-foreground">
									Game Being Prepared
								</h3>
								<p className="text-sm text-muted-foreground">
									The game creator is setting up the bingo cells. Your board
									will appear once the game is ready.
								</p>
							</div>
						</div>
					) : game.status === 'draft' && isGameCreator ? (
						<div className="w-full max-w-2xl mx-auto">
							<div className="mb-4 text-center">
								<h3 className="text-lg font-semibold mb-2">
									Game Board Preview
								</h3>
								<p className="text-sm text-muted-foreground">
									Add cells using the manager on the left to see them appear
									here
								</p>
							</div>
							<BingoGrid items={bingoItems} disabled={true} />
						</div>
					) : (game.status === 'ready' || game.status === 'playing') &&
						playerBoard ? (
						<PlayerBingoGrid
							playerBoard={playerBoard}
							disabled={game.status !== 'playing'}
							canMark={isGameCreator && game.status === 'playing'}
							canShuffle={game.status === 'ready'}
						/>
					) : (game.status === 'ready' || game.status === 'playing') &&
						!playerBoard ? (
						<div className="w-full max-w-2xl mx-auto">
							<div className="text-center p-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30">
								<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
								<h3 className="text-lg font-semibold mb-2 text-muted-foreground">
									Loading Your Board
								</h3>
								<p className="text-sm text-muted-foreground">
									Preparing your personalized bingo board...
								</p>
							</div>
						</div>
					) : (
						<div className="w-full max-w-2xl mx-auto">
							<div className="grid grid-cols-5 gap-2 aspect-square">
								{Array.from({ length: 25 }, (_, i) => (
									<div
										key={`placeholder-cell-${i + 1}`}
										className="aspect-square bg-muted/50 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
									>
										<span className="text-xs text-muted-foreground font-mono">
											{i + 1}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
