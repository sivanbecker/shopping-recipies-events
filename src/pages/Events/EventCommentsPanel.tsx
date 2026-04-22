import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Send, X, Pencil, Trash2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { he, enUS } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { UserAvatar } from '@/components/UserAvatar'
import type { EventComment, EventCommentWithAuthor, Profile } from '@/types'

const COMMENT_MAX = 2000

interface Props {
  eventId: string
  onClose: () => void
}

function commentsKey(eventId: string) {
  return ['event_comments', eventId] as const
}

export default function EventCommentsPanel({ eventId, onClose }: Props) {
  const { t, i18n } = useTranslation('events')
  const { user, session } = useAuth()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const commentsQuery = useQuery<EventCommentWithAuthor[]>({
    queryKey: commentsKey(eventId),
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from('event_comments')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
      if (error) throw error
      const rows = (comments ?? []) as EventComment[]
      if (rows.length === 0) return []

      const userIds = Array.from(new Set(rows.map(r => r.user_id)))
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds)
      const profileMap = new Map<string, Pick<Profile, 'display_name' | 'avatar_url'>>()
      for (const p of (profiles ?? []) as Pick<
        Profile,
        'user_id' | 'display_name' | 'avatar_url'
      >[]) {
        profileMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url })
      }

      return rows.map(r => ({
        ...r,
        display_name: profileMap.get(r.user_id)?.display_name ?? null,
        avatar_url: profileMap.get(r.user_id)?.avatar_url ?? null,
      }))
    },
    enabled: Boolean(eventId),
  })

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('event_comments')
        .insert({ event_id: eventId, user_id: user.id, body })
      if (error) throw error
    },
    onSuccess: () => {
      setDraft('')
      queryClient.invalidateQueries({ queryKey: commentsKey(eventId) })
      broadcastCommentsChanged(eventId)
    },
    onError: () => toast.error(t('comments.sendError')),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      const { error } = await supabase.from('event_comments').update({ body }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      setEditingId(null)
      setEditBody('')
      queryClient.invalidateQueries({ queryKey: commentsKey(eventId) })
      broadcastCommentsChanged(eventId)
    },
    onError: () => toast.error(t('comments.updateError')),
  })

  const deleteMutation = useMutation({
    mutationFn: async (comment: EventCommentWithAuthor) => {
      const { error } = await supabase.from('event_comments').delete().eq('id', comment.id)
      if (error) throw error
      return comment
    },
    onSuccess: deleted => {
      queryClient.invalidateQueries({ queryKey: commentsKey(eventId) })
      broadcastCommentsChanged(eventId)
      toast(t('comments.deleted'), {
        action: {
          label: t('comments.undo'),
          onClick: () => {
            if (!user) return
            void supabase
              .from('event_comments')
              .insert({
                event_id: deleted.event_id,
                user_id: deleted.user_id,
                body: deleted.body,
              })
              .then(() => {
                queryClient.invalidateQueries({ queryKey: commentsKey(eventId) })
                broadcastCommentsChanged(eventId)
              })
          },
        },
      })
    },
    onError: () => toast.error(t('comments.deleteError')),
  })

  // Realtime subscription
  useEffect(() => {
    if (!eventId || !session) return
    supabase.realtime.setAuth(session.access_token)
    const channel = supabase
      .channel(`event-comments-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_comments' },
        payload => {
          const rowEventId =
            payload.eventType === 'DELETE'
              ? (payload.old as EventComment | null)?.event_id
              : (payload.new as EventComment | null)?.event_id
          if (rowEventId !== eventId) return
          queryClient.invalidateQueries({ queryKey: commentsKey(eventId) })
        }
      )
      .on('broadcast', { event: 'comments-changed' }, () => {
        queryClient.invalidateQueries({ queryKey: commentsKey(eventId) })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, session, queryClient])

  const dateLocale = i18n.language.startsWith('he') ? he : enUS
  const comments = commentsQuery.data ?? []

  const trimmedDraft = draft.trim()
  const canSend =
    trimmedDraft.length > 0 && trimmedDraft.length <= COMMENT_MAX && !sendMutation.isPending

  const isRtl = i18n.language.startsWith('he')

  const hasComments = comments.length > 0

  const headerTitle = useMemo(
    () => `${t('comments.title')} (${comments.length})`,
    [t, comments.length]
  )

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/40"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`ms-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-gray-900 ${
          isRtl ? 'me-auto ms-0' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{headerTitle}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label={t('comments.cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments feed */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {commentsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
            </div>
          ) : !hasComments ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('comments.empty')}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('comments.emptyHint')}
              </p>
            </div>
          ) : (
            comments.map(c => {
              const isMine = c.user_id === user?.id
              const isEditing = editingId === c.id
              const wasEdited =
                new Date(c.updated_at).getTime() - new Date(c.created_at).getTime() > 1000
              return (
                <div key={c.id} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="flex items-start gap-2">
                    <UserAvatar
                      userId={c.user_id}
                      displayName={c.display_name}
                      avatarUrl={c.avatar_url}
                      size={28}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {c.display_name ?? '—'}
                        </span>
                        <span className="shrink-0 text-[11px] text-gray-400">
                          {formatDistanceToNow(new Date(c.created_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                          {wasEdited && ` · ${t('comments.edited')}`}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editBody}
                            onChange={e => setEditBody(e.target.value.slice(0, COMMENT_MAX))}
                            maxLength={COMMENT_MAX}
                            rows={3}
                            className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-purple-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">
                              {t('comments.charCount', {
                                count: editBody.length,
                                max: COMMENT_MAX,
                              })}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingId(null)
                                  setEditBody('')
                                }}
                                className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                              >
                                {t('comments.cancel')}
                              </button>
                              <button
                                onClick={() => {
                                  const body = editBody.trim()
                                  if (!body || body === c.body) {
                                    setEditingId(null)
                                    setEditBody('')
                                    return
                                  }
                                  updateMutation.mutate({ id: c.id, body })
                                }}
                                disabled={updateMutation.isPending}
                                className="flex items-center gap-1 rounded-lg bg-purple-500 px-2 py-1 text-xs font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                                {t('comments.save')}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                          {c.body}
                        </p>
                      )}

                      {isMine && !isEditing && (
                        <div className="mt-1.5 flex gap-2">
                          <button
                            onClick={() => {
                              setEditingId(c.id)
                              setEditBody(c.body)
                            }}
                            className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-purple-600 dark:text-gray-400"
                          >
                            <Pencil className="h-3 w-3" />
                            {t('comments.edit')}
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(c)}
                            className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-600 dark:text-gray-400"
                          >
                            <Trash2 className="h-3 w-3" />
                            {t('comments.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-gray-100 p-3 dark:border-gray-800">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={e => setDraft(e.target.value.slice(0, COMMENT_MAX))}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSend) {
                  e.preventDefault()
                  sendMutation.mutate(trimmedDraft)
                }
              }}
              placeholder={t('comments.placeholder')}
              maxLength={COMMENT_MAX}
              rows={2}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-white p-2.5 text-sm focus:border-purple-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <button
              onClick={() => sendMutation.mutate(trimmedDraft)}
              disabled={!canSend}
              aria-label={t('comments.send')}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500 text-white hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-gray-700"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mt-1 text-end text-[11px] text-gray-400">
            {t('comments.charCount', { count: draft.length, max: COMMENT_MAX })}
          </div>
        </div>
      </div>
    </div>
  )
}

function broadcastCommentsChanged(eventId: string) {
  const ch = supabase.getChannels().find(c => c.topic === `realtime:event-comments-${eventId}`)
  void ch?.send({ type: 'broadcast', event: 'comments-changed', payload: {} })
}
