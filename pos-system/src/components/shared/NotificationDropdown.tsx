'use client'

import { useEffect, useState } from 'react'
import { Bell, AlertTriangle, Info, CheckCircle2, Loader2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Notification, NotificationType } from '@/types'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export function NotificationDropdown() {
  const { notifications, unreadCount, loading, deleteNotification, clearAll } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'LOW_STOCK': return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
      case 'OUT_OF_STOCK': return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
      default: return <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center text-[10px]"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-lg" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-3 px-4 border-b bg-muted/30">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll} 
              className="h-auto py-1 px-2 text-xs text-primary hover:bg-primary/10"
            >
              Clear all
            </Button>
          )}
        </div>
        
        <div className="h-[350px] overflow-y-auto w-full">
          {loading && notifications.length === 0 ? (
            <div className="flex justify-center flex-col gap-2 items-center h-full text-muted-foreground p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Loading updates...</span>
            </div>
          ) : notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={() => deleteNotification(notification.id)}
                  className={cn(
                    "p-4 border-b last:border-0 hover:bg-muted/50 transition-colors flex gap-3 items-start cursor-pointer w-full text-left",
                    !notification.is_read ? 'bg-primary/5' : ''
                  )}
                >
                  {getIcon(notification.type)}
                  <div className="flex flex-col gap-1 w-full flex-1">
                    <div className="flex justify-between items-start w-full gap-2">
                      <p className={cn("text-sm leading-tight font-medium", !notification.is_read ? 'text-foreground' : 'text-foreground/80')}>
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap whitespace-pre">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground gap-3 p-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p>You're all caught up!</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
