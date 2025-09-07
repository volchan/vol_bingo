import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import type * as React from 'react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavSecondary({
  items,
  onLogout,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    textColor?: string
  }[]
  onLogout?: () => Promise<void>
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const handleItemClick = (item: (typeof items)[0]) => {
    if (item.url === '/logout' && onLogout) {
      onLogout()
    }
  }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild={item.url !== '/logout'}
                size="sm"
                className={
                  item.textColor
                    ? `${item.textColor} hover:${item.textColor}`
                    : ''
                }
                onClick={() => handleItemClick(item)}
              >
                {item.url === '/logout' ? (
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </div>
                ) : (
                  <Link to={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
