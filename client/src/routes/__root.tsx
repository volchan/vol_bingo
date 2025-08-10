import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AppSidebar } from '@/components/app-sidebar'
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger
} from '@/components/ui/sidebar'
import { AuthProvider } from '@/contexts/AuthContext'
import type { RouterContext } from '@/contexts/router-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { NotFound } from '../pages/NotFound'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			staleTime: 5 * 60 * 1000
		}
	}
})

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
	const isMobile = useIsMobile()

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<SidebarProvider>
					<AppSidebar />
					<SidebarInset>
						{isMobile && (
							<header className="flex h-16 shrink-0 items-center gap-2">
								<div className="flex items-center gap-2 px-4">
									<SidebarTrigger className="-ml-1" />
								</div>
							</header>
						)}
						<Outlet />
					</SidebarInset>
					<ReactQueryDevtools initialIsOpen={false} position="right" />
					<TanStackRouterDevtools position="bottom-right" />
				</SidebarProvider>
			</AuthProvider>
		</QueryClientProvider>
	)
}
