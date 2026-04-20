import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mic, MicOff, Sparkles, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Category, UnitType } from '@/types'
import { useVoiceInput } from '@/hooks/useVoiceInput'

// ─── Schema ───────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name_he: z.string().min(1),
  name_en: z.string().optional(),
  category_id: z.string().optional(),
  default_unit_id: z.string().optional(),
})
export type ProductFormData = z.infer<typeof productSchema>

// ─── ProductDialog ────────────────────────────────────────────────────────────

interface ProductDialogProps {
  mode: 'add' | 'edit'
  initialNameHe?: string
  product?: {
    name_he: string
    name_en?: string | null
    category_id?: string | null
    default_unit_id?: string | null
  } | null
  categories: Category[]
  unitTypes: UnitType[]
  lang: 'he' | 'en'
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: ProductFormData) => void
}

export function ProductDialog({
  mode,
  initialNameHe,
  product,
  categories,
  unitTypes,
  lang,
  isSubmitting,
  onClose,
  onSubmit,
}: ProductDialogProps) {
  const { t } = useTranslation()
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [voiceActiveLang, setVoiceActiveLang] = useState<'he' | 'en' | null>(null)
  const [wrongLangWarning, setWrongLangWarning] = useState<'he' | 'en' | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name_he: product?.name_he ?? initialNameHe ?? '',
      name_en: product?.name_en ?? '',
      category_id: product?.category_id ?? '',
      default_unit_id: product?.default_unit_id ?? '',
    },
  })

  const handleSuggest = useCallback(async () => {
    const nameHe = getValues('name_he')?.trim()
    if (!nameHe || isSuggesting) return

    setIsSuggesting(true)
    try {
      const { data, error } = await supabase.functions.invoke('suggest-product', {
        body: {
          name_he: nameHe,
          categories: categories.map(c => ({ id: c.id, name_he: c.name_he, name_en: c.name_en })),
          unit_types: unitTypes.map(u => ({
            id: u.id,
            code: u.code,
            label_he: u.label_he,
            label_en: u.label_en,
            type: u.type,
          })),
        },
      })
      if (!error && data && !data.error) {
        if (data.name_en) setValue('name_en', data.name_en)
        if (data.category_id) setValue('category_id', data.category_id)
        if (data.default_unit_id) setValue('default_unit_id', data.default_unit_id)
      }
    } catch {
      // Silent failure — user can fill fields manually
    } finally {
      setIsSuggesting(false)
    }
  }, [getValues, isSuggesting, categories, unitTypes, setValue])

  const handleVoiceResult = useCallback(
    (text: string, lang: 'he' | 'en') => {
      setValue(lang === 'he' ? 'name_he' : 'name_en', text)
      setVoiceActiveLang(null)
      setWrongLangWarning(null)
    },
    [setValue]
  )

  const handleWrongLanguage = useCallback((expectedLang: 'he' | 'en') => {
    setWrongLangWarning(expectedLang)
    setVoiceActiveLang(null)
  }, [])

  const {
    status: voiceStatus,
    start: startVoice,
    stop: stopVoice,
  } = useVoiceInput({
    onResult: text => handleVoiceResult(text, voiceActiveLang ?? 'he'),
    onWrongLanguage: () => handleWrongLanguage(voiceActiveLang ?? 'he'),
  })

  const handleVoiceClick = useCallback(
    (lang: 'he' | 'en') => {
      setWrongLangWarning(null)
      if (voiceActiveLang === lang && voiceStatus === 'listening') {
        stopVoice()
        setVoiceActiveLang(null)
      } else {
        setVoiceActiveLang(lang)
        startVoice(lang)
      }
    },
    [voiceActiveLang, voiceStatus, startVoice, stopVoice]
  )

  const unitGroups = (['count', 'weight', 'volume', 'cooking'] as const).map(type => ({
    type,
    label: t(`products.unitGroups.${type}`),
    units: unitTypes.filter(u => u.type === type),
  }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'add' ? t('products.addProduct') : t('products.editProduct')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Hebrew name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('products.nameHe')}
            </label>
            <div className="flex gap-2">
              <input
                {...register('name_he')}
                type="text"
                placeholder={t('products.namePlaceholder')}
                dir="rtl"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              {mode === 'add' && (
                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={isSuggesting}
                  title={t('products.suggest')}
                  className="shrink-0 rounded-xl border border-gray-200 px-3 py-2.5 text-gray-500 transition hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-brand-900 dark:hover:text-brand-400"
                >
                  {isSuggesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleVoiceClick('he')}
                title={t('products.voiceHe')}
                className={`shrink-0 rounded-xl border px-3 py-2.5 transition ${
                  voiceActiveLang === 'he' && voiceStatus === 'listening'
                    ? 'border-red-400 bg-red-50 text-red-500 dark:border-red-500 dark:bg-red-900/30 dark:text-red-400'
                    : 'border-gray-200 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-brand-900 dark:hover:text-brand-400'
                }`}
              >
                {voiceActiveLang === 'he' && voiceStatus === 'listening' ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.name_he && (
              <p className="mt-1 text-xs text-red-500">{t('validation.required')}</p>
            )}
            {wrongLangWarning === 'he' && (
              <p className="mt-1 text-xs text-amber-500">{t('products.voiceWrongLangHe')}</p>
            )}
          </div>

          {/* English name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('products.nameEn')}
            </label>
            <div className="flex gap-2">
              <input
                {...register('name_en')}
                type="text"
                placeholder={t('products.nameEnPlaceholder')}
                dir="ltr"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => handleVoiceClick('en')}
                title={t('products.voiceEn')}
                className={`shrink-0 rounded-xl border px-3 py-2.5 transition ${
                  voiceActiveLang === 'en' && voiceStatus === 'listening'
                    ? 'border-red-400 bg-red-50 text-red-500 dark:border-red-500 dark:bg-red-900/30 dark:text-red-400'
                    : 'border-gray-200 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-brand-900 dark:hover:text-brand-400'
                }`}
              >
                {voiceActiveLang === 'en' && voiceStatus === 'listening' ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            </div>
            {wrongLangWarning === 'en' && (
              <p className="mt-1 text-xs text-amber-500">{t('products.voiceWrongLangEn')}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('products.category')}
            </label>
            <select
              {...register('category_id')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">{t('products.noCategory')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon ? `${c.icon} ` : ''}
                  {lang === 'he' ? c.name_he : c.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Default unit */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('products.defaultUnit')}
            </label>
            <select
              {...register('default_unit_id')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">{t('products.noUnit')}</option>
              {unitGroups.map(group =>
                group.units.length > 0 ? (
                  <optgroup key={group.type} label={group.label}>
                    {group.units.map(u => (
                      <option key={u.id} value={u.id}>
                        {lang === 'he' ? u.label_he : u.label_en}
                      </option>
                    ))}
                  </optgroup>
                ) : null
              )}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('actions.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
