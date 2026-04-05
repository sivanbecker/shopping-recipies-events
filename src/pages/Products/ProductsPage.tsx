import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Pencil, Trash2, Loader2, Package, Globe, Lock, X, Upload, Download } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { parseImportFile, skippedRowsToCsv } from '@/lib/importProducts'
import type { Product, Category, UnitType } from '@/types'
import type { SkippedRow } from '@/lib/importProducts'

// ─── Exported utility (also used in tests) ────────────────────────────────────

export function filterProducts(products: Product[], query: string): Product[] {
  if (!query.trim()) return products
  const q = query.toLowerCase()
  return products.filter(
    p => p.name_he.toLowerCase().includes(q) || (p.name_en?.toLowerCase().includes(q) ?? false)
  )
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const productSchema = z.object({
  name_he: z.string().min(1),
  name_en: z.string().optional(),
  category_id: z.string().optional(),
  default_unit_id: z.string().optional(),
})
type ProductFormData = z.infer<typeof productSchema>

// ─── ProductCard ──────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product
  category: Category | null
  lang: 'he' | 'en'
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
}

function ProductCard({ product, category, lang, isOwner, onEdit, onDelete }: ProductCardProps) {
  const { t } = useTranslation()
  const name = lang === 'he' ? product.name_he : (product.name_en ?? product.name_he)

  return (
    <div className="relative flex flex-col gap-1.5 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      {/* Category color stripe */}
      {category?.color && (
        <div
          className="absolute start-0 top-3 bottom-3 w-1 rounded-e-full"
          style={{ backgroundColor: category.color }}
        />
      )}

      <div className="flex items-start justify-between gap-1 ps-2">
        <p className="flex-1 text-sm font-semibold leading-tight text-gray-800">{name}</p>

        {isOwner && (
          <div className="flex shrink-0 gap-0.5">
            <button
              onClick={onEdit}
              aria-label={t('products.editProduct')}
              className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
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
          </div>
        )}
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
          <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            <Lock className="h-3 w-3" />
            {t('products.personal')}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── ProductDialog ────────────────────────────────────────────────────────────

interface ProductDialogProps {
  mode: 'add' | 'edit'
  product: Product | null
  categories: Category[]
  unitTypes: UnitType[]
  lang: 'he' | 'en'
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: ProductFormData) => void
}

function ProductDialog({
  mode,
  product,
  categories,
  unitTypes,
  lang,
  isSubmitting,
  onClose,
  onSubmit,
}: ProductDialogProps) {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name_he: product?.name_he ?? '',
      name_en: product?.name_en ?? '',
      category_id: product?.category_id ?? '',
      default_unit_id: product?.default_unit_id ?? '',
    },
  })

  const unitGroups = (['count', 'weight', 'volume', 'cooking'] as const).map(type => ({
    type,
    label: t(`products.unitGroups.${type}`),
    units: unitTypes.filter(u => u.type === type),
  }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === 'add' ? t('products.addProduct') : t('products.editProduct')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Hebrew name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('products.nameHe')}
            </label>
            <input
              {...register('name_he')}
              type="text"
              placeholder={t('products.namePlaceholder')}
              dir="rtl"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            {errors.name_he && (
              <p className="mt-1 text-xs text-red-500">{t('validation.required')}</p>
            )}
          </div>

          {/* English name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('products.nameEn')}
            </label>
            <input
              {...register('name_en')}
              type="text"
              placeholder={t('products.nameEnPlaceholder')}
              dir="ltr"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('products.category')}
            </label>
            <select
              {...register('category_id')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">{t('products.noCategory')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon ? `${c.icon} ` : ''}
                  {lang === 'he' ? c.name_he : c.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Default unit */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('products.defaultUnit')}
            </label>
            <select
              {...register('default_unit_id')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">{t('products.noUnit')}</option>
              {unitGroups.map(group =>
                group.units.length > 0 ? (
                  <optgroup key={group.type} label={group.label}>
                    {group.units.map(u => (
                      <option key={u.id} value={u.id}>
                        {lang === 'he' ? u.label_he : u.label_en}
                      </option>
                    ))}
                  </optgroup>
                ) : null
              )}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('actions.save')}
            </button>
          </div>
        </form>
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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{t('products.import.title')}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
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
          <div className="mt-3 max-h-32 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3">
            {summary.skipped.map(s => (
              <p key={s.rowIndex} className="text-xs text-gray-500">
                #{s.rowIndex} — {t(`products.import.reasons.${s.reason}`, s.raw.name_he ?? '')}
              </p>
            ))}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          {summary.skipped.length > 0 && (
            <button
              onClick={downloadSkipped}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-gray-900">{name}</h3>
        <p className="mb-5 text-sm text-gray-500">{t('products.confirmDelete')}</p>
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

// ─── ProductsPage ─────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const qc = useQueryClient()
  const lang = i18n.language as 'he' | 'en'

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
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
      const { data, error } = await supabase.from('products').select('*').order('name_he')
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

  const filtered = filterProducts(products, search).filter(p =>
    selectedCategory ? p.category_id === selectedCategory : true
  )

  const grouped = categories
    .filter(c => filtered.some(p => p.category_id === c.id))
    .map(c => ({
      category: c,
      products: filtered.filter(p => p.category_id === c.id),
    }))

  const uncategorized = filtered.filter(p => !p.category_id)

  // ── Import mutation ────────────────────────────────────────────────────────

  const importMutation = useMutation({
    mutationFn: async (result: Awaited<ReturnType<typeof parseImportFile>>) => {
      if (result.toInsert.length > 0) {
        const { error } = await supabase.from('products').insert(
          result.toInsert.map(r => ({ ...r, created_by: user!.id, is_shared: false }))
        )
        if (error) throw error
      }
      for (const r of result.toUpdate) {
        const { error } = await supabase
          .from('products')
          .update({ name_en: r.name_en, category_id: r.category_id, default_unit_id: r.default_unit_id })
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
      result = parseImportFile(text, ext as 'csv' | 'json', categories, unitTypes, products, user!.id)
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
      <div className="sticky top-0 z-10 bg-gray-50 px-4 pb-3 pt-4 shadow-sm">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('products.search')}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-9 pe-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            aria-label={t('products.import.button')}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
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
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              selectedCategory === null
                ? 'bg-brand-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('products.allCategories')}
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id === selectedCategory ? null : c.id)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedCategory === c.id
                  ? 'text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
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
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
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
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
                    {groupProducts.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {groupProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      category={category}
                      lang={lang}
                      isOwner={product.created_by === user?.id}
                      onEdit={() => openEdit(product)}
                      onDelete={() => setDeleteTarget(product)}
                    />
                  ))}
                </div>
              </section>
            ))}

            {uncategorized.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-500">
                    {t('products.uncategorized')}
                  </h3>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
                    {uncategorized.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {uncategorized.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      category={null}
                      lang={lang}
                      isOwner={product.created_by === user?.id}
                      onEdit={() => openEdit(product)}
                      onDelete={() => setDeleteTarget(product)}
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
        <ImportSummaryDialog
          summary={importSummary}
          onClose={() => setImportSummary(null)}
        />
      )}
    </div>
  )
}
