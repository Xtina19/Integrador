import type { Activity, Notification } from '@/types/domain'
import { nextSimpleId } from '@/utils/idGenerator'
import { nowISO, relativeTime } from '@/utils/timeUtils'

export function createActivity(message: string, module: string): Activity {
  const createdAt = nowISO()
  return {
    id: nextSimpleId('ACT'),
    message,
    module,
    createdAt,
    relativeTime: relativeTime(new Date(createdAt)),
  }
}

export function prependActivity(activities: Activity[], activity: Activity): Activity[] {
  return [activity, ...activities].slice(0, 50)
}

export function refreshActivityTimes(activities: Activity[]): Activity[] {
  const now = new Date()
  return activities.map((a) => ({
    ...a,
    relativeTime: relativeTime(new Date(a.createdAt), now),
  }))
}

export function createNotification(
  type: Notification['type'],
  title: string,
  message: string,
  module: string
): Notification {
  return {
    id: nextSimpleId('NOT'),
    type,
    title,
    message,
    createdAt: nowISO(),
    read: false,
    module,
  }
}

export function prependNotification(notifications: Notification[], notification: Notification): Notification[] {
  return [notification, ...notifications].slice(0, 30)
}

export function unreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length
}
