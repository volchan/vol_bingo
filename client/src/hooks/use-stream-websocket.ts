import { useEffect, useRef, useState } from 'react'

export function useStreamWebSocket(token?: string) {
  const [websocket, setWebsocket] = useState<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000

  useEffect(() => {
    if (!token) {
      setWebsocket(null)
      return
    }

    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = window.location.host
        const ws = new WebSocket(`${protocol}//${host}/ws/stream_integration`)

        ws.onopen = () => {
          console.log('Stream WebSocket connected')
          reconnectAttemptsRef.current = 0

          // Authenticate with stream token
          ws.send(
            JSON.stringify({
              type: 'authenticate_stream',
              token,
            }),
          )
        }

        ws.onclose = (event) => {
          console.log(
            'Stream WebSocket disconnected:',
            event.code,
            event.reason,
          )
          setWebsocket(null)

          // Attempt to reconnect if not a normal close
          if (
            event.code !== 1000 &&
            reconnectAttemptsRef.current < maxReconnectAttempts
          ) {
            const delay = baseReconnectDelay * 2 ** reconnectAttemptsRef.current
            reconnectAttemptsRef.current++

            console.log(
              `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
            )

            reconnectTimeoutRef.current = setTimeout(() => {
              connect()
            }, delay)
          }
        }

        ws.onerror = (error) => {
          console.error('Stream WebSocket error:', error)
        }

        setWebsocket(ws)
      } catch (error) {
        console.error('Failed to create stream WebSocket:', error)
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (websocket) {
        websocket.close(1000, 'Component unmounting')
      }
    }
  }, [token, websocket])

  useEffect(() => {
    return () => {
      if (websocket) {
        websocket.close(1000, 'Hook cleanup')
      }
    }
  }, [websocket])

  return websocket
}
