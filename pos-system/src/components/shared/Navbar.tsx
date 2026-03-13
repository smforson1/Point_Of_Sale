'use client'

import { useEffect, useState } from 'react'
import { Bell, LogOut, Menu, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useShiftStore } from '@/store/shiftStore'
import { ShiftManagementModal } from '../pos/ShiftManagementModal'
import { ThemeToggle } from './ThemeToggle'

export function Navbar() {
  const { profile, signOut } = useAuthStore()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
  const { currentShift } = useShiftStore()
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Check initial notification count
    const fetchNotifications = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
      setUnreadNotifications(count || 0)
    }

    fetchNotifications()

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          setUnreadNotifications((prev) => prev + 1)
          toast('New notification', { icon: '🔔' })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    signOut()
    router.push('/login')
  }

  return (
    <nav className="h-16 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-bold text-xl hidden md:block">
          POS <span className="text-primary">Master</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className={`hidden sm:flex gap-2 items-center h-8 ${
            currentShift 
              ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20' 
              : 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
          }`}
          onClick={() => setIsShiftModalOpen(true)}
        >
          <div className={`h-2 w-2 rounded-full ${currentShift ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-bold">{currentShift ? 'Shift Active' : 'No Active Shift'}</span>
        </Button>

        <ThemeToggle />

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center text-[10px]"
              variant="destructive"
            >
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.full_name || 'Staff Member'}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                  <Badge variant="outline" className="text-[10px] py-0">{profile?.role}</Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ShiftManagementModal 
        isOpen={isShiftModalOpen} 
        onClose={() => setIsShiftModalOpen(false)} 
      />
    </nav>
  )
}
