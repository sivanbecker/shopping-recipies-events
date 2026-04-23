import { useState, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Minus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Package,
  Globe,
  Lock,
  X,
  Upload,
  Download,
  ListPlus,
  ShoppingCart,
  Mic,
  MicOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { parseImportFile, skippedRowsToCsv } from '@/lib/importProducts'
import { filterProducts } from '@/lib/filterProducts'
import type { Product, Category, UnitType, ShoppingList } from '@/types'
import type { SkippedRow } from '@/lib/importProducts'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useDebounce } from '@/hooks/useDebounce'
import { ProductDialog } from '@/components/ProductDialog'
import type { ProductFormData } from '@/components/ProductDialog'
import { Skeleton } from '@/components/Skeleton'

// ─── ProductCard ──────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product
  category: Category | null
  lang: 'he' | 'en'
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
  onAddToList: () => void
}

function ProductCard({
  product,
  category,
  lang,
  isOwner,
  onEdit,
  onDelete,
  onAddToList,
}: ProductCardProps) {
  const { t } = useTranslation()
  const name = lang === 'he' ? product.name_he : (product.name_en ?? product.name_he)

  return (
    <div className="relative flex flex-col gap-1.5 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Category color stripe */}
      {category?.color && (
        <div
          className="absolute start-0 top-3 bottom-3 w-1 rounded-e-full"
          style={{ backgroundColor: category.color }}
        />
      )}

      <div className="flex items-start justify-between gap-1 ps-2">
        <p className="flex-1 text-sm font-semibold leading-tight text-gray-800 dark:text-gray-100">
          {name}
        </p>

        <div className="flex shrink-0 gap-0.5">
          <button
            onClick={onAddToList}
            aria-label={t('products.addToList.title')}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-brand-50 hover:text-brand-500"
          >
            <ListPlus className="h-3.5 w-3.5" />
          </button>
          {isOwner && (
            <>
              <button
                onClick={onEdit}
                aria-label={t('products.editProduct')}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onDelete}
                aria-label={t('products.deleteProduct')}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1 ps-2">
        {category && (
          <span
            className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: category.color ?? '#9CA3AF' }}
          >
            {category.icon && <span className="text-[10px]">{category.icon}</span>}
            {lang === 'he' ? category.name_he : category.name_en}
          </span>
        )}
        {product.is_shared ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            <Globe className="h-3 w-3" />
            {t('products.shared')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <Lock className="h-3 w-3" />
            {t('products.personal')}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── ImportSummaryDialog ──────────────────────────────────────────────────────

interface ImportSummary {
  insertedCount: number
  updatedCount: number
  skipped: SkippedRow[]
}

interface ImportSummaryDialogProps {
  summary: ImportSummary
  onClose: () => void
}

function ImportSummaryDialog({ summary, onClose }: ImportSummaryDialogProps) {
  const { t } = useTranslation()

  function downloadSkipped() {
    const csv = skippedRowsToCsv(summary.skipped)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'skipped_rows.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('products.import.title')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3">
            <span className="text-lg">✓</span>
            <span className="text-sm font-medium text-green-700">
              {t('products.import.inserted', { count: summary.insertedCount })}
            </span>
          </div>

          {summary.updatedCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">
              <span className="text-lg">↻</span>
              <span className="text-sm font-medium text-blue-700">
                {t('products.import.updated', { count: summary.updatedCount })}
              </span>
            </div>
          )}

          {summary.skipped.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3">
              <span className="text-lg">⚠</span>
              <span className="text-sm font-medium text-amber-700">
                {t('products.import.skipped', { count: summary.skipped.length })}
              </span>
            </div>
          )}
        </div>

        {summary.skipped.length > 0 && (
          <div className="mt-3 max-h-32 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            {summary.skipped.map(s => (
              <p key={s.rowIndex} className="text-xs text-gray-500 dark:text-gray-400">
                #{s.rowIndex} — {t(`products.import.reasons.${s.reason}`, s.raw.name_he ?? '')}
              </p>
            ))}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          {summary.skipped.length > 0 && (
            <button
              onClick={downloadSkipped}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Download className="h-4 w-4" />
              {t('products.import.downloadSkipped')}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            {t('actions.done')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ConfirmDeleteDialog ──────────────────────────────────────────────────────

interface ConfirmDeleteDialogProps {
  product: Product
  lang: 'he' | 'en'
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmDeleteDialog({
  product,
  lang,
  isDeleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation()
  const name = lang === 'he' ? product.name_he : (product.name_en ?? product.name_he)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={e => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-gray-900">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">{name}</h3>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          {t('products.confirmDelete')}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {t('actions.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('actions.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AddToListSheet ───────────────────────────────────────────────────────────

interface AddToListSheetProps {
  product: Product
  unitTypes: UnitType[]
  lang: 'he' | 'en'
  onClose: () => void
}

function AddToListSheet({ product, unitTypes, lang, onClose }: AddToListSheetProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const defaultUnit = unitTypes.find(u => u.id === product.default_unit_id)
  const unitCategory = defaultUnit?.type ?? 'count'
  const isCount = unitCategory === 'count'
  const relevantUnits = unitTypes.filter(u => u.type === unitCategory)

  const [quantity, setQuantity] = useState(1)
  const [unitId, setUnitId] = useState<string | null>(product.default_unit_id ?? null)

  const { data: activeLists = [], isLoading: listsLoading } = useQuery<ShoppingList[]>({
    queryKey: ['shopping_lists', 'active', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('owner_id', user!.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ShoppingList[]
    },
    enabled: !!user,
  })

  const addToListMutation = useMutation({
    mutationFn: async ({ listId, listName }: { listId: string; listName: string }) => {
      const { data: existing } = await supabase
        .from('shopping_items')
        .select('id, quantity')
        .eq('list_id', listId)
        .eq('product_id', product.id)
        .eq('is_checked', false)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('shopping_items')
          .update({ quantity: Number(existing.quantity) + quantity, unit_id: unitId })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('shopping_items').insert({
          list_id: listId,
          product_id: product.id,
          quantity,
          unit_id: unitId,
          added_by: user!.id,
        })
        if (error) throw error
      }
      return listName
    },
    onSuccess: (listName, { listId }) => {
      qc.invalidateQueries({ queryKey: ['shopping_items', listId] })
      qc.invalidateQueries({ queryKey: ['shopping_lists'] })
      toast.success(t('products.addToList.addedTo', { name: listName }), {
        action: {
          label: t('products.addToList.view'),
          onClick: () => navigate(`/lists/${listId}`),
        },
      })
      onClose()
    },
    onError: () => toast.error(t('status.error')),
  })

  const createAndAddMutation = useMutation({
    mutationFn: async () => {
      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .insert({ owner_id: user!.id })
        .select()
        .single()
      if (listError) throw listError

      const { error: itemError } = await supabase.from('shopping_items').insert({
        list_id: list.id,
        product_id: product.id,
        quantity,
        unit_id: unitId,
        added_by: user!.id,
      })
      if (itemError) throw itemError
      return list as ShoppingList
    },
    onSuccess: list => {
      qc.invalidateQueries({ queryKey: ['shopping_lists'] })
      const listName =
        list.name ?? format(new Date(list.created_at), lang === 'he' ? 'dd/MM/yyyy' : 'MMM d, yyyy')
      toast.success(t('products.addToList.addedTo', { name: listName }), {
        action: {
          label: t('products.addToList.view'),
          onClick: () => navigate(`/lists/${list.id}`),
        },
      })
      onClose()
    },
    onError: () => toast.error(t('status.error')),
  })

  const isPending = addToListMutation.isPending || createAndAddMutation.isPending
  const productName = lang === 'he' ? product.name_he : (product.name_en ?? product.name_he)

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
            <span className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {productName}
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('products.addToList.quantity')}
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
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('products.addToList.unit')}
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
                  {t('products.addToList.noUnit')}
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

          {/* Lists */}
          <p className="mb-2 text-xs font-medium text-gray-500">
            {t('products.addToList.selectList')}
          </p>

          {listsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
            </div>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {activeLists.map(list => {
                const listName =
                  list.name ??
                  format(new Date(list.created_at), lang === 'he' ? 'dd/MM/yyyy' : 'MMM d, yyyy')
                return (
                  <button
                    key={list.id}
                    onClick={() => addToListMutation.mutate({ listId: list.id, listName })}
                    disabled={isPending}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-gray-800 transition hover:bg-brand-50 disabled:opacity-60 dark:text-gray-100 dark:hover:bg-brand-900/20"
                  >
                    <ShoppingCart className="h-4 w-4 shrink-0 text-brand-400" />
                    <span className="flex-1 truncate">{listName}</span>
                  </button>
                )
              })}

              {activeLists.length === 0 && (
                <p className="py-3 text-center text-sm text-gray-400 dark:text-gray-500">
                  {t('products.addToList.noActiveLists')}
                </p>
              )}

              {/* New list option */}
              <button
                onClick={() => createAndAddMutation.mutate()}
                disabled={isPending}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-brand-600 transition hover:bg-brand-50 disabled:opacity-60"
              >
                {createAndAddMutation.isPending ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 shrink-0" />
                )}
                {t('products.addToList.newList')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ProductsPage ─────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const qc = useQueryClient()
  const lang = i18n.language as 'he' | 'en'

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const voice = useVoiceInput({ onResult: text => setSearch(text), interimResults: true })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [addToListTarget, setAddToListTarget] = useState<Product | null>(null)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order')
      if (error) throw error
      return data as Category[]
    },
    staleTime: Infinity,
  })

  const { data: unitTypes = [] } = useQuery({
    queryKey: ['unit_types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('unit_types').select('*')
      if (error) throw error
      return data as UnitType[]
    },
    staleTime: Infinity,
  })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`is_shared.eq.true,created_by.eq.${user!.id}`)
        .order('name_he')
      if (error) throw error
      return data as Product[]
    },
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: async (values: ProductFormData) => {
      const { error } = await supabase.from('products').insert({
        name_he: values.name_he,
        name_en: values.name_en || null,
        category_id: values.category_id || null,
        default_unit_id: values.default_unit_id || null,
        created_by: user!.id,
        is_shared: false,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('products.addSuccess'))
      setDialogMode(null)
    },
    onError: () => toast.error(t('status.error')),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ProductFormData }) => {
      const { error } = await supabase
        .from('products')
        .update({
          name_he: values.name_he,
          name_en: values.name_en || null,
          category_id: values.category_id || null,
          default_unit_id: values.default_unit_id || null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('products.editSuccess'))
      setDialogMode(null)
      setEditProduct(null)
    },
    onError: () => toast.error(t('status.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('products.deleteSuccess'))
      setDeleteTarget(null)
    },
    onError: () => toast.error(t('status.error')),
  })

  // ── Filter + group ─────────────────────────────────────────────────────────

  const { grouped, uncategorized, filteredCount } = useMemo(() => {
    const filtered = filterProducts(products, debouncedSearch).filter(p =>
      selectedCategory ? p.category_id === selectedCategory : true
    )
    const categorySet = new Set(filtered.map(p => p.category_id))
    const grouped = categories
      .filter(c => categorySet.has(c.id))
      .map(c => ({
        category: c,
        products: filtered.filter(p => p.category_id === c.id),
      }))
    const uncategorized = filtered.filter(p => !p.category_id)
    return { grouped, uncategorized, filteredCount: filtered.length }
  }, [products, debouncedSearch, selectedCategory, categories])

  // ── Import mutation ────────────────────────────────────────────────────────

  const importMutation = useMutation({
    mutationFn: async (result: Awaited<ReturnType<typeof parseImportFile>>) => {
      if (result.toInsert.length > 0) {
        const { error } = await supabase
          .from('products')
          .insert(result.toInsert.map(r => ({ ...r, created_by: user!.id, is_shared: false })))
        if (error) throw error
      }
      for (const r of result.toUpdate) {
        const { error } = await supabase
          .from('products')
          .update({
            name_en: r.name_en,
            category_id: r.category_id,
            default_unit_id: r.default_unit_id,
          })
          .eq('id', r.id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => toast.error(t('status.error')),
  })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv' && ext !== 'json') {
      toast.error(t('products.import.unsupportedFormat'))
      return
    }

    const text = await file.text()
    let result
    try {
      result = parseImportFile(
        text,
        ext as 'csv' | 'json',
        categories,
        unitTypes,
        products,
        user!.id
      )
    } catch {
      toast.error(t('products.import.errorParsing'))
      return
    }

    if (result.toInsert.length > 0 || result.toUpdate.length > 0) {
      await importMutation.mutateAsync(result)
    }

    setImportSummary({
      insertedCount: result.toInsert.length,
      updatedCount: result.toUpdate.length,
      skipped: result.skipped,
    })
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openAdd() {
    setEditProduct(null)
    setDialogMode('add')
  }

  function openEdit(product: Product) {
    setEditProduct(product)
    setDialogMode('edit')
  }

  function handleFormSubmit(values: ProductFormData) {
    if (dialogMode === 'add') {
      addMutation.mutate(values)
    } else if (editProduct) {
      updateMutation.mutate({ id: editProduct.id, values })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col pb-24">
      {/* Sticky search + filters */}
      <div className="sticky top-0 z-10 bg-gray-50 px-4 pb-3 pt-4 shadow-sm dark:bg-gray-950">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('products.search')}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-9 pe-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={() => (voice.status === 'listening' ? voice.stop() : voice.start(lang))}
              aria-label={voice.status === 'listening' ? t('voice.stop') : t('voice.start')}
              className={`absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition ${
                voice.status === 'listening'
                  ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700'
              }`}
            >
              {voice.status === 'listening' ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            aria-label={t('products.import.button')}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {importMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{t('products.import.button')}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Category filter chips */}
        <div className="mt-3 flex flex-wrap gap-2 max-h-[88px] overflow-y-auto sm:max-h-none sm:overflow-visible">
          {selectedCategory !== null && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1 rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition-all hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id === selectedCategory ? null : c.id)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedCategory === c.id
                  ? 'text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              style={selectedCategory === c.id && c.color ? { backgroundColor: c.color } : {}}
            >
              {c.icon && <span>{c.icon}</span>}
              {lang === 'he' ? c.name_he : c.name_en}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pt-5">
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, gi) => (
              <div key={gi}>
                <Skeleton className="mb-3 h-5 w-32" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                      <Skeleton className="mb-2 h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-7 w-7 text-gray-400" />
            </div>
            <p className="font-medium text-gray-700">{t('products.noProducts')}</p>
            <p className="mt-1 text-sm text-gray-400">{t('products.noProductsHint')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ category, products: groupProducts }) => (
              <section key={category.id}>
                <div className="mb-2 flex items-center gap-2">
                  {category.icon && <span className="text-lg">{category.icon}</span>}
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: category.color ?? undefined }}
                  >
                    {lang === 'he' ? category.name_he : category.name_en}
                  </h3>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    {groupProducts.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {groupProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      category={category}
                      lang={lang}
                      isOwner={product.created_by === user?.id}
                      onEdit={() => openEdit(product)}
                      onDelete={() => setDeleteTarget(product)}
                      onAddToList={() => setAddToListTarget(product)}
                    />
                  ))}
                </div>
              </section>
            ))}

            {uncategorized.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {t('products.uncategorized')}
                  </h3>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
                    {uncategorized.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {uncategorized.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      category={null}
                      lang={lang}
                      isOwner={product.created_by === user?.id}
                      onEdit={() => openEdit(product)}
                      onDelete={() => setDeleteTarget(product)}
                      onAddToList={() => setAddToListTarget(product)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        aria-label={t('products.addProduct')}
        className="fixed bottom-20 end-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 shadow-lg transition hover:bg-brand-600 active:scale-95"
      >
        <Plus className="h-6 w-6 text-white" />
      </button>

      {/* Add/Edit dialog */}
      {dialogMode && (
        <ProductDialog
          mode={dialogMode}
          product={editProduct}
          categories={categories}
          unitTypes={unitTypes}
          lang={lang}
          isSubmitting={addMutation.isPending || updateMutation.isPending}
          onClose={() => {
            setDialogMode(null)
            setEditProduct(null)
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDeleteDialog
          product={deleteTarget}
          lang={lang}
          isDeleting={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      )}

      {/* Import summary */}
      {importSummary && (
        <ImportSummaryDialog summary={importSummary} onClose={() => setImportSummary(null)} />
      )}

      {/* Add to list sheet */}
      {addToListTarget && (
        <AddToListSheet
          product={addToListTarget}
          unitTypes={unitTypes}
          lang={lang}
          onClose={() => setAddToListTarget(null)}
        />
      )}
    </div>
  )
}
