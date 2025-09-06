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

    if ('redirect' in search && search.redirect) {
      sessionStorage.setItem('auth_redirect', search.redirect as string)
    }

    const tokensFromStorage = localStorage.getItem('auth_tokens')
    if (tokensFromStorage) {
      try {
        const tokens = JSON.parse(tokensFromStorage)
        if (tokens?.access_token) {
          const redirectTo =
            sessionStorage.getItem('auth_redirect') || '/dashboard'
          sessionStorage.removeItem('auth_redirect')
          return redirect({ to: redirectTo })
        }
      } catch {
        localStorage.removeItem('auth_tokens')
      }
    }
  },
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
