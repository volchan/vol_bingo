import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/_authenticated/dashboard')({
	component: RouteComponent
})

function RouteComponent() {
	const { user } = useAuth()

	console.log('Dashboard user:', user)

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
