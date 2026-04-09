import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Trash2, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { filterProducts } from '@/lib/filterProducts'
import type { Product, UnitType } from '@/types'

const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  servings: z.number().int().min(1),
  prep_time_minutes: z.number().int().optional().nullable(),
  tools: z.array(z.string()).default([]),
})

type RecipeFormData = z.infer<typeof recipeSchema>

interface FormIngredient {
  id: string
  product: Product | null
  quantity: number
  unit: UnitType | null
  note: string
  substitute_group_id: number | null
  sort_order: number
  shopping_unit_id: string | null
  shopping_unit: UnitType | null
  shopping_quantity_multiplier: number
}

interface FormStep {
  id: string
  description: string
  step_number: number
}

const TOOLS = ['oven', 'stovetop', 'pot', 'pan', 'bakingTray', 'blender'] as const

function ProductSearchSheet({
  isOpen,
  onClose,
  onSelect,
  products,
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (product: Product) => void
  products: Product[]
}) {
  const { t } = useTranslation('recipes')
  const { t: tCommon } = useTranslation()
  const [search, setSearch] = useState('')

  const filtered = filterProducts(products, search).slice(0, 20)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl max-h-[80vh] flex flex-col dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('ingredients.add')}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <input
          type="search"
          placeholder={tCommon('actions.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 mb-4 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />

        <div className="flex-1 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {search ? tCommon('status.noMatch') : tCommon('status.startTyping')}
            </div>
          ) : (
            filtered.map(product => (
              <button
                key={product.id}
                onClick={() => {
                  onSelect(product)
                  onClose()
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {product.name_he || product.name_en}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function IngredientRow({
  ingredient,
  unitTypes,
  onUpdate,
  onRemove,
  onAddSubstitute,
  groupingIndicator,
}: {
  ingredient: FormIngredient
  unitTypes: UnitType[]
  onUpdate: (updates: Partial<FormIngredient>) => void
  onRemove: () => void
  onAddSubstitute: () => void
  groupingIndicator?: React.ReactNode
}) {
  const { t } = useTranslation('recipes')
  const productUnits = unitTypes.filter(u => u.type === ingredient.product?.default_unit?.type)

  return (
    <div className={groupingIndicator ? 'ps-6' : ''}>
      <div className="flex gap-2 items-start py-2">
        {groupingIndicator && <div className="text-xs text-gray-500 mt-1">{groupingIndicator}</div>}

        <div className="flex-1 min-w-0">
          <button
            onClick={() => {
              /* open product search */
            }}
            className="block text-sm font-medium text-gray-900 truncate hover:underline"
          >
            {ingredient.product?.name_he || ingredient.product?.name_en || '—'}
          </button>
        </div>

        <input
          type="number"
          step="0.1"
          value={ingredient.quantity}
          onChange={e => onUpdate({ quantity: Number(e.target.value) })}
          className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm outline-none focus:border-brand-400"
        />

        {/* Unit select */}
        {productUnits.length > 0 ? (
          <select
            value={ingredient.unit?.id || ''}
            onChange={e => {
              const unit = unitTypes.find(u => u.id === e.target.value) || null
              onUpdate({ unit })
            }}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-brand-400"
          >
            <option value="">—</option>
            {productUnits.map(u => (
              <option key={u.id} value={u.id}>
                {u.label_he}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-gray-500">—</span>
        )}

        <button onClick={onRemove} className="text-red-500 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Note and substitute */}
      <div className="ps-6 pb-2 space-y-2">
        <input
          type="text"
          placeholder={t('ingredients.note')}
          value={ingredient.note}
          onChange={e => onUpdate({ note: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-1 text-xs outline-none focus:border-brand-400"
        />

        {/* Shopping unit section */}
        <div className="text-xs text-gray-600 pt-1">
          <div className="font-medium mb-1">{t('ingredients.shoppingUnit')}</div>
          <div className="flex gap-2">
            {/* Shopping unit select */}
            <select
              value={ingredient.shopping_unit_id || ''}
              onChange={e => {
                const unit = unitTypes.find(u => u.id === e.target.value) || null
                onUpdate({ shopping_unit_id: unit?.id || null, shopping_unit: unit })
              }}
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-brand-400"
            >
              <option value="">{t('ingredients.inherit')}</option>
              {unitTypes.map(u => (
                <option key={u.id} value={u.id}>
                  {u.label_he}
                </option>
              ))}
            </select>

            {/* Multiplier input */}
            {ingredient.shopping_unit_id && (
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={ingredient.shopping_quantity_multiplier || 1}
                onChange={e => onUpdate({ shopping_quantity_multiplier: Number(e.target.value) })}
                title={t('ingredients.conversionHint')}
                className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-brand-400"
                placeholder={t('ingredients.multiplier')}
              />
            )}
          </div>
          {ingredient.shopping_unit_id && (
            <p className="text-xs text-gray-500 mt-1">
              {t('ingredients.conversionExample', {
                qty: ingredient.quantity,
                shopping: (ingredient.quantity * ingredient.shopping_quantity_multiplier).toFixed(
                  2
                ),
              })}
            </p>
          )}
        </div>

        {!groupingIndicator && (
          <button
            onClick={onAddSubstitute}
            className="text-xs text-brand-500 hover:text-brand-600 font-medium"
          >
            + {t('ingredients.substitute')}
          </button>
        )}
      </div>
    </div>
  )
}

export default function RecipeFormPage() {
  const { t } = useTranslation('recipes')
  const { t: tCommon } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id: recipeId } = useParams<{ id: string }>()
  const isEditing = !!recipeId

  // Form state
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    servings: 4,
    prep_time_minutes: null,
    tools: [],
  })

  const [ingredients, setIngredients] = useState<FormIngredient[]>([])
  const [steps, setSteps] = useState<FormStep[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [pendingIngredient, setPendingIngredient] = useState<{
    index: number
    isSubstitute: boolean
  } | null>(null)

  // Queries
  const { data: recipe } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      if (!recipeId) return null
      const { data, error } = await supabase
        .from('recipes')
        .select(
          '*, ingredients:recipe_ingredients(*, product:products(*), unit:unit_types(*), shopping_unit:unit_types(*)), steps:recipe_steps(*)'
        )
        .eq('id', recipeId)
        .single()
      if (error) throw error
      return data
    },
    enabled: isEditing,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products_with_units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, default_unit:unit_types(*)')
        .order('name_he')
      if (error) throw error
      return data
    },
  })

  const { data: unitTypes = [] } = useQuery({
    queryKey: ['unit_types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('unit_types').select('*').order('type')
      if (error) throw error
      return data
    },
  })

  // Initialize form from recipe (if editing)
  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title,
        description: recipe.description || '',
        servings: recipe.servings,
        prep_time_minutes: recipe.prep_time_minutes,
        tools: recipe.tools || [],
      })

      setIngredients(
        recipe.ingredients?.map((ing, idx) => ({
          id: `ing-${idx}`,
          product: ing.product,
          quantity: ing.quantity,
          unit: ing.unit,
          note: ing.note || '',
          substitute_group_id: ing.substitute_group_id,
          sort_order: ing.sort_order,
          shopping_unit_id: ing.shopping_unit_id || null,
          shopping_unit: ing.shopping_unit || null,
          shopping_quantity_multiplier: ing.shopping_quantity_multiplier || 1,
        })) || []
      )

      setSteps(
        recipe.steps?.map((step, idx) => ({
          id: `step-${idx}`,
          description: step.description,
          step_number: step.step_number,
        })) || []
      )
    }
  }, [recipe])

  const handleAddIngredient = (product: Product) => {
    const newIngredient: FormIngredient = {
      id: `ing-${Date.now()}`,
      product,
      quantity: 1,
      unit: product.default_unit || null,
      note: '',
      substitute_group_id: null,
      sort_order: ingredients.length,
      shopping_unit_id: null,
      shopping_unit: null,
      shopping_quantity_multiplier: 1,
    }

    if (pendingIngredient?.isSubstitute && pendingIngredient.index >= 0) {
      // Add as substitute with same group as the ingredient at pendingIngredient.index
      const baseIngredient = ingredients[pendingIngredient.index]
      const groupId = baseIngredient.substitute_group_id ?? pendingIngredient.index
      newIngredient.substitute_group_id = groupId
      baseIngredient.substitute_group_id = groupId // Update base ingredient if needed

      setIngredients([...ingredients, newIngredient])
    } else {
      setIngredients([...ingredients, newIngredient])
    }

    setPendingIngredient(null)
    setShowProductSearch(false)
  }

  const handleAddStep = () => {
    const newStep: FormStep = {
      id: `step-${Date.now()}`,
      description: '',
      step_number: steps.length + 1,
    }
    setSteps([...steps, newStep])
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Validate form
      recipeSchema.parse(formData)

      if (!user) throw new Error('Not authenticated')

      if (isEditing && recipeId) {
        // Update recipe
        await supabase.from('recipes').update(formData).eq('id', recipeId)

        // Delete all existing ingredients and steps
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
        await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId)

        // Re-insert ingredients and steps
        if (ingredients.length > 0) {
          await supabase.from('recipe_ingredients').insert(
            ingredients.map((ing, idx) => ({
              recipe_id: recipeId,
              product_id: ing.product?.id,
              quantity: ing.quantity,
              unit_id: ing.unit?.id || null,
              note: ing.note || null,
              substitute_group_id: ing.substitute_group_id,
              sort_order: idx,
              shopping_unit_id: ing.shopping_unit_id,
              shopping_quantity_multiplier: ing.shopping_quantity_multiplier,
            }))
          )
        }

        if (steps.length > 0) {
          await supabase.from('recipe_steps').insert(
            steps.map((step, idx) => ({
              recipe_id: recipeId,
              step_number: idx + 1,
              description: step.description,
            }))
          )
        }

        queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
        queryClient.invalidateQueries({ queryKey: ['recipes'] })
        toast.success(tCommon('status.saved'))
        navigate(`/recipes/${recipeId}`)
      } else {
        // Create new recipe
        const { data: newRecipe, error: insertError } = await supabase
          .from('recipes')
          .insert([{ ...formData, owner_id: user.id }])
          .select()
          .single()

        if (insertError || !newRecipe) throw insertError || new Error('Failed to create recipe')

        // Insert ingredients and steps
        if (ingredients.length > 0) {
          await supabase.from('recipe_ingredients').insert(
            ingredients.map((ing, idx) => ({
              recipe_id: newRecipe.id,
              product_id: ing.product?.id,
              quantity: ing.quantity,
              unit_id: ing.unit?.id || null,
              note: ing.note || null,
              substitute_group_id: ing.substitute_group_id,
              sort_order: idx,
              shopping_unit_id: ing.shopping_unit_id,
              shopping_quantity_multiplier: ing.shopping_quantity_multiplier,
            }))
          )
        }

        if (steps.length > 0) {
          await supabase.from('recipe_steps').insert(
            steps.map((step, idx) => ({
              recipe_id: newRecipe.id,
              step_number: idx + 1,
              description: step.description,
            }))
          )
        }

        queryClient.invalidateQueries({ queryKey: ['recipes'] })
        toast.success(tCommon('status.saved'))
        navigate(`/recipes/${newRecipe.id}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error(tCommon('status.error'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">{isEditing ? t('edit') : t('new')}</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? t('form.saving') : t('form.save')}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Meta section */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t('form.title')}
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 font-semibold"
          />

          <textarea
            placeholder={t('form.description')}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="1"
              value={formData.servings}
              onChange={e => setFormData({ ...formData, servings: Number(e.target.value) })}
              placeholder={t('form.servings')}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <input
              type="number"
              min="0"
              value={formData.prep_time_minutes || ''}
              onChange={e =>
                setFormData({
                  ...formData,
                  prep_time_minutes: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder={t('form.prepTime')}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* Tools section */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            {t('form.tools')}
          </label>
          <div className="flex flex-wrap gap-2">
            {TOOLS.map(tool => (
              <button
                key={tool}
                onClick={() => {
                  setFormData({
                    ...formData,
                    tools: formData.tools.includes(tool)
                      ? formData.tools.filter(t => t !== tool)
                      : [...formData.tools, tool],
                  })
                }}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  formData.tools.includes(tool)
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(`tools.${tool}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-gray-700">{t('form.ingredients')}</label>
            <button
              onClick={() => {
                setPendingIngredient(null)
                setShowProductSearch(true)
              }}
              className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium"
            >
              <Plus className="h-3 w-3" />
              {t('form.addIngredient')}
            </button>
          </div>

          <div className="space-y-2 border border-gray-200 rounded-lg p-3">
            {ingredients.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">{tCommon('status.empty')}</p>
            ) : (
              ingredients.map((ing, idx) => {
                // Check if this is a substitute (has a group and is not the first in the group)
                const isSubstitute =
                  ing.substitute_group_id !== null &&
                  ingredients.findIndex(i => i.substitute_group_id === ing.substitute_group_id) !==
                    idx

                return (
                  <IngredientRow
                    key={ing.id}
                    ingredient={ing}
                    unitTypes={unitTypes}
                    onUpdate={updates => {
                      const newIngredients = [...ingredients]
                      newIngredients[idx] = { ...ing, ...updates }
                      setIngredients(newIngredients)
                    }}
                    onRemove={() => {
                      setIngredients(ingredients.filter((_, i) => i !== idx))
                    }}
                    onAddSubstitute={() => {
                      setPendingIngredient({ index: idx, isSubstitute: true })
                      setShowProductSearch(true)
                    }}
                    groupingIndicator={
                      isSubstitute ? `↳ ${t('ingredients.substitute')}` : undefined
                    }
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Steps section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-gray-700">{t('form.steps')}</label>
            <button
              onClick={handleAddStep}
              className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium"
            >
              <Plus className="h-3 w-3" />
              {t('form.addStep')}
            </button>
          </div>

          <div className="space-y-2 border border-gray-200 rounded-lg p-3">
            {steps.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">{tCommon('status.empty')}</p>
            ) : (
              steps.map((step, idx) => (
                <div key={step.id} className="flex gap-2">
                  <span className="flex-shrink-0 font-semibold text-sm text-gray-600 mt-2 min-w-[2rem]">
                    {idx + 1}.
                  </span>
                  <textarea
                    value={step.description}
                    onChange={e => {
                      const newSteps = [...steps]
                      newSteps[idx] = { ...step, description: e.target.value }
                      setSteps(newSteps)
                    }}
                    placeholder={t('form.addStep')}
                    rows={2}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                  <button
                    onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 flex-shrink-0 mt-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="h-20" />
      </div>

      {/* Product search sheet */}
      <ProductSearchSheet
        isOpen={showProductSearch}
        onClose={() => setShowProductSearch(false)}
        onSelect={handleAddIngredient}
        products={products}
      />
    </div>
  )
}
