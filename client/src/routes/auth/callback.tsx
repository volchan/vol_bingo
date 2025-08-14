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
			console.log(window.location)

			const error = urlParams.get('error')
			const tokens = {
				access_token: urlParams.get('token'),
				refresh_token: urlParams.get('refresh_token'),
			}

			if (error) {
				console.error('OAuth error:', error)
				navigate({
					to: '/',
					search: { error },
				})
				return
			}

			if (tokens) {
				try {
					localStorage.setItem('twitch_tokens', JSON.stringify(tokens))

					refetch()

					const redirectUrl = sessionStorage.getItem('auth_redirect') || '/'
					sessionStorage.removeItem('auth_redirect')

					navigate({ to: redirectUrl })
				} catch (err) {
					console.error('Failed to parse tokens:', err)
					navigate({
						to: '/',
						search: { error: 'invalid_tokens' },
					})
				}
			} else {
				console.error('No tokens provided in callback')
				navigate({
					to: '/',
					search: { error: 'no_tokens' },
				})
			}
		}

		handleCallback()
	}, [refetch, navigate])
}
