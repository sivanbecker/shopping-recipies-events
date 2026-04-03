import { Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// TODO Stage 2: Full implementation
export default function ProductsPage() {
  const { i18n } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <Package className="h-8 w-8 text-blue-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-800">
        {i18n.language === 'he' ? 'מוצרים' : 'Products'}
      </h2>
      <p className="mt-6 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
        Stage 2 — Coming soon
      </p>
    </div>
  )
}
