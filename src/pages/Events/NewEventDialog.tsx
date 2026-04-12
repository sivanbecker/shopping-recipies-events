import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Event } from '@/types'

interface NewEventDialogProps {
  onClose: () => void
  event?: Event // if provided, edit mode
}

export default function NewEventDialog({ onClose, event }: NewEventDialogProps) {
  const { t } = useTranslation('events')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isEdit = !!event

  const [title, setTitle] = useState(event?.title ?? '')
  const [date, setDate] = useState(event?.date ? event.date.slice(0, 16) : '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [photoAlbumUrl, setPhotoAlbumUrl] = useState(event?.photo_album_url ?? '')

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        const { error } = await supabase
          .from('events')
          .update({
            title: title.trim(),
            date: new Date(date).toISOString(),
            location: location.trim() || null,
            notes: notes.trim() || null,
            photo_album_url: photoAlbumUrl.trim() || null,
          })
          .eq('id', event!.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('events').insert({
          title: title.trim(),
          date: new Date(date).toISOString(),
          location: location.trim() || null,
          owner_id: user!.id,
          notes: notes.trim() || null,
          photo_album_url: photoAlbumUrl.trim() || null,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['event', event!.id] })
      onClose()
    },
    onError: () => {
      toast.error('Failed to save event')
    },
  })

  const canSubmit = title.trim().length > 0 && date.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100">
          {isEdit ? t('edit') : t('new')}
        </h2>

        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('form.title')}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('form.titlePlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('form.date')}
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {/* Location */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('form.location')}
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={t('form.locationPlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('form.notes')}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('form.notesPlaceholder')}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Photo album URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('form.photoAlbum')}
            </label>
            <input
              type="url"
              value={photoAlbumUrl}
              onChange={e => setPhotoAlbumUrl(e.target.value)}
              placeholder={t('form.photoAlbumPlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? t('save') : t('create')}
          </button>
        </div>
      </div>
    </div>
  )
}
