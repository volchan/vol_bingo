import { createFileRoute } from '@tanstack/react-router'
import {
	ConnectionError,
	ForbiddenError,
	GameNotFoundError,
	MaintenanceError,
	NetworkError,
	NotFoundError,
	ServerError,
	UnauthorizedError,
} from '@/components/error-pages'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_authenticated/test-errors')({
	component: RouteComponent,
})

function RouteComponent() {
	const errorComponents = [
		{ name: '404 - Not Found', component: <NotFoundError /> },
		{
			name: '500 - Server Error',
			component: (
				<ServerError error={new Error('Database connection failed')} />
			),
		},
		{ name: 'Network Error', component: <NetworkError /> },
		{ name: '401 - Unauthorized', component: <UnauthorizedError /> },
		{ name: '403 - Forbidden', component: <ForbiddenError /> },
		{
			name: 'Game Not Found',
			component: <GameNotFoundError gameId="ABC123" />,
		},
		{ name: 'Connection Error', component: <ConnectionError /> },
		{ name: 'Maintenance', component: <MaintenanceError /> },
	]

	const throwError = (type: string) => {
		switch (type) {
			case 'js-error':
				throw new Error('Test JavaScript error')
			case 'network':
				throw new Error('Network request failed')
			case 'auth':
				throw new Error('401 Unauthorized')
			default:
				throw new Error('Unknown error')
		}
	}

	return (
		<div className="container mx-auto p-4 space-y-6">
			<div className="text-center">
				<h1 className="text-3xl font-bold tracking-tight">Error Pages Test</h1>
				<p className="text-muted-foreground mt-2">
					Preview different error states and test error boundaries
				</p>
			</div>

			<div className="grid gap-4">
				<Card>
					<CardHeader>
						<CardTitle>Error Boundary Tests</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<Button
							onClick={() => throwError('js-error')}
							variant="destructive"
						>
							Throw JS Error
						</Button>
						<Button onClick={() => throwError('network')} variant="destructive">
							Throw Network Error
						</Button>
						<Button onClick={() => throwError('auth')} variant="destructive">
							Throw Auth Error
						</Button>
					</CardContent>
				</Card>

				{errorComponents.map((errorItem) => (
					<Card key={errorItem.name}>
						<CardHeader>
							<CardTitle className="text-sm">{errorItem.name}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="min-h-[300px]">{errorItem.component}</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
