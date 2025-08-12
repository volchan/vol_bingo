import type { ReactNode } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger
} from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'

interface AuthenticatedLayoutProps {
	readonly children: ReactNode
}

export default function AuthenticatedLayout({
	children
}: AuthenticatedLayoutProps) {
	const isMobile = useIsMobile()

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				{isMobile && (
					<header className="flex h-16 shrink-0 items-center gap-2">
						<div className="flex items-center gap-2 px-4">
							<SidebarTrigger className="-ml-1" />
						</div>
					</header>
				)}
				{children}
			</SidebarInset>
		</SidebarProvider>
	)
}
