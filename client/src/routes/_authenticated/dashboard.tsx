import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { DashboardSkeleton, UserSkeleton } from '@/components/loading'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/_authenticated/dashboard')({
	component: RouteComponent,
	loader: ({ context }) => context,
	pendingComponent: DashboardSkeleton,
	errorComponent: ({ error }) => (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4 text-destructive">
				Dashboard Error
			</h1>
			<p className="text-muted-foreground">
				{error?.message || 'Failed to load dashboard'}
			</p>
		</div>
	),
})

function RouteComponent() {
	return (
		<ErrorBoundary>
			<div className="p-4">
				<h1 className="text-2xl font-bold mb-4">Dashboard</h1>
				<Suspense fallback={<UserSkeleton />}>
					<UserInfo />
				</Suspense>
				<Suspense fallback={<DashboardSkeleton />}>
					<DashboardContent />
				</Suspense>
			</div>
		</ErrorBoundary>
	)
}

function UserInfo() {
	const { user, isLoading } = useAuth()

	if (isLoading) {
		return <UserSkeleton />
	}

	if (!user) {
		return <div className="text-muted-foreground">No user data available</div>
	}

	return (
		<div className="mb-6 p-4 rounded-lg border bg-card">
			<h2 className="text-lg font-semibold mb-2">Welcome back!</h2>
			<p className="text-muted-foreground">
				Hello,{' '}
				<span className="font-medium text-foreground">{user.displayName}</span>
			</p>
			<p className="text-sm text-muted-foreground">User ID: {user.id}</p>
		</div>
	)
}

function DashboardContent() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			<div className="p-4 rounded-lg border bg-card">
				<h3 className="font-semibold mb-2">Quick Stats</h3>
				<p className="text-muted-foreground">
					Your dashboard statistics will appear here.
				</p>
			</div>
			<div className="p-4 rounded-lg border bg-card">
				<h3 className="font-semibold mb-2">Recent Activity</h3>
				<p className="text-muted-foreground">
					Your recent activity will appear here.
				</p>
			</div>
			<div className="p-4 rounded-lg border bg-card">
				<h3 className="font-semibold mb-2">Notifications</h3>
				<p className="text-muted-foreground">
					Your notifications will appear here.
				</p>
			</div>
		</div>
	)
}
