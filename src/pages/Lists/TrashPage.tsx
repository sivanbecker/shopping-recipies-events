import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { restoreList, purgeList } from '@/lib/lists'
import { useAuth } from '@/hooks/useAuth'
import type { ShoppingList } from '@/types'

function listDisplayName(list: ShoppingList, locale: string): string {
  if (list.name) return list.name
  if (list.deleted_at)
    return formatDistanceToNow(new Date(list.deleted_at), {
      addSuffix: true,
    })
  return locale.startsWith('he') ? 'רשימה ללא שם' : 'Untitled list'
}

export default function TrashPage() {
  const { t, i18n } = useTranslation('shopping')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [purgeTarget, setPurgeTarget] = useState<string | null>(null)
  const lang = i18n.language

  const { data: trashedLists = [], isLoading } = useQuery<ShoppingList[]>({
    queryKey: ['shopping_lists', 'trash', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('owner_id', user!.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ShoppingList[]
    },
    enabled: !!user,
  })

  const restoreMutation = useMutation({
    mutationFn: (listId: string) => restoreList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      toast.success(t('trash.restoreSuccess'))
    },
    onError: () => toast.error(t('trash.restoreError')),
  })

  const purgeMutation = useMutation({
    mutationFn: (listId: string) => purgeList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      setPurgeTarget(null)
      toast.success(t('trash.purgeSuccess'))
    },
    onError: () => toast.error(t('trash.purgeError')),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/lists"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {t('lists.title')}
        </Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('trash.title')}</h1>
      </div>

      <p className="text-sm text-gray-400 dark:text-gray-500">{t('trash.retentionNote')}</p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
        </div>
      ) : trashedLists.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">{t('trash.empty')}</div>
      ) : (
        <div className="space-y-3">
          {trashedLists.map(list => (
            <div
              key={list.id}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800 dark:text-gray-100">
                  {listDisplayName(list, lang)}
                </p>
                {list.deleted_at && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {t('trash.deletedAgo', {
                      when: formatDistanceToNow(new Date(list.deleted_at), { addSuffix: true }),
                    })}
                  </p>
                )}
              </div>

              <button
                onClick={() => restoreMutation.mutate(list.id)}
                disabled={restoreMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100 disabled:opacity-60 dark:bg-green-950 dark:text-green-300"
              >
                {restoreMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {t('trash.restore')}
              </button>

              <button
                onClick={() => setPurgeTarget(list.id)}
                className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                {t('trash.purge')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Purge confirm dialog */}
      {purgeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={e => e.target === e.currentTarget && setPurgeTarget(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('trash.purgeConfirmTitle')}
            </h2>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              {t('trash.purgeConfirmBody')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPurgeTarget(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t('lists.cancel')}
              </button>
              <button
                onClick={() => purgeMutation.mutate(purgeTarget)}
                disabled={purgeMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {purgeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('trash.purge')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
