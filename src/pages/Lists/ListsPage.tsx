import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AvatarStack } from '@/components/AvatarStack'
import type { ShoppingList, ListMemberWithProfile } from '@/types'

// Fetch members for a single list (used by ListCard)
async function fetchListMembers(listId: string): Promise<ListMemberWithProfile[]> {
  const { data, error } = await supabase.rpc('get_list_members', { p_list_id: listId })
  if (error) throw error
  return (data ?? []) as ListMemberWithProfile[]
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ListWithCount = ShoppingList & {
  shopping_items: { id: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function itemCount(list: ListWithCount): number {
  return list.shopping_items?.length ?? 0
}

function listDisplayName(list: ShoppingList, locale: string): string {
  if (list.name) return list.name
  return format(new Date(list.created_at), locale.startsWith('he') ? 'dd/MM/yyyy' : 'MMM d, yyyy')
}

// ─── ListCard ─────────────────────────────────────────────────────────────────

interface ListCardProps {
  list: ListWithCount
  lang: string
}

function ListCard({ list, lang }: ListCardProps) {
  const { t } = useTranslation('shopping')
  const count = itemCount(list)
  const name = listDisplayName(list, lang)

  // Fetch members for this list (lazy, only when card is visible)
  const { data: members = [] } = useQuery<ListMemberWithProfile[]>({
    queryKey: ['list_members', list.id],
    queryFn: () => fetchListMembers(list.id),
  })

  return (
    <Link
      to={`/lists/${list.id}`}
      className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.98] dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-semibold text-gray-800 dark:text-gray-100">{name}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {t('lists.itemCount', { count })}
        </span>
        <div className="mt-1">
          <AvatarStack members={members} size={20} max={4} />
        </div>
      </div>

      {list.is_missing_list && (
        <span className="ms-2 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          {t('lists.missingList')}
        </span>
      )}

      {!list.is_archived && (
        <span className="ms-2 shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          {t('lists.active')}
        </span>
      )}
    </Link>
  )
}

// ─── NewListDialog ────────────────────────────────────────────────────────────

interface NewListDialogProps {
  onClose: () => void
}

function NewListDialog({ onClose }: NewListDialogProps) {
  const { t } = useTranslation('shopping')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  const createMutation = useMutation({
    mutationFn: async (listName: string) => {
      const { error } = await supabase.from('shopping_lists').insert({
        name: listName.trim() || null,
        owner_id: user!.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      onClose()
    },
    onError: () => {
      toast.error('Failed to create list')
    },
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100">
          {t('lists.new')}
        </h2>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('lists.namePlaceholder')}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          onKeyDown={e => {
            if (e.key === 'Enter') createMutation.mutate(name)
            if (e.key === 'Escape') onClose()
          }}
          autoFocus
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {t('lists.cancel')}
          </button>
          <button
            onClick={() => createMutation.mutate(name)}
            disabled={createMutation.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('lists.create')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ListsPage ────────────────────────────────────────────────────────────────

export default function ListsPage() {
  const { t, i18n } = useTranslation('shopping')
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDialog, setShowDialog] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const lang = i18n.language

  const { data: activeLists = [], isLoading } = useQuery<ListWithCount[]>({
    queryKey: ['shopping_lists', 'active', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*, shopping_items(id)')
        .eq('is_archived', false)
        .order('is_missing_list', { ascending: false }) // pin missing list first
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as ListWithCount[]
    },
    enabled: !!user,
  })

  const findOrCreateMissingMutation = useMutation({
    mutationFn: async () => {
      // Try to find existing active missing list
      const { data: existing } = await supabase
        .from('shopping_lists')
        .select('id')
        .eq('owner_id', user!.id)
        .eq('is_missing_list', true)
        .eq('is_archived', false)
        .maybeSingle()

      if (existing) return existing as { id: string }

      const { data: newList, error } = await supabase
        .from('shopping_lists')
        .insert({ name: null, owner_id: user!.id, is_missing_list: true })
        .select('id')
        .single()
      if (error) throw error
      return newList as { id: string }
    },
    onSuccess: list => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      navigate(`/lists/${list.id}`)
    },
    onError: () => toast.error('Failed to open missing items list'),
  })

  const { data: archivedLists = [], isLoading: isLoadingArchived } = useQuery<ListWithCount[]>({
    queryKey: ['shopping_lists', 'archived', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*, shopping_items(id)')
        .eq('is_archived', true)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as ListWithCount[]
    },
    enabled: !!user && showArchived,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('lists.title')}</h1>
      </div>

      {/* Active lists */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
        </div>
      ) : activeLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <ShoppingCart className="h-8 w-8 text-brand-500" />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">{t('lists.empty')}</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{t('lists.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeLists.map(list => (
            <ListCard key={list.id} list={list} lang={lang} />
          ))}
        </div>
      )}

      {/* Archived section toggle */}
      <button
        onClick={() => setShowArchived(v => !v)}
        className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <span className="flex items-center gap-1.5">
          {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {t('lists.archived')}
          {archivedLists.length > 0 && (
            <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700 dark:text-gray-300">
              {archivedLists.length}
            </span>
          )}
        </span>
      </button>

      {/* Archived lists */}
      {showArchived && (
        <div className="space-y-3">
          {isLoadingArchived ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : archivedLists.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">{t('lists.emptyArchive')}</p>
          ) : (
            archivedLists.map(list => <ListCard key={list.id} list={list} lang={lang} />)
          )}
        </div>
      )}

      {/* "Something missing?" FAB */}
      <button
        onClick={() => findOrCreateMissingMutation.mutate()}
        disabled={findOrCreateMissingMutation.isPending}
        aria-label={t('missing.addMissing')}
        className="fixed bottom-36 end-4 flex items-center gap-2 rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-500 active:scale-95 disabled:opacity-60"
      >
        {findOrCreateMissingMutation.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <AlertCircle className="h-5 w-5" />
        )}
        {t('missing.addMissing')}
      </button>

      {/* FAB */}
      <button
        onClick={() => setShowDialog(true)}
        aria-label={t('lists.new')}
        className="fixed bottom-20 end-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition hover:bg-brand-600 active:scale-95"
      >
        <Plus className="h-7 w-7" />
      </button>

      {showDialog && <NewListDialog onClose={() => setShowDialog(false)} />}
    </div>
  )
}
