import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { X, Loader2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { leaveList } from '@/lib/lists'
import { useAuth } from '@/hooks/useAuth'
import { UserAvatar } from '@/components/UserAvatar'
import type { ListMemberWithProfile, ListRole } from '@/types'

interface Props {
  listId: string
  ownerId: string
  currentUserRole: ListRole | null
  onClose: () => void
}

export function CollaboratorsDialog({ listId, ownerId, currentUserRole, onClose }: Props) {
  const { t } = useTranslation('shopping')
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const { data: members = [], isLoading } = useQuery<ListMemberWithProfile[]>({
    queryKey: ['list_members', listId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_list_members', { p_list_id: listId })
      if (error) throw error
      return (data ?? []) as ListMemberWithProfile[]
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Not authenticated')
      return leaveList(listId, user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      toast.success(t('sharing.leaveSuccess'))
      navigate('/lists')
    },
    onError: () => toast.error(t('sharing.leaveError')),
  })

  const canLeave = currentUserRole !== null && currentUserRole !== 'owner' && !!user && user.id !== ownerId

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('sharing.collaboratorsTitle')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label={t('lists.cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : members.length === 0 ? (
          <p className="py-2 text-sm text-gray-400">{t('sharing.noMembers')}</p>
        ) : (
          <ul className="space-y-2">
            {members.map(member => (
              <li key={member.id} className="flex items-center gap-2">
                <UserAvatar
                  userId={member.user_id}
                  displayName={member.display_name}
                  avatarUrl={member.avatar_url}
                  size={32}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                  {member.display_name ?? member.user_id.slice(0, 8)}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {t(
                    member.user_id === ownerId
                      ? 'sharing.roleOwner'
                      : member.role === 'editor'
                        ? 'sharing.roleEditor'
                        : 'sharing.roleViewer'
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {canLeave && (
          <>
            <div className="my-4 border-t border-gray-100 dark:border-gray-700" />
            {confirming ? (
              <div>
                <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {t('sharing.leaveConfirmTitle')}
                </p>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  {t('sharing.leaveConfirmBody')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {t('lists.cancel')}
                  </button>
                  <button
                    onClick={() => leaveMutation.mutate()}
                    disabled={leaveMutation.isPending || !user}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                  >
                    {leaveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('sharing.leaveConfirm')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                {t('sharing.leaveList')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
