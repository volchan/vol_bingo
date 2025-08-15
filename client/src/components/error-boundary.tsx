import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
	children: ReactNode
	fallback?: ReactNode
	onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
	hasError: boolean
	error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.props.onError?.(error, errorInfo)
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback
			}

			return (
				<div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
					<div className="space-y-4">
						<h2 className="text-2xl font-semibold text-destructive">
							Something went wrong
						</h2>
						<p className="text-muted-foreground max-w-md">
							{this.state.error?.message || 'An unexpected error occurred'}
						</p>
						<div className="flex gap-2">
							<Button
								onClick={() => window.location.reload()}
								variant="outline"
							>
								Reload Page
							</Button>
							<Button
								onClick={() =>
									this.setState({ hasError: false, error: undefined })
								}
								variant="default"
							>
								Try Again
							</Button>
						</div>
					</div>
				</div>
			)
		}

		return this.props.children
	}
}
