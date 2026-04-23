import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { countdownLabel, isUpcoming } from '@/lib/eventHelpers'
import { AvatarStack } from '@/components/AvatarStack'
import type { Event, EventInvitee, EventMemberWithProfile } from '@/types'
import { Skeleton } from '@/components/Skeleton'

type EventWithInvitees = Event & { event_invitees: Pick<EventInvitee, 'party_size'>[] }
import NewEventDialog from './NewEventDialog'

// ─── EventCard ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  members,
}: {
  event: EventWithInvitees
  members: EventMemberWithProfile[]
}) {
  const { t, i18n } = useTranslation('events')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const countdown = countdownLabel(event.date)
  const upcoming = isUpcoming(event)
  const isOwner = event.owner_id === user?.id

  const dateStr = format(
    new Date(event.date),
    i18n.language.startsWith('he') ? 'dd/MM/yyyy HH:mm' : 'MMM d, yyyy h:mm a'
  )

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('events').delete().eq('id', event.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success(t('delete'))
    },
  })

  return (
    <>
      <div className="relative flex items-center justify-between rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
        <Link to={`/events/${event.id}`} className="flex min-w-0 flex-1 flex-col gap-1 p-4">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-gray-800 dark:text-gray-100">
              {event.title}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                upcoming
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {t(countdown.key, countdown.params)}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">{dateStr}</span>
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          )}
          {event.event_invitees.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Users className="h-3 w-3" />
              {t('invitees.peopleCount', {
                count: event.event_invitees.reduce((s, i) => s + i.party_size, 0),
              })}
            </span>
          )}
          {members.length > 1 && (
            <div className="mt-1">
              <AvatarStack members={members} size={20} max={4} />
            </div>
          )}
          {event.photo_album_url && /^https?:\/\//i.test(event.photo_album_url) && (
            <a
              href={event.photo_album_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
            >
              <ImageIcon className="h-3 w-3" />
              {t('detail.photoAlbum')}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </Link>

        {isOwner && (
          <button
            onClick={e => {
              e.preventDefault()
              setShowDeleteConfirm(true)
            }}
            className="me-3 shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={e => e.target === e.currentTarget && setShowDeleteConfirm(false)}
        >
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">{t('confirmDelete')}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('confirmDeleteHint', { name: event.title })}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate()
                  setShowDeleteConfirm(false)
                }}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── EventsPage ──────────────────────────────────────────────────────────────

export default function EventsPage() {
  const { t } = useTranslation('events')
  const { user } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    void import('./EventDetailPage')
  }, [])

  const {
    data: allEvents = [],
    isLoading,
    isError,
    error,
  } = useQuery<EventWithInvitees[]>({
    queryKey: ['events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_invitees(party_size)')
        .order('date', { ascending: true })
      if (error) throw error
      return data as unknown as EventWithInvitees[]
    },
    enabled: !!user,
  })

  const { data: allMembers = [] } = useQuery<EventMemberWithProfile[]>({
    queryKey: ['all_event_members', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_event_members_for_user')
      if (error) throw error
      return (data ?? []) as EventMemberWithProfile[]
    },
    enabled: !!user,
  })

  const membersByEvent = useMemo(() => {
    const map = new Map<string, EventMemberWithProfile[]>()
    for (const m of allMembers) {
      const arr = map.get(m.event_id)
      if (arr) arr.push(m)
      else map.set(m.event_id, [m])
    }
    return map
  }, [allMembers])

  const upcomingEvents = allEvents.filter(e => isUpcoming(e))
  const pastEvents = allEvents.filter(e => !isUpcoming(e)).reverse() // most recent first

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('title')}</h1>
      </div>

      {/* Upcoming events */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-3 w-1/3" />
              <Skeleton className="mt-1.5 h-3 w-1/4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {(error as Error)?.message ?? 'Failed to load events'}
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">{t('empty')}</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map(event => (
            <EventCard key={event.id} event={event} members={membersByEvent.get(event.id) ?? []} />
          ))}
        </div>
      )}

      {/* Past events toggle */}
      {pastEvents.length > 0 && (
        <>
          <button
            onClick={() => setShowPast(v => !v)}
            className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <span className="flex items-center gap-1.5">
              {showPast ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {t('pastEvents')}
              <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700 dark:text-gray-300">
                {pastEvents.length}
              </span>
            </span>
          </button>

          {showPast && (
            <div className="space-y-3">
              {pastEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  members={membersByEvent.get(event.id) ?? []}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowDialog(true)}
        className="fixed bottom-20 end-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg hover:bg-purple-600 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showDialog && <NewEventDialog onClose={() => setShowDialog(false)} />}
    </div>
  )
}
