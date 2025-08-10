import { Link } from '@tanstack/react-router'

export function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full text-center space-y-6">
				<div>
					<h1 className="text-6xl font-bold text-gray-900">404</h1>
					<h2 className="text-2xl font-semibold text-gray-700 mt-2">
						Page Not Found
					</h2>
					<p className="text-gray-500 mt-2">
						The page you're looking for doesn't exist.
					</p>
				</div>
				<Link
					to="/"
					className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
				>
					Go Home
				</Link>
			</div>
		</div>
	)
}
