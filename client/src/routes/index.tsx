import { BlockGameIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { TwitchButton } from '@/components/twitch-button'
import UnauthenticatedLayout from '@/layouts/UnauthenticatedLayout'

export const Route = createFileRoute('/')({
	component: RouteComponent,
	beforeLoad: async ({ search }) => {
		const hasError = 'error' in search
		if (hasError) return

		const userFromStorage = localStorage.getItem('twitch_tokens')
		if (userFromStorage) {
			return redirect({ to: '/dashboard' })
		}
	}
})

function RouteComponent() {
	return (
		<UnauthenticatedLayout>
			<div className="flex items-center justify-center flex-col h-full w-full">
				<h1 className="text-8xl font-extrabold antialiased mb-6 flex items-center justify-center gap-4">
					<HugeiconsIcon icon={BlockGameIcon} size={96} strokeWidth={2} />
					<span>{import.meta.env.VITE_APP_NAME}</span>
				</h1>

				<TwitchButton />
			</div>
		</UnauthenticatedLayout>
	)
}
