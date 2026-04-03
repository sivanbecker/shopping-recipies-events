import { BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// TODO Stage 5: Full implementation
export default function RecipesPage() {
  const { t } = useTranslation('recipes')
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <BookOpen className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-800">{t('title')}</h2>
      <p className="mt-2 text-sm text-gray-500">{t('emptyHint')}</p>
      <p className="mt-6 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
        Stage 5 — Coming soon
      </p>
    </div>
  )
}
