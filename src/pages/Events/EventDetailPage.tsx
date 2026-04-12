import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  Loader2,
  ExternalLink,
  Image,
  StickyNote,
  Users,
  UtensilsCrossed,
  Package,
  ShoppingCart,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { countdownLabel } from '@/lib/eventHelpers'
import type { Event } from '@/types'
import NewEventDialog from './NewEventDialog'

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS = ['invitees', 'equipment', 'recipes', 'shopping'] as const
type TabId = (typeof TABS)[number]

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  invitees: <Users className="h-4 w-4" />,
  equipment: <Package className="h-4 w-4" />,
  recipes: <UtensilsCrossed className="h-4 w-4" />,
  shopping: <ShoppingCart className="h-4 w-4" />,
}

// ─── EventDetailPage ─────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation('events')
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('invitees')

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Event
    },
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('events').delete().eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate('/events')
    },
    onError: () => toast.error('Failed to delete event'),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <Link
          to="/events"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" /> {t('title')}
        </Link>
        <p className="text-center text-gray-500 dark:text-gray-400">Not found</p>
      </div>
    )
  }

  const isOwner = event.owner_id === user?.id
  const countdown = countdownLabel(event.date)
  const dateStr = format(
    new Date(event.date),
    i18n.language.startsWith('he') ? 'dd/MM/yyyy HH:mm' : 'MMM d, yyyy h:mm a'
  )

  return (
    <div className="space-y-4">
      {/* Navigation + actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/events"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" /> {t('title')}
        </Link>

        {isOwner && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEdit(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Overview card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
        {/* Title + countdown */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{event.title}</h2>
          <span className="shrink-0 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            {t(countdown.key, countdown.params)}
          </span>
        </div>

        {/* Date */}
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4 text-purple-500" />
          {dateStr}
        </div>

        {/* Location */}
        {event.location && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4 text-purple-500" />
            {event.location}
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className="mt-3 flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <p className="whitespace-pre-wrap">{event.notes}</p>
          </div>
        )}

        {/* Photo album link */}
        {event.photo_album_url && (
          <div className="mt-3 flex items-center gap-2">
            <Image className="h-4 w-4 text-purple-500" />
            <a
              href={event.photo_album_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-purple-600 hover:underline dark:text-purple-400"
            >
              {t('detail.openAlbum')}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
              activeTab === tab
                ? 'bg-white text-purple-700 shadow-sm dark:bg-gray-700 dark:text-purple-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {TAB_ICONS[tab]}
            {t(`sections.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab content placeholder */}
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-12 text-center shadow-sm dark:bg-gray-900">
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('detail.comingSoon')}</p>
      </div>

      {/* Edit dialog */}
      {showEdit && <NewEventDialog onClose={() => setShowEdit(false)} event={event} />}

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
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
