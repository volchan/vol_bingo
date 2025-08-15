import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/auth/callback')({
	component: RouteComponent,
})

function RouteComponent() {
	const { refetch } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		const handleCallback = async () => {
			const urlParams = new URLSearchParams(window.location.search)
			console.log('Callback URL:', window.location.href)
			console.log('URL params:', Object.fromEntries(urlParams.entries()))

			const error = urlParams.get('error')
			const jwtToken = urlParams.get('token')
			const refreshToken = urlParams.get('refresh_token')

			console.log('Extracted values:', { error, jwtToken, refreshToken })

			if (error) {
				console.error('OAuth error:', error)
				navigate({
					to: '/',
					search: { error },
				})
				return
			}

			// Only proceed if we have valid tokens from OAuth callback
			if (jwtToken && refreshToken) {
				try {
					// Store tokens from successful OAuth callback
					const tokens = {
						access_token: jwtToken,
						refresh_token: refreshToken,
						expires_in: 600,
					}
					console.log('Storing OAuth tokens:', tokens)
					localStorage.setItem('auth_tokens', JSON.stringify(tokens))

					// Verify storage
					const stored = localStorage.getItem('auth_tokens')
					console.log('Stored tokens verification:', stored)

					refetch()

					const redirectUrl = sessionStorage.getItem('auth_redirect') || '/'
					sessionStorage.removeItem('auth_redirect')

					console.log('Redirecting to:', redirectUrl)
					navigate({ to: redirectUrl })
				} catch (err) {
					console.error('Failed to process tokens:', err)
					navigate({
						to: '/',
						search: { error: 'invalid_tokens' },
					})
				}
			} else {
				console.error('No valid tokens provided in callback')
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
