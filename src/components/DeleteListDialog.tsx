import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { countCollaborators, softDeleteList } from '@/lib/lists'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  listId: string
  listName: string
  onClose: () => void
  onDeleted: () => void
}

export function DeleteListDialog({ listId, listName, onClose, onDeleted }: Props) {
  const { t } = useTranslation('shopping')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: collaboratorCount = 0, isLoading } = useQuery({
    queryKey: ['list_collaborators_count', listId],
    queryFn: () => countCollaborators(listId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteList(listId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      queryClient.invalidateQueries({ queryKey: ['shopping_list', listId] })
      toast.success(t('deleteList.success'))
      onDeleted()
    },
    onError: () => toast.error(t('deleteList.error')),
  })

  const body = isLoading
    ? ''
    : collaboratorCount === 0
      ? t('deleteList.bodySolo')
      : t('deleteList.bodyWithCollaborators', { count: collaboratorCount })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('deleteList.title')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label={t('lists.cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">{listName}</p>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">{body}</p>

        <button
          disabled
          className="mb-3 w-full rounded-xl border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400 dark:border-gray-700"
        >
          {t('deleteList.transferComingSoon')}
        </button>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t('lists.cancel')}
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t('deleteList.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
