import { Crown } from 'lucide-react'

interface ConnectedPlayer {
	id: string
	name: string
	isConnected: boolean
}

interface PlayersListProps {
	creator?: {
		id: string
		displayName: string
	} | null
	connectedPlayers: ConnectedPlayer[]
	currentUserId?: string
}

export function PlayersList({ creator, connectedPlayers, currentUserId }: PlayersListProps) {
	// Create combined list with creator first
	const allPlayers: Array<{ id: string; name: string; isConnected: boolean; isCreator?: boolean }> = []
	
	// Add all players, marking creator status
	connectedPlayers.forEach(player => {
		allPlayers.push({
			...player,
			isCreator: creator?.id === player.id
		})
	})
	
	// Sort so creator is first
	allPlayers.sort((a, b) => {
		if (a.isCreator && !b.isCreator) return -1
		if (!a.isCreator && b.isCreator) return 1
		return 0
	})
	
	return (
		<div className="space-y-4">
			<h3 className="font-semibold">Players ({allPlayers.length})</h3>
			<div className="space-y-3">
				{allPlayers.map((player) => (
					<div key={player.id} className="flex items-center gap-3">
						<div 
							className={`w-2 h-2 rounded-full ${
								player.isConnected ? 'bg-green-500' : 'bg-gray-400'
							}`}
							title={player.isConnected ? 'Online' : 'Offline'}
						/>
						<span className={`text-sm flex-1 ${
							player.id === currentUserId ? 'font-medium' : ''
						}`}>
							{player.name}
							{player.id === currentUserId && ' (You)'}
						</span>
						{player.isCreator && <Crown className="w-4 h-4 text-yellow-500" />}
					</div>
				))}
			</div>
		</div>
	)
}