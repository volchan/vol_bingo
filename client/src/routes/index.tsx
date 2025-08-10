import { BlockGameIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { TwitchButton } from '@/components/twitch-button'
import { validateAuth } from '@/contexts/router-context'

export const Route = createFileRoute('/')({
	component: RouteComponent,
	beforeLoad: async ({ search }) => {
		const hasError = 'error' in search
		if (hasError) return

		const { isAuthenticated } = await validateAuth()
		if (isAuthenticated) {
			throw redirect({ to: '/dashboard' })
		}
	}
})

function RouteComponent() {
	return (
		<div className="flex items-center justify-center flex-col h-full w-full">
			<h1 className="text-8xl font-extrabold antialiased mb-6 flex items-center justify-center gap-4">
				<HugeiconsIcon icon={BlockGameIcon} size={96} strokeWidth={2} />
				<span>Vol Bingo</span>
			</h1>

			<TwitchButton />
		</div>
	)
}
