import { useCallback, useEffect, useRef, useState } from 'react'
import { tokenManager } from '@/lib/token-manager'

interface WebSocketMessage {
  type: string
  data?: unknown
}

interface WebSocketOptions<T extends WebSocketMessage = WebSocketMessage> {
  onMessage?: (message: T) => void
  onConnectionChange?: (connected: boolean) => void
  heartbeatInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket<T extends WebSocketMessage = WebSocketMessage>(
  gameId: string,
  options: WebSocketOptions<T> = {},
) {
  const {
    onMessage,
    onConnectionChange,
    heartbeatInterval = 30000,
    maxReconnectAttempts = 5,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'
  >('disconnected')

  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isIntentionalClose = useRef(false)
  const isAuthenticated = useRef(false)
  const connectionId = useRef<string | null>(null)

  const onMessageRef = useRef(onMessage)
  const onConnectionChangeRef = useRef(onConnectionChange)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange
  }, [onConnectionChange])

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  const updateConnectionStatus = useCallback((connected: boolean) => {
    setIsConnected(connected)
    onConnectionChangeRef.current?.(connected)
  }, [])

  const startHeartbeat = useCallback(() => {
    clearInterval(heartbeatIntervalRef.current!)
    heartbeatIntervalRef.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, heartbeatInterval)
  }, [heartbeatInterval])

  const handleTokenRefresh = useCallback(
    (_newConnectionId: string, newToken: string) => {
      if (
        ws.current?.readyState === WebSocket.OPEN &&
        isAuthenticated.current
      ) {
        ws.current.send(
          JSON.stringify({
            type: 'refresh_token',
            token: newToken,
          }),
        )
      }
    },
    [],
  )

  const authenticate = useCallback((token: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'authenticate',
          token,
        }),
      )
    }
  }, [])

  const connect = useCallback(async () => {
    const token = await tokenManager.getValidToken()
    if (!token || !gameId) {
      return
    }

    clearTimers()

    if (reconnectAttemptsRef.current === 0) {
      setConnectionStatus('connecting')
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const baseUrl = apiUrl.replace('/api', '')
    const wsUrl = baseUrl
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')
    const fullWsUrl = `${wsUrl}/ws/games/${gameId}`

    try {
      if (ws.current) {
        ws.current.close()
      }

      ws.current = new WebSocket(fullWsUrl)
      isAuthenticated.current = false

      ws.current.onopen = () => {
        updateConnectionStatus(true)
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
        authenticate(token)
        startHeartbeat()
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)

          if (message.type === 'authenticated') {
            isAuthenticated.current = true
            const data = message.data as { connectionId: string }
            connectionId.current = data.connectionId
          } else if (message.type === 'token_refreshed') {
            console.log('WebSocket token refreshed successfully')
          } else if (message.type === 'error') {
            setConnectionStatus('error')
            const data = message.data as { message: string }
            if (data.message.includes('Authentication failed')) {
              isAuthenticated.current = false
            }
          }

          onMessageRef.current?.(message as T)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onclose = (_event) => {
        updateConnectionStatus(false)
        isAuthenticated.current = false
        connectionId.current = null
        clearTimers()

        if (
          isIntentionalClose.current ||
          reconnectAttemptsRef.current >= maxReconnectAttempts
        ) {
          setConnectionStatus('disconnected')
          return
        }

        reconnectAttemptsRef.current += 1
        setConnectionStatus('reconnecting')

        const delay = Math.min(
          1000 * 2 ** (reconnectAttemptsRef.current - 1),
          30000,
        )

        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }

      ws.current.onerror = () => {
        setConnectionStatus('error')
        updateConnectionStatus(false)
      }
    } catch {
      setConnectionStatus('error')
      updateConnectionStatus(false)
    }
  }, [
    gameId,
    authenticate,
    startHeartbeat,
    clearTimers,
    updateConnectionStatus,
    maxReconnectAttempts,
  ])

  const disconnect = useCallback(
    (reason = 'manual') => {
      isIntentionalClose.current = true
      clearTimers()

      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: 'disconnect',
            reason,
          }),
        )
        ws.current.close(1000, `Disconnect: ${reason}`)
      }

      ws.current = null
      updateConnectionStatus(false)
      setConnectionStatus('disconnected')
      reconnectAttemptsRef.current = 0
      isAuthenticated.current = false
      connectionId.current = null
    },
    [clearTimers, updateConnectionStatus],
  )

  const reconnect = useCallback(() => {
    disconnect('manual_reconnect')
    isIntentionalClose.current = false
    reconnectAttemptsRef.current = 0

    setTimeout(() => {
      connect()
    }, 1000)
  }, [disconnect, connect])

  const send = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN && isAuthenticated.current) {
      ws.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  useEffect(() => {
    const token = tokenManager.getTokens()
    if (token?.access_token && gameId) {
      isIntentionalClose.current = false
      connect()
    }

    const unsubscribeTokens = tokenManager.subscribe((tokens) => {
      if (!tokens) {
        disconnect('token_cleared')
      }
    })

    const unsubscribeConnections = tokenManager.subscribeToConnectionUpdates(
      (connId, newToken) => {
        if (connId === '*' || connId === connectionId.current) {
          handleTokenRefresh(connId, newToken)
        }
      },
    )

    const handleBeforeUnload = () => disconnect('page_unload')
    const handlePageHide = () => disconnect('page_hide')

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      unsubscribeTokens()
      unsubscribeConnections()
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
      disconnect('component_unmount')
    }
  }, [gameId, connect, disconnect, handleTokenRefresh])

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    reconnect,
    send,
    reconnectAttempts: reconnectAttemptsRef.current,
    maxReconnectAttempts,
    isAuthenticated: isAuthenticated.current,
  }
}
