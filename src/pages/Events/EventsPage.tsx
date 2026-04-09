import { Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// TODO Stage 6: Full implementation
export default function EventsPage() {
  const { t } = useTranslation('events')
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
        <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('title')}</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('emptyHint')}</p>
      <p className="mt-6 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
        Stage 6 — Coming soon
      </p>
    </div>
  )
}
