import { ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// TODO Stage 3: Full implementation
export default function ListsPage() {
  const { t } = useTranslation('shopping')
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
        <ShoppingCart className="h-8 w-8 text-brand-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-800">{t('lists.title')}</h2>
      <p className="mt-2 text-sm text-gray-500">{t('lists.emptyHint')}</p>
      <p className="mt-6 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
        Stage 3 — Coming soon
      </p>
    </div>
  )
}
