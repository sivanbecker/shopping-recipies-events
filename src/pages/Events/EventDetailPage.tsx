import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// TODO Stage 6: Full implementation
export default function EventDetailPage() {
  const { id } = useParams()
  return (
    <div className="space-y-4">
      <Link
        to="/events"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <h2 className="font-bold text-gray-800 dark:text-gray-100">Event: {id}</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Stage 6 — Full event detail coming soon</p>
      </div>
    </div>
  )
}
