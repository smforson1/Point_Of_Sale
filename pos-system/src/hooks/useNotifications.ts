'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'
import { toast } from 'react-hot-toast'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchNotifications = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
    setLoading(false)
  }

  const deleteNotification = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      
    if (error) {
      toast.error('Failed to delete notification')
      fetchNotifications() // Revert on error
    }
  }

  const clearAll = async () => {
    if (notifications.length === 0) return

    // Optimistic
    setNotifications([])
    setUnreadCount(0)

    const { error } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (error) {
      toast.error('Failed to clear notifications')
      fetchNotifications() 
    }
  }

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
          
          // Show toast for new low stock or out of stock items
          if (newNotification.type === 'LOW_STOCK' || newNotification.type === 'OUT_OF_STOCK') {
            toast(newNotification.title, {
              icon: '⚠️',
              duration: 5000,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return {
    notifications,
    unreadCount,
    loading,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications,
  }
}
