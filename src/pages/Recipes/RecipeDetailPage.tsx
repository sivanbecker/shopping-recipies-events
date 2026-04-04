import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// TODO Stage 5: Full implementation
export default function RecipeDetailPage() {
  const { id } = useParams()
  return (
    <div className="space-y-4">
      <Link
        to="/recipes"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to recipes
      </Link>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-800">Recipe: {id}</h2>
        <p className="mt-2 text-sm text-gray-500">Stage 5 — Full recipe detail coming soon</p>
      </div>
    </div>
  )
}
