import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { tokenManager } from '@/lib/token-manager'

export const Route = createFileRoute('/auth/callback')({
  component: RouteComponent,
})

function RouteComponent() {
  const { refetch } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)

      const error = urlParams.get('error')
      const jwtToken = urlParams.get('token')
      const refreshToken = urlParams.get('refresh_token')
      const expiresIn = urlParams.get('expires_in')

      if (error) {
        navigate({
          to: '/',
          search: { error },
        })
        return
      }

      if (jwtToken && refreshToken && expiresIn) {
        try {
          const tokens = {
            access_token: jwtToken,
            refresh_token: refreshToken,
            expires_in: Number.parseInt(expiresIn, 10),
          }
          tokenManager.setTokens(tokens)

          refetch()

          const redirectUrl = sessionStorage.getItem('auth_redirect') || '/'
          sessionStorage.removeItem('auth_redirect')

          navigate({ to: redirectUrl })
        } catch (_err) {
          navigate({
            to: '/',
            search: { error: 'invalid_tokens' },
          })
        }
      } else {
        navigate({
          to: '/',
          search: { error: 'no_tokens' },
        })
      }
    }

    handleCallback()
  }, [refetch, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">
          Processing authentication...
        </h2>
        <p className="text-muted-foreground">
          Please wait while we log you in.
        </p>
      </div>
    </div>
  )
}
