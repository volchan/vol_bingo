import type { ReactNode } from 'react'

interface UnauthenticatedLayoutProps {
	readonly children: ReactNode
}

export default function UnauthenticatedLayout({
	children
}: UnauthenticatedLayoutProps) {
	return (
		<div className="h-screen w-screen place-content-center">{children}</div>
	)
}
