import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AuthProvider } from './contexts/AuthContext'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
	routeTree,
	context: {
		authentication: {
			user: null,
			isAuthenticated: false,
			isLoading: true
		}
	}
})

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			staleTime: 5 * 60 * 1000
		}
	}
})

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<RouterProvider router={router} />
			</AuthProvider>
			<ReactQueryDevtools initialIsOpen={false} position="right" />
		</QueryClientProvider>
	</StrictMode>
)
