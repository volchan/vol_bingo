import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AppSidebar } from '@/components/app-sidebar'
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger
} from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'
import type { RouterContext } from '@/contexts/router-context'
import { useIsMobile } from '@/hooks/use-mobile'
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
			<TanStackRouterDevtools position="bottom-right" />
		</>
	)
}
