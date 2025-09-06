import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/api'
import { useAuth } from './use-auth'

interface WebSocketMessage {
  type: string
  data?: unknown
}

export function useWebSocket<T extends WebSocketMessage = WebSocketMessage>(
  gameId: string,
  onMessage?: (message: T) => void,
) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    | 'connecting'
    | 'connected'
    | 'disconnected'
    | 'error'
    | 'reconnecting'
    | 'refreshing_token'
  >('disconnected')
  const ws = useRef<WebSocket | null>(null)
  const { tokens } = useAuth()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const maxReconnectAttempts = 5
  const reconnectAttemptsRef = useRef(0)
  const tokenRefreshAttemptsRef = useRef(0)
  const maxTokenRefreshAttempts = 2
  const isIntentionalClose = useRef(false)
  const lastSuccessfulConnectionRef = useRef<number>(0)
  const onMessageRef = useRef(onMessage)

  // Update the ref when onMessage changes
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const connect = useCallback(() => {
    if (!tokens?.access_token || !gameId) {
      return
    }

    // Clear any pending reconnection timeout and heartbeat
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    // Only set connecting status if this is not a reconnection attempt
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
      // Close existing connection if any
      if (ws.current) {
        ws.current.close()
      }

      ws.current = new WebSocket(fullWsUrl)

      ws.current.onopen = () => {
        console.log('WebSocket connected successfully')
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0 // Reset only on successful connection
        tokenRefreshAttemptsRef.current = 0 // Reset token refresh attempts on successful connection
        lastSuccessfulConnectionRef.current = Date.now() // Track when we connected

        if (ws.current && tokens.access_token) {
          ws.current.send(
            JSON.stringify({
              type: 'authenticate',
              token: tokens.access_token,
            }),
          )

          // Start heartbeat to keep connection alive and detect disconnects quickly
          heartbeatIntervalRef.current = setInterval(() => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({ type: 'ping' }))
            }
          }, 30000) // Send ping every 30 seconds
        }
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)

          if (message.type === 'error') {
            setConnectionStatus('error')
          } else if (onMessageRef.current) {
            onMessageRef.current(message as T)
          }
        } catch {}
      }

      ws.current.onclose = async (event) => {
        console.log(
          'WebSocket closed:',
          event.code,
          event.reason,
          'wasClean:',
          event.wasClean,
        )
        setIsConnected(false)

        // Don't reconnect if it was an intentional close or max attempts reached
        if (
          isIntentionalClose.current ||
          reconnectAttemptsRef.current >= maxReconnectAttempts
        ) {
          setConnectionStatus('disconnected')
          if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.log('WebSocket max reconnection attempts reached')
          }
          return
        }

        // If it was a clean close, check if it might be due to auth issues
        if (event.wasClean) {
          // If connection was very recent (< 5 seconds), it's likely an immediate auth rejection
          const timeSinceLastConnection =
            Date.now() - lastSuccessfulConnectionRef.current

          // Check if we've already tried refreshing token too many times OR connection keeps failing immediately
          if (
            tokenRefreshAttemptsRef.current >= maxTokenRefreshAttempts ||
            timeSinceLastConnection < 5000
          ) {
            console.log(
              'Max token refresh attempts reached or immediate connection failure, not reconnecting',
            )
            setConnectionStatus('disconnected')
            return
          }

          // Server closed connection cleanly - might be auth issue
          console.log(
            `WebSocket closed cleanly by server, attempting token refresh (${tokenRefreshAttemptsRef.current + 1}/${maxTokenRefreshAttempts})`,
          )
          setConnectionStatus('refreshing_token')

          tokenRefreshAttemptsRef.current += 1

          try {
            // Try to refresh token first
            await apiClient.refreshToken()
            console.log('Token refreshed successfully, attempting reconnection')

            // Reconnect with fresh token after brief delay
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Reconnecting with refreshed token')
              connect()
            }, 1000)

            return
          } catch (error) {
            console.log('Token refresh failed, not reconnecting:', error)
            setConnectionStatus('disconnected')
            return
          }
        }

        // Only reconnect on unexpected disconnects (network issues, etc.)
        reconnectAttemptsRef.current += 1
        setConnectionStatus('reconnecting')

        const delay = Math.min(
          1000 * 2 ** (reconnectAttemptsRef.current - 1),
          30000,
        )

        console.log(
          `WebSocket disconnected unexpectedly, scheduling reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`,
        )

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(
            `Attempting WebSocket reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`,
          )
          connect()
        }, delay)
      }

      ws.current.onerror = () => {
        setConnectionStatus('error')
        setIsConnected(false)
      }
    } catch {
      setConnectionStatus('error')
      setIsConnected(false)
    }
  }, [tokens?.access_token, gameId]) // Removed onMessage from dependencies

  const disconnect = useCallback((reason = 'manual') => {
    isIntentionalClose.current = true

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        // Send disconnect message synchronously with minimal timeout
        ws.current.send(
          JSON.stringify({
            type: 'disconnect',
            reason: reason,
          }),
        )

        // Force close immediately for page navigation
        if (
          reason === 'page_unload' ||
          reason === 'page_hide' ||
          reason === 'route_change'
        ) {
          ws.current.close(1000, `Disconnect: ${reason}`)
        } else {
          // Give a brief moment for graceful disconnect message
          setTimeout(() => {
            if (ws.current) {
              ws.current.close(1000, `Disconnect: ${reason}`)
            }
          }, 100)
        }
      } catch {
        // Force close on send error
        ws.current.close(1000, `Disconnect: ${reason}`)
      }
    }

    ws.current = null
    setIsConnected(false)
    setConnectionStatus('disconnected')
    reconnectAttemptsRef.current = 0
  }, [])

  const reconnect = useCallback(() => {
    console.log('Manual WebSocket reconnection requested')
    disconnect('manual_reconnect')

    // Reset flags and attempt counts for fresh reconnection
    isIntentionalClose.current = false
    reconnectAttemptsRef.current = 0
    tokenRefreshAttemptsRef.current = 0

    // Attempt connection after brief delay
    setTimeout(() => {
      connect()
    }, 1000)
  }, [connect, disconnect]) // Removed connect, disconnect from dependencies

  useEffect(() => {
    if (tokens?.access_token && gameId) {
      isIntentionalClose.current = false
      connect()
    }

    const handleBeforeUnload = () => {
      disconnect('page_unload')
    }

    const handlePageHide = () => {
      disconnect('page_hide')
    }

    // Add event listeners for page navigation (but not tab switching)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('unload', () => disconnect('unload'))

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('unload', () => disconnect('unload'))
      disconnect('component_unmount')
    }
  }, [tokens?.access_token, gameId, connect, disconnect]) // Removed connect, disconnect from dependencies

  const send = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    }
  }

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    reconnect,
    send,
    reconnectAttempts: reconnectAttemptsRef.current,
    maxReconnectAttempts,
  }
}
