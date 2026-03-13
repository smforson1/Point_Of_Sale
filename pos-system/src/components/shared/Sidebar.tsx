'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  BarChart3,
  UserCog,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  {
    title: 'POS',
    href: '/pos',
    icon: ShoppingCart,
    roles: ['ADMIN', 'MANAGER', 'CASHIER'],
  },
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    title: 'Products',
    href: '/products',
    icon: Package,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Boxes,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    title: 'Suppliers',
    href: '/suppliers',
    icon: Truck,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    title: 'Users',
    href: '/users',
    icon: UserCog,
    roles: ['ADMIN'],
  },
  {
    title: 'Audit Logs',
    href: '/audit-logs',
    icon: History,
    roles: ['ADMIN'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['ADMIN', 'MANAGER'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { role } = useAuthStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredNavItems = navItems.filter((item) =>
    role ? item.roles.includes(role) : false
  )

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 relative',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted',
                    isCollapsed && 'justify-center px-0'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium whitespace-nowrap">{item.title}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
