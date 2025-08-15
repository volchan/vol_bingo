import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { LoadingPage } from '@/components/loading'
import type { RouterContext } from '@/contexts/router-context'
import { NotFound } from '@/pages/NotFound'

export const Route = createRootRoute({
	component: RootComponent,
	context: (): RouterContext => ({
		authentication: {
			user: null,
			isAuthenticated: false,
			isLoading: true,
			login: () => {},
			logout: async () => {},
			refetch: () => {},
		},
	}),
	notFoundComponent: NotFound,
	pendingComponent: () => <LoadingPage message="Loading page..." />,
	errorComponent: ({ error }) => (
		<div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
			<h2 className="text-2xl font-semibold text-destructive">
				Navigation Error
			</h2>
			<p className="text-muted-foreground max-w-md mt-2">
				{error?.message || 'Failed to load the page'}
			</p>
		</div>
	),
})

function RootComponent() {
	return (
		<ErrorBoundary>
			<Suspense fallback={<LoadingPage />}>
				<Outlet />
			</Suspense>
			{import.meta.env.VITE_APP_ENV && (
				<>
					<ReactQueryDevtools initialIsOpen={false} position="right" />
					<TanStackRouterDevtools position="bottom-right" />
				</>
			)}
		</ErrorBoundary>
	)
}
