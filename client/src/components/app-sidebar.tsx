import { BlockGameIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Blocks, FileText, LayoutDashboard, LogOut } from 'lucide-react'
import type * as React from 'react'
import { NavMain } from '@/components/nav-main'
import { NavProjects } from '@/components/nav-projects'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'

const data = {
	navMain: [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutDashboard,
			isActive: true,
		},
		{
			title: 'Cells',
			url: '/cells',
			icon: Blocks,
			isActive: true,
		},
		{
			title: 'Templates',
			url: '/templates',
			icon: FileText,
			isActive: true,
		},
	],
	navSecondary: [
		{
			title: 'Log Out',
			url: '/logout',
			icon: LogOut,
			textColor: 'text-destructive',
		},
	],
	projects: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user, logout } = useAuth()
	const navigate = useNavigate()

	const handleLogout = async () => {
		await logout()
		navigate({ to: '/' })
	}

	if (!user) {
		handleLogout()
		return null
	}

	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link to="/">
								<div>
									<HugeiconsIcon
										size={32}
										icon={BlockGameIcon}
										strokeWidth={2}
									/>
								</div>
								<div className="grid flex-1 text-left text-2xl font-bold leading-tight">
									<span>{import.meta.env.VITE_APP_NAME}</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				{data.projects.length > 0 && <NavProjects projects={data.projects} />}
				<NavSecondary
					items={data.navSecondary}
					className="mt-auto"
					onLogout={handleLogout}
				/>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	)
}
