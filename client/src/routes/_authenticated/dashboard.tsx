import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
	component: RouteComponent,
	loader: ({ context }) => context
})

function RouteComponent() {
	const { authentication } = Route.useLoaderData()
	const { user } = authentication

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">Dashboard</h1>
			{user ? (
				<div>
					<p>Welcome, {user.displayName}!</p>
					<p>Your user ID is: {user.id}</p>
					{/* Add more dashboard content here */}
				</div>
			) : (
				<p>Loading user data...</p>
			)}
		</div>
	)
}
