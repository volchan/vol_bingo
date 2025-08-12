import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { validateAuth } from '@/contexts/router-context'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

export const Route = createFileRoute('/_authenticated')({
	beforeLoad: async ({ context, location }) => {
		const { user, isAuthenticated } = await validateAuth()

		if (!isAuthenticated) {
			throw redirect({
				to: '/',
				search: {
					redirect: location.href
				}
			})
		}

		// Return updated context with validated user data
		return {
			...context,
			authentication: {
				user,
				isAuthenticated: true,
				isLoading: false
			}
		}
	},
	component: () => (
		<AuthenticatedLayout>
			<Outlet />
		</AuthenticatedLayout>
	)
})
