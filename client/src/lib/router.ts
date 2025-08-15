import { createRouter } from '@tanstack/react-router'
import type { RouterContext } from '@/contexts/router-context'
import { routeTree } from '@/routeTree.gen'

export const router = createRouter({
	routeTree,
	context: {
		authentication: {
			user: null,
			isAuthenticated: false,
			isLoading: true,
			login: () => {},
			logout: async () => {},
			refetch: () => {},
		},
	} as RouterContext,
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
