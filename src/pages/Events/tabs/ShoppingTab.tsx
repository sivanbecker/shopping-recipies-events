import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, ShoppingCart, ExternalLink, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { EventShoppingList, ShoppingList } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  eventId: string
  eventTitle: string
  isOwner: boolean
}

type LinkedList = EventShoppingList & {
  list_name: string
  item_count: number
}

// ─── Link List Sheet ──────────────────────────────────────────────────────────

interface LinkSheetProps {
  eventId: string
  linkedIds: Set<string>
  onClose: () => void
}

function LinkListSheet({ eventId, linkedIds, onClose }: LinkSheetProps) {
  const { t } = useTranslation('events')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: allLists = [] } = useQuery<ShoppingList[]>({
    queryKey: ['lists', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const linkMutation = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('event_shopping_lists')
        .insert({ event_id: eventId, list_id: listId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-shopping-lists', eventId] })
      onClose()
    },
    onError: () => toast.error(t('shoppingTab.linkError')),
  })

  const available = allLists.filter(l => !linkedIds.has(l.id))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-white pb-8 shadow-xl dark:bg-gray-900">
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
        <div className="px-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('shoppingTab.linkList')}
          </h3>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {available.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                {t('shoppingTab.noListsAvailable')}
              </p>
            ) : (
              available.map(list => (
                <button
                  key={list.id}
                  disabled={linkMutation.isPending}
                  onClick={() => linkMutation.mutate(list.id)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-gray-800 dark:text-gray-100">
                      {list.name || t('shoppingTab.unnamedList')}
                    </span>
                  </div>
                  <Plus className="h-4 w-4 text-purple-500" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ShoppingTab ──────────────────────────────────────────────────────────────

export default function ShoppingTab({ eventId, eventTitle, isOwner }: Props) {
  const { t } = useTranslation('events')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showLink, setShowLink] = useState(false)
  const [creatingNew, setCreatingNew] = useState(false)

  const { data: linkedLists = [], isLoading } = useQuery<LinkedList[]>({
    queryKey: ['event-shopping-lists', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_shopping_lists')
        .select('*, shopping_lists(name, id)')
        .eq('event_id', eventId)
      if (error) throw error

      // For each list, get item count
      const withCounts = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data as any[]).map(async row => {
          const { count } = await supabase
            .from('shopping_items')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', row.list_id)
          return {
            ...row,
            list_name: row.shopping_lists?.name ?? '',
            item_count: count ?? 0,
          }
        })
      )
      return withCounts
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('event_shopping_lists').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-shopping-lists', eventId] }),
    onError: () => toast.error(t('shoppingTab.unlinkError')),
  })

  const handleCreateNew = async () => {
    if (!user) return
    setCreatingNew(true)
    try {
      const name = t('shopping.listName', { eventName: eventTitle })
      const { data: list, error: listErr } = await supabase
        .from('shopping_lists')
        .insert({ name, owner_id: user.id })
        .select()
        .single()
      if (listErr || !list) throw listErr
      await supabase.from('event_shopping_lists').insert({ event_id: eventId, list_id: list.id })
      queryClient.invalidateQueries({ queryKey: ['event-shopping-lists', eventId] })
      toast.success(t('shoppingTab.listCreated'))
    } catch {
      toast.error(t('shoppingTab.createError'))
    } finally {
      setCreatingNew(false)
    }
  }

  const linkedIds = new Set(linkedLists.map(l => l.list_id))

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        {linkedLists.length > 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('shoppingTab.listCount', { count: linkedLists.length })}
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('shoppingTab.empty')}</p>
        )}

        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowLink(true)}
              className="flex items-center gap-1.5 rounded-xl border border-purple-300 px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/10"
            >
              <Link2 className="h-4 w-4" />
              {t('shoppingTab.linkList')}
            </button>
            <button
              onClick={handleCreateNew}
              disabled={creatingNew}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {creatingNew ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t('shoppingTab.newList')}
            </button>
          </div>
        )}
      </div>

      {/* Linked lists */}
      {linkedLists.length > 0 && (
        <div className="space-y-2">
          {linkedLists.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900"
            >
              <ShoppingCart className="h-5 w-5 shrink-0 text-purple-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {item.list_name || t('shoppingTab.unnamedList')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('shoppingTab.itemCount', { count: item.item_count })}
                </p>
              </div>
              <Link
                to={`/lists/${item.list_id}`}
                className="rounded-lg p-1.5 text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              {isOwner && (
                <button
                  onClick={() => unlinkMutation.mutate(item.id)}
                  disabled={unlinkMutation.isPending}
                  className="rounded-lg p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty icon */}
      {linkedLists.length === 0 && (
        <div className="flex justify-center py-6">
          <ShoppingCart className="h-10 w-10 text-gray-200 dark:text-gray-700" />
        </div>
      )}

      {showLink && (
        <LinkListSheet eventId={eventId} linkedIds={linkedIds} onClose={() => setShowLink(false)} />
      )}
    </div>
  )
}
