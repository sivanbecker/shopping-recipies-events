import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ListRole } from '@/types'

/**
 * Returns the caller's effective role on a given list (owner/editor/viewer) or
 * null if they are neither owner nor a member. Drives client-side UX gating
 * only — RLS is the real enforcement layer.
 */
export function useListRole(listId: string | undefined) {
  return useQuery<ListRole | null>({
    queryKey: ['list_role', listId],
    queryFn: async () => {
      if (!listId) return null
      const { data, error } = await supabase.rpc('list_member_role', { p_list_id: listId })
      if (error) throw error
      return (data ?? null) as ListRole | null
    },
    enabled: Boolean(listId),
    staleTime: 30_000,
  })
}

export function canEdit(role: ListRole | null | undefined): boolean {
  return role === 'owner' || role === 'editor'
}

export function canOwn(role: ListRole | null | undefined): boolean {
  return role === 'owner'
}
