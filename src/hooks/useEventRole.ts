import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { EventRole } from '@/types'

/**
 * Returns the caller's effective role on a given event (owner/editor/viewer)
 * or null if they are neither owner nor a member. Drives client-side UX
 * gating only — RLS is the real enforcement layer.
 */
export function useEventRole(eventId: string | undefined) {
  return useQuery<EventRole | null>({
    queryKey: ['event_role', eventId],
    queryFn: async () => {
      if (!eventId) return null
      const { data, error } = await supabase.rpc('event_member_role', { p_event_id: eventId })
      if (error) throw error
      return (data ?? null) as EventRole | null
    },
    enabled: Boolean(eventId),
    staleTime: 30_000,
  })
}

export function canEditEvent(role: EventRole | null | undefined): boolean {
  return role === 'owner' || role === 'editor'
}

export function canOwnEvent(role: EventRole | null | undefined): boolean {
  return role === 'owner'
}
