import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Event } from '@/types'

interface Props {
  event: Event
  onClose: () => void
}

type RetroFields = Pick<
  Event,
  | 'retro_enough_food'
  | 'retro_what_went_wrong'
  | 'retro_what_went_well'
  | 'retro_remember_next_time'
>

export default function EventRetroDialog({ event, onClose }: Props) {
  const { t } = useTranslation('events')
  const queryClient = useQueryClient()

  const [fields, setFields] = useState<RetroFields>({
    retro_enough_food: event.retro_enough_food ?? '',
    retro_what_went_wrong: event.retro_what_went_wrong ?? '',
    retro_what_went_well: event.retro_what_went_well ?? '',
    retro_remember_next_time: event.retro_remember_next_time ?? '',
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('events')
        .update({
          retro_enough_food: fields.retro_enough_food || null,
          retro_what_went_wrong: fields.retro_what_went_wrong || null,
          retro_what_went_well: fields.retro_what_went_well || null,
          retro_remember_next_time: fields.retro_remember_next_time || null,
        })
        .eq('id', event.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      toast.success(t('retro.saved'))
      onClose()
    },
    onError: () => toast.error(t('retro.saveError')),
  })

  const setField = (key: keyof RetroFields, value: string) =>
    setFields(prev => ({ ...prev, [key]: value }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-start justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('retro.title')}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('retro.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label={t('retro.cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <RetroField
            label={t('retro.enoughFood')}
            placeholder={t('retro.enoughFoodPlaceholder')}
            value={fields.retro_enough_food ?? ''}
            onChange={v => setField('retro_enough_food', v)}
          />
          <RetroField
            label={t('retro.whatWentWell')}
            placeholder={t('retro.whatWentWellPlaceholder')}
            value={fields.retro_what_went_well ?? ''}
            onChange={v => setField('retro_what_went_well', v)}
          />
          <RetroField
            label={t('retro.whatWentWrong')}
            placeholder={t('retro.whatWentWrongPlaceholder')}
            value={fields.retro_what_went_wrong ?? ''}
            onChange={v => setField('retro_what_went_wrong', v)}
          />
          <RetroField
            label={t('retro.rememberNextTime')}
            placeholder={t('retro.rememberNextTimePlaceholder')}
            value={fields.retro_remember_next_time ?? ''}
            onChange={v => setField('retro_remember_next_time', v)}
          />
        </div>

        <div className="flex gap-2 border-t border-gray-100 p-4 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t('retro.cancel')}
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-60"
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('retro.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

interface RetroFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

function RetroField({ label, placeholder, value, onChange }: RetroFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-xl border border-gray-200 bg-white p-2.5 text-sm focus:border-purple-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
    </label>
  )
}
