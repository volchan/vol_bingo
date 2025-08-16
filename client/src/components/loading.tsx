import { Skeleton } from '@/components/ui/skeleton'

interface LoadingSpinnerProps {
	readonly size?: 'sm' | 'md' | 'lg'
	readonly className?: string
}

export function LoadingSpinner({
	size = 'md',
	className = '',
}: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
	}

	return (
		<div className={`animate-spin ${sizeClasses[size]} ${className}`}>
			<svg
				className="h-full w-full"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-label="Loading"
			>
				<title>Loading</title>
				<circle
					className="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					strokeWidth="4"
				/>
				<path
					className="opacity-75"
					fill="currentColor"
					d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				/>
			</svg>
		</div>
	)
}

interface LoadingPageProps {
	readonly message?: string
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
			<LoadingSpinner size="lg" />
			<p className="text-muted-foreground">{message}</p>
		</div>
	)
}

export function UserSkeleton() {
	return (
		<div className="flex items-center space-x-4">
			<Skeleton className="h-12 w-12 rounded-full" />
			<div className="space-y-2">
				<Skeleton className="h-4 w-[200px]" />
				<Skeleton className="h-4 w-[160px]" />
			</div>
		</div>
	)
}

export function CardSkeleton() {
	return (
		<div className="space-y-3">
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-[80%]" />
			<Skeleton className="h-4 w-[60%]" />
		</div>
	)
}

export function DashboardSkeleton() {
	const skeletonIds = Array.from(
		{ length: 6 },
		(_, i) => `skeleton-${Date.now()}-${i}`,
	)

	return (
		<div className="space-y-6 p-4">
			<div className="space-y-2">
				<Skeleton className="h-8 w-[200px]" />
				<Skeleton className="h-4 w-[300px]" />
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{skeletonIds.map((id) => (
					<div key={id} className="rounded-lg border p-4">
						<CardSkeleton />
					</div>
				))}
			</div>
		</div>
	)
}

export function DashboardFormSkeleton() {
	return (
		<div className="flex-1 flex flex-col gap-5 p-5 border rounded-lg bg-card">
			<Skeleton className="h-9 w-full" />
			<Skeleton className="h-9 w-full" />
		</div>
	)
}
