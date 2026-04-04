import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// TODO Stage 3: Full implementation
export default function ListDetailPage() {
  const { id } = useParams()
  return (
    <div className="space-y-4">
      <Link
        to="/lists"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to lists
      </Link>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-800">List: {id}</h2>
        <p className="mt-2 text-sm text-gray-500">Stage 3 — Full list detail coming soon</p>
      </div>
    </div>
  )
}
