
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, Users, Gift, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface GroupNotification {
  id: string
  type: 'pack_complete' | 'member_joined' | 'pack_expiring' | 'redemption_available'
  title: string
  message: string
  packId: string
  packName: string
  releaseTitle: string
  isRead: boolean
  createdAt: string
  data?: any
}

interface GroupPackNotificationsProps {
  className?: string
}

export default function GroupPackNotifications({ className }: GroupPackNotificationsProps) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<GroupNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (session?.user?.email) {
      loadNotifications()
      // Set up polling for real-time updates
      const interval = setInterval(loadNotifications, 30000) // Poll every 30 seconds
      return () => clearInterval(interval)
    }
  }, [session])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/listener/group-packs/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/listener/group-packs/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const dismissNotification = async (notificationId: string) => {
    try {
      const response = await fetch('/api/listener/group-packs/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        loadNotifications() // Refresh to get updated unread count
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error)
    }
  }

  const handleNotificationAction = async (notification: GroupNotification) => {
    await markAsRead(notification.id)

    // Handle different notification types
    switch (notification.type) {
      case 'pack_complete':
      case 'redemption_available':
        // Navigate to group packs page or show redemption flow
        toast.info('Opening group pack details...')
        // You could add navigation logic here
        break
      case 'member_joined':
        toast.success('Check out the updated group progress!')
        break
      case 'pack_expiring':
        toast.warning('Don\'t forget to complete your group pack!')
        break
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pack_complete':
      case 'redemption_available':
        return <Gift className="w-4 h-4 text-green-600" />
      case 'member_joined':
        return <Users className="w-4 h-4 text-blue-600" />
      case 'pack_expiring':
        return <Bell className="w-4 h-4 text-amber-600" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'pack_complete':
      case 'redemption_available':
        return <Badge variant="default" className="bg-green-500">Ready</Badge>
      case 'member_joined':
        return <Badge variant="default" className="bg-blue-500">New</Badge>
      case 'pack_expiring':
        return <Badge variant="destructive">Urgent</Badge>
      default:
        return <Badge variant="secondary">Info</Badge>
    }
  }

  if (notifications.length === 0 && !isLoading) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={`transition-all cursor-pointer hover:shadow-md ${
            !notification.isRead ? 'border-blue-200 bg-blue-50/50' : ''
          }`}
          onClick={() => handleNotificationAction(notification)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <div className="flex items-center gap-2">
                    {getNotificationBadge(notification.type)}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissNotification(notification.id)
                      }}
                      className="h-6 w-6 p-0 hover:bg-red-100"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">{notification.packName}</span>
                    <span className="mx-1">•</span>
                    <span>{notification.releaseTitle}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt))} ago
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Export notification count hook for use in navigation
export function useGroupPackNotifications() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (session?.user?.email) {
      const loadCount = async () => {
        try {
          const response = await fetch('/api/listener/group-packs/notifications')
          if (response.ok) {
            const data = await response.json()
            setUnreadCount(data.unreadCount || 0)
          }
        } catch (error) {
          console.error('Failed to load notification count:', error)
        }
      }

      loadCount()
      const interval = setInterval(loadCount, 60000) // Check every minute
      return () => clearInterval(interval)
    }
  }, [session])

  return unreadCount
}
