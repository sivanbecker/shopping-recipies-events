import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Notification } from '@/types'

const LIST_LIMIT = 20

function notificationsKey(userId: string | undefined) {
  return ['notifications', userId] as const
}

function unreadCountKey(userId: string | undefined) {
  return ['notifications', userId, 'unread_count'] as const
}

export function useNotifications() {
  const { session } = useAuth()
  const userId = session?.user.id
  const queryClient = useQueryClient()

  const listQuery = useQuery<Notification[]>({
    queryKey: notificationsKey(userId),
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT)
      if (error) throw error
      return (data ?? []) as Notification[]
    },
    enabled: Boolean(userId),
    staleTime: 10_000,
  })

  const unreadQuery = useQuery<number>({
    queryKey: unreadCountKey(userId),
    queryFn: async () => {
      if (!userId) return 0
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_user_id', userId)
        .is('read_at', null)
      if (error) throw error
      return count ?? 0
    },
    enabled: Boolean(userId),
    staleTime: 10_000,
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey(userId) })
      queryClient.invalidateQueries({ queryKey: unreadCountKey(userId) })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_user_id', userId)
        .is('read_at', null)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey(userId) })
      queryClient.invalidateQueries({ queryKey: unreadCountKey(userId) })
    },
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey(userId) })
      queryClient.invalidateQueries({ queryKey: unreadCountKey(userId) })
    },
  })

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: notificationsKey(userId) })
          queryClient.invalidateQueries({ queryKey: unreadCountKey(userId) })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  return {
    notifications: listQuery.data ?? [],
    unreadCount: unreadQuery.data ?? 0,
    isLoading: listQuery.isLoading,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
  }
}
