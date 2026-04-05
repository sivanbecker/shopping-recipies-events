import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Plus,
  ShoppingCart,
  Check,
  Trash2,
  Loader2,
  Search,
  Archive,
  RotateCcw,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { filterProducts } from '@/lib/filterProducts'
import type { ShoppingList, ShoppingItemWithProduct, Product } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function listDisplayName(list: ShoppingList, locale: string): string {
  if (list.name) return list.name
  return format(new Date(list.created_at), locale === 'he' ? 'dd/MM/yyyy' : 'MMM d, yyyy')
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  done: number
  total: number
}

function ProgressBar({ done, total }: ProgressBarProps) {
  const { t } = useTranslation('shopping')
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{t('shopping.progress', { done, total })}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: ShoppingItemWithProduct
  lang: string
  onToggle: () => void
  onRemove: () => void
  isToggling: boolean
}

function ItemRow({ item, lang, onToggle, onRemove, isToggling }: ItemRowProps) {
  const name = lang === 'he' ? item.product.name_he : (item.product.name_en ?? item.product.name_he)

  const unitLabel = (() => {
    const u = item.unit ?? item.product.default_unit
    if (!u) return null
    return lang === 'he' ? u.label_he : u.label_en
  })()

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-sm transition ${
        item.is_checked ? 'border-green-100 opacity-60' : 'border-gray-100'
      }`}
    >
      <button
        onClick={onToggle}
        disabled={isToggling}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
          item.is_checked
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-gray-300 hover:border-brand-400'
        }`}
      >
        {isToggling ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : item.is_checked ? (
          <Check className="h-3.5 w-3.5" />
        ) : null}
      </button>

      <div className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm font-medium ${
            item.is_checked ? 'text-gray-400 line-through' : 'text-gray-800'
          }`}
        >
          {name}
        </span>
        {(item.quantity !== 1 || unitLabel) && (
          <span className="text-xs text-gray-400">
            {item.quantity}
            {unitLabel ? ` ${unitLabel}` : ''}
          </span>
        )}
        {item.note && <span className="block text-xs italic text-gray-400">{item.note}</span>}
      </div>

      <button
        onClick={onRemove}
        className="rounded-lg p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── AddItemSheet ─────────────────────────────────────────────────────────────

interface AddItemSheetProps {
  listId: string
  lang: string
  onClose: () => void
}

function AddItemSheet({ listId, lang, onClose }: AddItemSheetProps) {
  const { t } = useTranslation('shopping')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name_he')
      if (error) throw error
      return data as Product[]
    },
    staleTime: 5 * 60 * 1000,
  })

  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from('shopping_items').insert({
        list_id: listId,
        product_id: productId,
        quantity: 1,
        added_by: user!.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_items', listId] })
    },
    onError: () => toast.error('Failed to add item'),
  })

  const createAndAddMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name_he: name,
          name_en: lang === 'en' ? name : null,
          created_by: user!.id,
          is_shared: false,
        })
        .select()
        .single()
      if (productError) throw productError

      const { error: itemError } = await supabase.from('shopping_items').insert({
        list_id: listId,
        product_id: product.id,
        quantity: 1,
        added_by: user!.id,
      })
      if (itemError) throw itemError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_items', listId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setSearch('')
    },
    onError: () => toast.error('Failed to create product'),
  })

  const filtered = filterProducts(products, search).slice(0, 20)
  const trimmed = search.trim()
  const exactMatch = trimmed
    ? products.some(
        p => p.name_he === trimmed || (p.name_en ?? '').toLowerCase() === trimmed.toLowerCase()
      )
    : false

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white shadow-xl">
        {/* Handle */}
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div className="px-4 pb-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">{t('items.add')}</h2>
            <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('items.searchPlaceholder')}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 ps-9 pe-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 space-y-0.5 overflow-y-auto px-4 pb-8">
          {filtered.map(product => {
            const name = lang === 'he' ? product.name_he : (product.name_en ?? product.name_he)
            return (
              <button
                key={product.id}
                onClick={() => addMutation.mutate(product.id)}
                disabled={addMutation.isPending}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-gray-800 transition hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 shrink-0 text-brand-400" />
                {name}
              </button>
            )
          })}

          {trimmed && !exactMatch && (
            <button
              onClick={() => createAndAddMutation.mutate(trimmed)}
              disabled={createAndAddMutation.isPending}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm text-brand-600 transition hover:bg-brand-50"
            >
              {createAndAddMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 shrink-0" />
              )}
              {t('items.createNew', { name: trimmed })}
            </button>
          )}

          {filtered.length === 0 && !trimmed && (
            <p className="py-6 text-center text-sm text-gray-400">{t('items.searchPlaceholder')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ListDetailPage ───────────────────────────────────────────────────────────

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation('shopping')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const lang = i18n.language
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: list, isLoading: listLoading } = useQuery<ShoppingList>({
    queryKey: ['shopping_list', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as ShoppingList
    },
    enabled: !!id,
  })

  const { data: items = [], isLoading: itemsLoading } = useQuery<ShoppingItemWithProduct[]>({
    queryKey: ['shopping_items', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_items')
        .select(
          '*, product:products(*, category:categories(*), default_unit:unit_types(*)), unit:unit_types(*)'
        )
        .eq('list_id', id!)
        .order('is_checked', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as ShoppingItemWithProduct[]
    },
    enabled: !!id,
  })

  // ── Mutations ────────────────────────────────────────────────────────────

  const toggleMutation = useMutation({
    mutationFn: async ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      const { error } = await supabase
        .from('shopping_items')
        .update({ is_checked: checked })
        .eq('id', itemId)
      if (error) throw error
    },
    onMutate: ({ itemId }) => {
      setTogglingIds(s => new Set(s).add(itemId))
    },
    onSettled: (_, __, { itemId }) => {
      setTogglingIds(s => {
        const next = new Set(s)
        next.delete(itemId)
        return next
      })
      queryClient.invalidateQueries({ queryKey: ['shopping_items', id] })
    },
    onError: () => toast.error('Failed to update item'),
  })

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('shopping_items').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_items', id] })
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
    },
    onError: () => toast.error('Failed to remove item'),
  })

  const archiveMutation = useMutation({
    mutationFn: async (archive: boolean) => {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ is_archived: archive, is_active: !archive })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: (_, archive) => {
      queryClient.invalidateQueries({ queryKey: ['shopping_list', id] })
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      toast.success(archive ? t('lists.markDone') : t('lists.reactivate'))
    },
    onError: () => toast.error('Failed to update list'),
  })

  // ── Derived state ─────────────────────────────────────────────────────────

  const checkedCount = items.filter(i => i.is_checked).length
  const totalCount = items.length

  // ── Loading / not found ───────────────────────────────────────────────────

  if (listLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    )
  }

  if (!list) {
    return (
      <div className="space-y-4">
        <Link
          to="/lists"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('lists.title')}
        </Link>
        <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          {t('lists.notFound')}
        </div>
      </div>
    )
  }

  const displayName = listDisplayName(list, lang)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 pb-24">
      {/* Back nav + header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to="/lists"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {t('lists.title')}
          </Link>
          <h1 className="truncate text-xl font-bold text-gray-800">{displayName}</h1>
        </div>

        {/* Archive / Reactivate */}
        {list.owner_id === user?.id && (
          <button
            onClick={() => archiveMutation.mutate(!list.is_archived)}
            disabled={archiveMutation.isPending}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
              list.is_archived
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {archiveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : list.is_archived ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            {list.is_archived ? t('lists.reactivate') : t('lists.markDone')}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && <ProgressBar done={checkedCount} total={totalCount} />}

      {/* Items */}
      {itemsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
        </div>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <ShoppingCart className="h-8 w-8 text-brand-500" />
          </div>
          <p className="font-semibold text-gray-700">{t('items.empty')}</p>
          <p className="mt-1 text-sm text-gray-400">{t('items.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              lang={lang}
              isToggling={togglingIds.has(item.id)}
              onToggle={() => toggleMutation.mutate({ itemId: item.id, checked: !item.is_checked })}
              onRemove={() => removeMutation.mutate(item.id)}
            />
          ))}
        </div>
      )}

      {/* FAB — only for active lists */}
      {!list.is_archived && (
        <button
          onClick={() => setShowAddSheet(true)}
          aria-label={t('items.add')}
          className="fixed bottom-20 end-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition hover:bg-brand-600 active:scale-95"
        >
          <Plus className="h-7 w-7" />
        </button>
      )}

      {showAddSheet && (
        <AddItemSheet listId={id!} lang={lang} onClose={() => setShowAddSheet(false)} />
      )}
    </div>
  )
}
