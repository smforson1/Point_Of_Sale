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

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      
    if (error) {
      toast.error('Failed to mark notification as read')
      fetchNotifications() // Revert on error
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    // Optimistic
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)

    if (error) {
      toast.error('Failed to mark all as read')
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
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}
