import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  Trash2,
  Loader2,
  Search,
  Archive,
  RotateCcw,
  Copy,
  X,
  ListPlus,
  ChevronDown,
  UserPlus,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useListRole, canEdit, canOwn } from '@/hooks/useListRole'
import { showUndoToast } from '@/lib/undo'
import type { ShoppingItemSnapshot } from '@/lib/undo'
import { filterProducts } from '@/lib/filterProducts'
import { ShareListDialog } from './ShareListDialog'
import { CollaboratorsDialog } from '@/components/CollaboratorsDialog'
import { DeleteListDialog } from '@/components/DeleteListDialog'
import { AvatarStack } from '@/components/AvatarStack'
import { UserAvatar } from '@/components/UserAvatar'
import type {
  ShoppingList,
  ShoppingItemWithProduct,
  Product,
  UnitType,
  ListMemberWithProfile,
} from '@/types'
import type { Database } from '@/types/database'

type ProductWithUnit = Product & { default_unit: UnitType | null }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function listDisplayName(list: ShoppingList, locale: string): string {
  if (list.name) return list.name
  return format(new Date(list.created_at), locale === 'he' ? 'dd/MM/yyyy' : 'MMM d, yyyy')
}

// Broadcast a cache-invalidation hint to all subscribers on this list's channel.
// walrus (Supabase Realtime RLS evaluation) fails for cross-table policies, so
// postgres_changes alone doesn't reach collaborators. Broadcast bypasses walrus —
// the actual data re-fetch is still protected by RLS on the REST side.
function broadcastChange(listId: string, event: 'items-changed' | 'list-changed') {
  const ch = supabase.getChannels().find(c => c.topic === `realtime:list-detail-${listId}`)
  void ch?.send({ type: 'broadcast', event, payload: {} })
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
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{t('shopping.progress', { done, total })}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
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
  shoppingMode?: boolean
  members?: ListMemberWithProfile[]
  editable?: boolean
}

function ItemRow({
  item,
  lang,
  onToggle,
  onRemove,
  isToggling,
  shoppingMode,
  members,
  editable = true,
}: ItemRowProps) {
  // Prefer last_edited_by for attribution, fall back to added_by for pre-migration rows
  const attributionUserId = item.last_edited_by ?? item.added_by
  const attributionMember = members?.find(m => m.user_id === attributionUserId)
  const name = item.product
    ? lang === 'he'
      ? item.product.name_he
      : (item.product.name_en ?? item.product.name_he)
    : '—'

  const unitLabel = (() => {
    const u = item.unit ?? item.product?.default_unit
    if (!u) return null
    return lang === 'he' ? u.label_he : u.label_en
  })()

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border bg-white shadow-sm transition dark:bg-gray-900 ${
        shoppingMode ? 'p-4' : 'p-3.5'
      } ${item.is_checked ? 'border-green-100 dark:border-green-900 opacity-60' : 'border-gray-100 dark:border-gray-700'}`}
    >
      <button
        onClick={onToggle}
        disabled={isToggling}
        className={`shrink-0 flex items-center justify-center rounded-full border-2 transition ${
          shoppingMode ? 'h-8 w-8' : 'h-6 w-6'
        } ${
          item.is_checked
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-gray-300 hover:border-brand-400 dark:border-gray-600'
        }`}
      >
        {isToggling ? (
          <Loader2 className={`animate-spin ${shoppingMode ? 'h-4 w-4' : 'h-3 w-3'}`} />
        ) : item.is_checked ? (
          <Check className={shoppingMode ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
        ) : null}
      </button>

      <div className="min-w-0 flex-1">
        <span
          className={`block truncate font-medium ${shoppingMode ? 'text-base' : 'text-sm'} ${
            item.is_checked ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'
          }`}
        >
          {name}
        </span>
        {(item.quantity !== 1 || unitLabel) && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {item.quantity}
            {unitLabel ? ` ${unitLabel}` : ''}
          </span>
        )}
        {item.note && <span className="block text-xs italic text-gray-400">{item.note}</span>}
      </div>

      <UserAvatar
        userId={attributionUserId}
        displayName={attributionMember?.display_name}
        avatarUrl={attributionMember?.avatar_url}
        size={20}
      />

      {!shoppingMode && editable && (
        <button
          onClick={onRemove}
          className="rounded-lg p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// ─── AddItemSheet ─────────────────────────────────────────────────────────────

interface AddItemSheetProps {
  listId: string
  lang: string
  items: ShoppingItemWithProduct[]
  onClose: () => void
}

function AddItemSheet({ listId, lang, items, onClose }: AddItemSheetProps) {
  const { t } = useTranslation('shopping')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [configuring, setConfiguring] = useState<ProductWithUnit | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [unitId, setUnitId] = useState<string | null>(null)

  const { data: products = [] } = useQuery({
    queryKey: ['products_with_units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, default_unit:unit_types(*)')
        .order('name_he')
      if (error) throw error
      return data as unknown as ProductWithUnit[]
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: unitTypes = [] } = useQuery({
    queryKey: ['unit_types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('unit_types').select('*').order('type')
      if (error) throw error
      return data as UnitType[]
    },
    staleTime: 60 * 60 * 1000,
  })

  function openConfigure(product: ProductWithUnit) {
    setConfiguring(product)
    setQuantity(1)
    setUnitId(product.default_unit?.id ?? null)
  }

  // Upsert: bump existing unchecked item's quantity, or insert new
  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (!configuring) return null
      const existing = items.find(i => i.product_id === configuring.id && !i.is_checked)
      if (existing) {
        const { error } = await supabase
          .from('shopping_items')
          .update({ quantity: Number(existing.quantity) + quantity, unit_id: unitId })
          .eq('id', existing.id)
        if (error) throw error
        return null // quantity bump — no undo (too complex; existing item still there)
      } else {
        const { data, error } = await supabase
          .from('shopping_items')
          .insert({
            list_id: listId,
            product_id: configuring.id,
            quantity,
            unit_id: unitId,
            added_by: user!.id,
          })
          .select('id, updated_at')
          .single()
        if (error) throw error
        return data as { id: string; updated_at: string }
      }
    },
    onSuccess: newItem => {
      queryClient.invalidateQueries({ queryKey: ['shopping_items', listId] })
      broadcastChange(listId, 'items-changed')
      if (newItem) {
        showUndoToast(
          { type: 'item_add', listId, itemId: newItem.id, at: newItem.updated_at },
          {
            label: t('undo.itemAdded'),
            undoLabel: t('undo.undoButton'),
            staleMessage: t('undo.staleMessage'),
            onUndone: () => {
              queryClient.invalidateQueries({ queryKey: ['shopping_items', listId] })
              broadcastChange(listId, 'items-changed')
            },
          }
        )
      }
      setConfiguring(null)
      setSearch('')
    },
    onError: () => toast.error('Failed to add item'),
  })

  // Create product then go to configure step (no item inserted yet)
  const createMutation = useMutation<ProductWithUnit, Error, string>({
    mutationFn: async (name: string) => {
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name_he: name,
          name_en: lang === 'en' ? name : null,
          created_by: user!.id,
          is_shared: false,
        })
        .select('*, default_unit:unit_types(*)')
        .single()
      if (error) throw error
      return product as unknown as ProductWithUnit
    },
    onSuccess: product => {
      queryClient.invalidateQueries({ queryKey: ['products_with_units'] })
      openConfigure(product)
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

  // ── Configure step ────────────────────────────────────────────────────────

  if (configuring) {
    const name = lang === 'he' ? configuring.name_he : (configuring.name_en ?? configuring.name_he)
    const isCount = !configuring.default_unit || configuring.default_unit.type === 'count'
    const unitCategory = configuring.default_unit?.type ?? 'count'
    const relevantUnits = unitTypes.filter(u => u.type === unitCategory)
    const existingItem = items.find(i => i.product_id === configuring.id && !i.is_checked)

    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-md rounded-t-2xl bg-white shadow-xl dark:bg-gray-900">
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="px-4 pb-8">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setConfiguring(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="text-base font-semibold text-gray-800 dark:text-gray-100">
                {name}
              </span>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Already-in-list notice */}
            {existingItem && (
              <div className="mb-3 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">
                {t('items.inList', { qty: existingItem.quantity })}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('items.quantity')}
              </label>
              {isCount ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="w-32 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              )}
            </div>

            {/* Unit chips */}
            {relevantUnits.length > 0 && (
              <div className="mb-6">
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('items.unit')}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setUnitId(null)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                      unitId === null
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {t('items.noUnit')}
                  </button>
                  {relevantUnits.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setUnitId(u.id)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                        unitId === u.id
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      {lang === 'he' ? u.label_he : u.label_en}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm */}
            <button
              onClick={() => upsertMutation.mutate()}
              disabled={upsertMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {upsertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('items.confirm')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Search step ───────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="px-4 pb-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {t('items.add')}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
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
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 ps-9 pe-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 space-y-0.5 overflow-y-auto px-4 pb-8">
          {filtered.map(product => {
            const name = lang === 'he' ? product.name_he : (product.name_en ?? product.name_he)
            const alreadyInList = items.some(i => i.product_id === product.id && !i.is_checked)
            return (
              <button
                key={product.id}
                onClick={() => openConfigure(product)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-gray-800 transition hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 shrink-0 text-brand-400" />
                <span className="flex-1">{name}</span>
                {alreadyInList && (
                  <span className="text-xs text-brand-500">{t('items.inCart')}</span>
                )}
              </button>
            )
          })}

          {trimmed && !exactMatch && (
            <button
              onClick={() => createMutation.mutate(trimmed)}
              disabled={createMutation.isPending}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm text-brand-600 transition hover:bg-brand-50"
            >
              {createMutation.isPending ? (
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
  const { user, session } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const lang = i18n.language
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [shoppingMode, setShoppingMode] = useState(false)
  const [showDoneDialog, setShowDoneDialog] = useState(false)
  const [showInCart, setShowInCart] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showCollaboratorsDialog, setShowCollaboratorsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: role } = useListRole(id)
  const isEditor = canEdit(role)
  const isOwner = canOwn(role)

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
      return (data ?? []) as unknown as ShoppingItemWithProduct[]
    },
    enabled: !!id,
  })

  const { data: members = [] } = useQuery<ListMemberWithProfile[]>({
    queryKey: ['list_members', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_list_members', { p_list_id: id! })
      if (error) throw error
      return (data ?? []) as ListMemberWithProfile[]
    },
    enabled: !!id,
  })

  // ── Realtime subscriptions ────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !session) return

    // Explicitly sync the session JWT to the Realtime client before subscribing.
    // Supabase JS v2 only calls setAuth on SIGNED_IN / TOKEN_REFRESHED events,
    // not on INITIAL_SESSION (the silent page-load restore), so walrus would
    // evaluate RLS with a null uid() for members if we don't do this ourselves.
    supabase.realtime.setAuth(session.access_token)

    const channel = supabase
      .channel(`list-detail-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
        },
        (
          payload: RealtimePostgresChangesPayload<
            Database['public']['Tables']['shopping_items']['Row']
          >
        ) => {
          const rowListId =
            payload.eventType === 'DELETE' ? payload.old?.list_id : payload.new?.list_id
          if (rowListId !== id) return

          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<ShoppingItemWithProduct[]>(
              ['shopping_items', id],
              old => old?.filter(item => item.id !== payload.old?.id) ?? []
            )
          } else if (payload.eventType === 'UPDATE') {
            // Patch is_checked in place (hot path); invalidate for all other updates
            const updated = payload.new
            if (updated && updated.is_checked !== undefined) {
              queryClient.setQueryData<ShoppingItemWithProduct[]>(
                ['shopping_items', id],
                old =>
                  old?.map(item =>
                    item.id === updated.id ? { ...item, is_checked: updated.is_checked } : item
                  ) ?? []
              )
            } else {
              queryClient.invalidateQueries({ queryKey: ['shopping_items', id] })
            }
          } else {
            // INSERT — need fresh join from DB
            queryClient.invalidateQueries({ queryKey: ['shopping_items', id] })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopping_lists',
        },
        (
          payload: RealtimePostgresChangesPayload<
            Database['public']['Tables']['shopping_lists']['Row']
          >
        ) => {
          if (!('id' in payload.new) || payload.new.id !== id) return
          queryClient.invalidateQueries({ queryKey: ['shopping_list', id] })
          queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
        }
      )
      .on('broadcast', { event: 'items-changed' }, () => {
        queryClient.invalidateQueries({ queryKey: ['shopping_items', id] })
      })
      .on('broadcast', { event: 'list-changed' }, () => {
        queryClient.invalidateQueries({ queryKey: ['shopping_list', id] })
        queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, queryClient, session])

  // ── Mutations ────────────────────────────────────────────────────────────

  const toggleMutation = useMutation({
    mutationFn: async ({
      itemId,
      checked,
      updatedAt: _updatedAt,
    }: {
      itemId: string
      checked: boolean
      updatedAt: string
    }) => {
      const { data, error } = await supabase
        .from('shopping_items')
        .update({ is_checked: checked })
        .eq('id', itemId)
        .select('updated_at')
        .single()
      if (error) throw error
      return data
    },
    onMutate: ({ itemId }) => {
      setTogglingIds(s => new Set(s).add(itemId))
    },
    onSuccess: (data, { itemId, checked, updatedAt }) => {
      showUndoToast(
        { type: 'item_toggle', itemId, before: !checked, updatedAt: data?.updated_at ?? updatedAt },
        {
          label: checked ? t('undo.itemChecked') : t('undo.itemUnchecked'),
          undoLabel: t('undo.undoButton'),
          staleMessage: t('undo.staleMessage'),
          onUndone: () => {
            queryClient.invalidateQueries({ queryKey: ['shopping_items', id] })
            broadcastChange(id!, 'items-changed')
          },
        }
      )
    },
    onSettled: (_, __, { itemId }) => {
      setTogglingIds(s => {
        const next = new Set(s)
        next.delete(itemId)
        return next
      })
      queryClient.invalidateQueries({ queryKey: ['shopping_items', id] })
      broadcastChange(id!, 'items-changed')
    },
    onError: () => toast.error('Failed to update item'),
  })

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // Capture snapshot before deleting so we can re-insert on undo
      const snapshot = items.find(i => i.id === itemId)
      const { error } = await supabase.from('shopping_items').delete().eq('id', itemId)
      if (error) throw error
      return snapshot
    },
    onSuccess: snapshot => {
      queryClient.invalidateQueries({ queryKey: ['shopping_items', id] })
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      broadcastChange(id!, 'items-changed')
      if (snapshot) {
        const snap: ShoppingItemSnapshot = {
          list_id: snapshot.list_id,
          product_id: snapshot.product_id,
          quantity: snapshot.quantity,
          unit_id: snapshot.unit_id,
          is_checked: snapshot.is_checked,
          added_by: snapshot.added_by,
          note: snapshot.note,
          sort_order: snapshot.sort_order,
          recipe_id: snapshot.recipe_id,
        }
        showUndoToast(
          { type: 'item_remove', listId: id!, snapshot: snap },
          {
            label: t('undo.itemRemoved'),
            undoLabel: t('undo.undoButton'),
            staleMessage: t('undo.staleMessage'),
            onUndone: () => {
              queryClient.invalidateQueries({ queryKey: ['shopping_items', id] })
              broadcastChange(id!, 'items-changed')
            },
          }
        )
      }
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
      broadcastChange(id!, 'list-changed')
      toast.success(archive ? t('lists.markDone') : t('lists.reactivate'))
    },
    onError: () => toast.error('Failed to update list'),
  })

  const convertToListMutation = useMutation({
    mutationFn: async () => {
      const { data: newList, error: listError } = await supabase
        .from('shopping_lists')
        .insert({ name: list!.name, owner_id: user!.id, is_active: true, is_archived: false })
        .select()
        .single()
      if (listError) throw listError

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('shopping_items').insert(
          items.map(item => ({
            list_id: newList.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_id: item.unit_id,
            note: item.note,
            sort_order: item.sort_order,
            added_by: user!.id,
            is_checked: false,
          }))
        )
        if (itemsError) throw itemsError
      }

      // Delete the missing list now that items have been copied
      const { error: deleteError } = await supabase.from('shopping_lists').delete().eq('id', id!)
      if (deleteError) throw deleteError

      return newList
    },
    onSuccess: newList => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      navigate(`/lists/${newList.id}`)
      toast.success(t('missing.convertToList'), {
        action: { label: t('lists.open'), onClick: () => navigate(`/lists/${newList.id}`) },
      })
    },
    onError: () => toast.error('Failed to convert list'),
  })

  const cloneMutation = useMutation({
    mutationFn: async () => {
      const { data: newList, error: listError } = await supabase
        .from('shopping_lists')
        .insert({ name: list!.name, owner_id: user!.id, is_active: true, is_archived: false })
        .select()
        .single()
      if (listError) throw listError

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('shopping_items').insert(
          items.map(item => ({
            list_id: newList.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_id: item.unit_id,
            note: item.note,
            sort_order: item.sort_order,
            added_by: user!.id,
            is_checked: false,
          }))
        )
        if (itemsError) throw itemsError
      }

      return newList
    },
    onSuccess: newList => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      toast.success(t('lists.cloneSuccess'), {
        action: { label: t('lists.open'), onClick: () => navigate(`/lists/${newList.id}`) },
      })
    },
    onError: () => toast.error('Failed to clone list'),
  })

  // ── Derived state ─────────────────────────────────────────────────────────

  const uncheckedItems = items.filter(i => !i.is_checked)
  const checkedItems = items.filter(i => i.is_checked)
  const checkedCount = checkedItems.length
  const totalCount = items.length

  // ── Loading / not found ───────────────────────────────────────────────────

  if (listLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    )
  }

  if (!list && !listLoading) {
    // RLS filtered the list — either deleted or we lost access
    toast.error(t('sharing.noAccess'), { id: 'no-access' })
    navigate('/lists', { replace: true })
    return null
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
        <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
          {t('lists.notFound')}
        </div>
      </div>
    )
  }

  const displayName = listDisplayName(list, lang)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`space-y-4 ${shoppingMode ? 'pb-36' : 'pb-24'}`}>
      {/* Back nav + header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to="/lists"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {t('lists.title')}
          </Link>
          <h1 className="truncate text-xl font-bold text-gray-800 dark:text-gray-100">
            {displayName}
          </h1>
          <AvatarStack members={members} size={28} />
        </div>

        {/* Header actions */}
        {shoppingMode ? (
          /* Exit shopping mode button */
          <button
            onClick={() => setShoppingMode(false)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
            {t('shopping.exitMode')}
          </button>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            {/* Convert to Shopping List — only on missing-items lists, owners only */}
            {isOwner && list.is_missing_list && (
              <button
                onClick={() => convertToListMutation.mutate()}
                disabled={convertToListMutation.isPending || items.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              >
                {convertToListMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ListPlus className="h-4 w-4" />
                )}
                {t('missing.convertToList')}
              </button>
            )}

            {/* Share button (owner) or View collaborators (editor/viewer) */}
            {isOwner ? (
              <button
                onClick={() => setShowShareDialog(true)}
                aria-label={t('sharing.shareButton')}
                className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            ) : role ? (
              <button
                onClick={() => setShowCollaboratorsDialog(true)}
                aria-label={t('sharing.viewCollaborators')}
                className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Users className="h-4 w-4" />
              </button>
            ) : null}

            {/* Clone — owner only */}
            {isOwner && (
              <button
                onClick={() => cloneMutation.mutate()}
                disabled={cloneMutation.isPending}
                aria-label={t('lists.clone')}
                className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {cloneMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {t('lists.clone')}
              </button>
            )}

            {/* Archive — owner only */}
            {isOwner && (
              <button
                onClick={() => archiveMutation.mutate(!list.is_archived)}
                disabled={archiveMutation.isPending}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  list.is_archived
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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

            {/* Delete — owner only */}
            {isOwner && !list.is_missing_list && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                aria-label={t('deleteList.button')}
                className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && <ProgressBar done={checkedCount} total={totalCount} />}

      {/* Start Shopping button — active non-archived non-missing lists with items */}
      {!shoppingMode && !list.is_archived && !list.is_missing_list && totalCount > 0 && (
        <button
          onClick={() => setShoppingMode(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <ShoppingCart className="h-5 w-5" />
          {t('shopping.startShopping')}
        </button>
      )}

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
      ) : shoppingMode ? (
        /* ── Shopping mode layout ── */
        <div className="space-y-3">
          {/* Unchecked items */}
          {uncheckedItems.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              lang={lang}
              shoppingMode
              members={members}
              editable={isEditor}
              isToggling={togglingIds.has(item.id)}
              onToggle={() =>
                isEditor &&
                toggleMutation.mutate({
                  itemId: item.id,
                  checked: !item.is_checked,
                  updatedAt: item.updated_at,
                })
              }
              onRemove={() => removeMutation.mutate(item.id)}
            />
          ))}

          {/* In Cart collapsible section */}
          {checkedItems.length > 0 && (
            <div className="pt-1">
              <button
                onClick={() => setShowInCart(s => !s)}
                className="flex items-center gap-1.5 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${showInCart ? 'rotate-180' : ''}`}
                />
                {t('shopping.inCartSection', { count: checkedItems.length })}
              </button>

              {showInCart && (
                <div className="mt-1 space-y-2">
                  {checkedItems.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      lang={lang}
                      shoppingMode
                      editable={isEditor}
                      isToggling={togglingIds.has(item.id)}
                      onToggle={() =>
                        isEditor &&
                        toggleMutation.mutate({
                          itemId: item.id,
                          checked: !item.is_checked,
                          updatedAt: item.updated_at,
                        })
                      }
                      onRemove={() => removeMutation.mutate(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Normal layout ── */
        <div className="space-y-2">
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              lang={lang}
              members={members}
              editable={isEditor}
              isToggling={togglingIds.has(item.id)}
              onToggle={() =>
                isEditor &&
                toggleMutation.mutate({
                  itemId: item.id,
                  checked: !item.is_checked,
                  updatedAt: item.updated_at,
                })
              }
              onRemove={() => removeMutation.mutate(item.id)}
            />
          ))}
        </div>
      )}

      {/* FAB — only for active lists with edit permission */}
      {!list.is_archived && isEditor && (
        <button
          onClick={() => setShowAddSheet(true)}
          aria-label={t('items.add')}
          className={`fixed end-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition hover:bg-brand-600 active:scale-95 ${
            shoppingMode ? 'bottom-32' : 'bottom-20'
          }`}
        >
          <Plus className="h-7 w-7" />
        </button>
      )}

      {/* Done Shopping fixed bar */}
      {shoppingMode && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setShowDoneDialog(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 text-base font-semibold text-white transition hover:bg-green-600"
          >
            <Check className="h-5 w-5" />
            {t('shopping.doneShopping')}
          </button>
        </div>
      )}

      {/* Done Shopping confirmation dialog */}
      {showDoneDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">
              {t('shopping.donePromptTitle')}
            </h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              {t('shopping.donePromptBody')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDoneDialog(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t('shopping.keepShopping')}
              </button>
              <button
                onClick={() => {
                  archiveMutation.mutate(true)
                  setShoppingMode(false)
                  setShowDoneDialog(false)
                }}
                disabled={archiveMutation.isPending}
                className="flex flex-1 items-center justify-center rounded-xl bg-green-500 py-3 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
              >
                {archiveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('shopping.archiveAndDone')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSheet && (
        <AddItemSheet
          listId={id!}
          lang={lang}
          items={items}
          onClose={() => setShowAddSheet(false)}
        />
      )}

      {showShareDialog && (
        <ShareListDialog listId={id!} onClose={() => setShowShareDialog(false)} />
      )}

      {showCollaboratorsDialog && (
        <CollaboratorsDialog
          listId={id!}
          ownerId={list.owner_id}
          currentUserRole={role ?? null}
          onClose={() => setShowCollaboratorsDialog(false)}
        />
      )}

      {showDeleteDialog && (
        <DeleteListDialog
          listId={id!}
          listName={displayName}
          onClose={() => setShowDeleteDialog(false)}
          onDeleted={() => navigate('/lists')}
        />
      )}
    </div>
  )
}
