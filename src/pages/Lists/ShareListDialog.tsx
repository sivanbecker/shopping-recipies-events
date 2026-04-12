import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { ListMemberWithProfile } from '@/types'
import { UserAvatar } from '@/components/UserAvatar'
import { ContactPicker } from '@/components/ContactPicker'

interface Props {
  listId: string
  onClose: () => void
}

export function ShareListDialog({ listId, onClose }: Props) {
  const { t } = useTranslation('shopping')
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [emailError, setEmailError] = useState<string | null>(null)

  const { data: members = [], isLoading } = useQuery<ListMemberWithProfile[]>({
    queryKey: ['list_members', listId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_list_members', { p_list_id: listId })
      if (error) throw error
      return (data ?? []) as ListMemberWithProfile[]
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: async ({
      inviteEmail,
      inviteRole,
    }: {
      inviteEmail: string
      inviteRole: 'editor' | 'viewer'
    }) => {
      const { data: found, error: lookupError } = await supabase.rpc('find_user_by_email', {
        p_email: inviteEmail,
      })
      if (lookupError) throw lookupError
      if (!found || found.length === 0) {
        throw new Error('not_found')
      }
      const { user_id: foundUserId } = found[0]
      if (members.some(m => m.user_id === foundUserId)) {
        throw new Error('already_member')
      }
      const { error: insertError } = await supabase.from('list_members').insert({
        list_id: listId,
        user_id: foundUserId,
        role: inviteRole,
      })
      if (insertError) throw insertError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list_members', listId] })
      setEmail('')
      setEmailError(null)
      toast.success(t('sharing.addedSuccess'))
    },
    onError: (err: Error) => {
      if (err.message === 'not_found') {
        setEmailError(t('sharing.notFound'))
      } else if (err.message === 'already_member') {
        setEmailError(t('sharing.alreadyMember'))
      } else {
        setEmailError(err.message)
      }
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('list_members').delete().eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list_members', listId] })
      toast.success(t('sharing.removedSuccess'))
    },
    onError: () => toast.error(t('sharing.removeError')),
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      newRole,
    }: {
      memberId: string
      newRole: 'editor' | 'viewer'
    }) => {
      const { error } = await supabase
        .from('list_members')
        .update({ role: newRole })
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list_members', listId] })
    },
    onError: () => toast.error(t('sharing.updateRoleError')),
  })

  function handleAdd() {
    setEmailError(null)
    const trimmed = email.trim()
    if (!trimmed) return
    addMemberMutation.mutate({ inviteEmail: trimmed, inviteRole: role })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('sharing.title')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label={t('lists.cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Members section */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t('sharing.membersSection')}
          </p>
          {isLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-gray-400">{t('sharing.noMembers')}</p>
          ) : (
            <ul className="space-y-2">
              {members.map(member => (
                <li key={member.id} className="flex items-center gap-2">
                  <UserAvatar userId={member.user_id} displayName={member.display_name} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {member.display_name ?? member.user_id.slice(0, 8)}
                  </span>
                  <select
                    value={member.role}
                    disabled={updateRoleMutation.isPending}
                    onChange={e =>
                      updateRoleMutation.mutate({
                        memberId: member.id,
                        newRole: e.target.value as 'editor' | 'viewer',
                      })
                    }
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <option value="editor">{t('sharing.roleEditor')}</option>
                    <option value="viewer">{t('sharing.roleViewer')}</option>
                  </select>
                  <button
                    onClick={() => removeMemberMutation.mutate(member.id)}
                    disabled={removeMemberMutation.isPending}
                    className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    aria-label={t('sharing.removeMember')}
                  >
                    {removeMemberMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="my-4 border-t border-gray-100 dark:border-gray-700" />

        {/* Contact picker */}
        <ContactPicker
          onSelect={email => {
            setEmail(email)
            setEmailError(null)
          }}
          excludedUserIds={members.map(m => m.user_id)}
        />

        {/* Invite section */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t('sharing.inviteSection')}
          </p>
          <input
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              setEmailError(null)
            }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={t('sharing.emailPlaceholder')}
            className="mb-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
            autoComplete="email"
          />
          {emailError && <p className="mb-2 text-xs text-red-500">{emailError}</p>}
          <div className="flex gap-2">
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'editor' | 'viewer')}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="editor">{t('sharing.roleEditor')}</option>
              <option value="viewer">{t('sharing.roleViewer')}</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={!email.trim() || addMemberMutation.isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {addMemberMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('sharing.addButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
