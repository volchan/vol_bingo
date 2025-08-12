import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { RouterContext } from '@/contexts/router-context'
import { NotFound } from '../pages/NotFound'

export const Route = createRootRoute({
	component: RootComponent,
	context: (): RouterContext => ({
		authentication: {
			user: null,
			isAuthenticated: false,
			isLoading: true
		}
	}),
	notFoundComponent: NotFound
})

function RootComponent() {
	return (
		<>
			<Outlet />
			<ReactQueryDevtools initialIsOpen={false} position="right" />
			<TanStackRouterDevtools position="bottom-right" />
		</>
	)
}
