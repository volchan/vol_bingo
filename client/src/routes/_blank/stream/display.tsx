import { createFileRoute } from '@tanstack/react-router'
import { Loader2, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import type {
  PlayerBoard,
  StreamOutgoingMessage,
  WebSocketPlayerBoard,
} from 'shared'
import { BingoDialog } from '@/components/bingo-dialog'
import { PlayerBingoGrid } from '@/components/player-bingo-grid'

export const Route = createFileRoute('/_blank/stream/display')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || '',
    }
  },
})

interface StreamGameData {
  gameId: string
  gameTitle: string
  playerBoard: WebSocketPlayerBoard
}

interface BingoPlayer {
  playerId: string
  playerBoardId: string
  playerName: string
  bingoCount: number
  isMegaBingo: boolean
}

function RouteComponent() {
  const { token } = Route.useSearch()
  const [streamGameData, setStreamGameData] = useState<StreamGameData | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting')
  const [error, setError] = useState<string | null>(null)
  const [bingoPlayers, setBingoPlayers] = useState<BingoPlayer[]>([])
  const [newBingoPlayers, setNewBingoPlayers] = useState<BingoPlayer[]>([])
  const [showBingoDialog, setShowBingoDialog] = useState(false)
  const [isMegaBingo, setIsMegaBingo] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('No stream token provided')
      setIsLoading(false)
      return
    }

    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const baseReconnectDelay = 1000

    const connect = () => {
      try {
        if (ws) {
          ws.close()
          ws = null
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const apiUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
        const baseUrl = apiUrl.replace('/api', '')
        const wsHost = baseUrl.replace('http://', '').replace('https://', '')
        const wsUrl = `${protocol}//${wsHost}/ws/stream?token=${encodeURIComponent(token)}`

        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          setConnectionStatus('connecting')
          reconnectAttempts = 0
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as StreamOutgoingMessage

            if (data.type === 'stream_game_update' && data.data) {
              setStreamGameData({
                gameId: data.data.gameId,
                gameTitle: data.data.gameTitle,
                playerBoard: data.data.playerBoard,
              })
              setIsLoading(false)
              setError(null)
            } else if (data.type === 'no_stream_game') {
              setStreamGameData(null)
              setIsLoading(false)
              setError(null)
            } else if (data.type === 'authenticated') {
              setConnectionStatus('connected')
              setError(null)
            } else if (data.type === 'error') {
              setConnectionStatus('error')
              setError(data.data?.message || 'Authentication failed')
              setIsLoading(false)
            } else if (data.type === 'bingo_achieved' && data.data) {
              setBingoPlayers(data.data.bingoPlayers || [])
              setNewBingoPlayers(data.data.newBingoPlayers || [])
              setIsMegaBingo(data.data.isMegaBingo || false)
              setShowBingoDialog(true)
            }
          } catch {}
        }

        ws.onclose = (event) => {
          setConnectionStatus('disconnected')
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            const delay = baseReconnectDelay * 2 ** reconnectAttempts
            reconnectAttempts++

            reconnectTimeout = setTimeout(() => {
              connect()
            }, delay)
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            setError('Failed to connect after multiple attempts')
            setConnectionStatus('error')
          }
        }

        ws.onerror = () => {
          setConnectionStatus('error')
        }
      } catch {
        setError('Failed to create WebSocket connection')
        setConnectionStatus('error')
      }
    }

    connect()

    return () => {
      // Cleanup function
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (ws) {
        ws.close(1000, 'Component unmounting')
        ws = null
      }
    }
  }, [token])

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">No Token Provided</h1>
            <p className="text-sm text-muted-foreground">
              Please provide a valid stream integration token in the URL
              parameters.
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              ?token=your_stream_token_here
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Connection Error</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'bg-yellow-500 animate-pulse'
                      : connectionStatus === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                }`}
              />
              Status: {connectionStatus}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || connectionStatus !== 'connected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            {connectionStatus === 'connecting' ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <Wifi className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">
              {connectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Waiting for Game'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {connectionStatus === 'connecting'
                ? 'Establishing connection to stream service...'
                : 'Waiting for a game to be set for stream display...'}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'bg-yellow-500 animate-pulse'
                      : connectionStatus === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                }`}
              />
              Status: {connectionStatus}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!streamGameData || !streamGameData.playerBoard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">No Game Selected</h1>
            <p className="text-sm text-muted-foreground">
              Set a game to "Display on Stream" to see it here.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Connected
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen bg-background flex items-center justify-center p-2">
      <div className="w-full h-full max-w-none flex items-center justify-center">
        <div className="w-full h-full max-h-full max-w-full">
          <PlayerBingoGrid
            playerBoard={streamGameData.playerBoard as PlayerBoard}
            disabled={true}
            canMark={false}
            canShuffle={false}
            streamMode={true}
          />
        </div>
      </div>

      <BingoDialog
        open={showBingoDialog}
        onOpenChange={setShowBingoDialog}
        bingoPlayers={bingoPlayers}
        newBingoPlayers={newBingoPlayers}
        isMegaBingo={isMegaBingo}
      />
    </div>
  )
}
