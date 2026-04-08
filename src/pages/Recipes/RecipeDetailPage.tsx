import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Flame,
  ChefHat,
  Circle,
  Square,
  Zap,
  Plus,
  X,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { broadcastChange } from '@/lib/supabase'
import type { Recipe, Product, UnitType } from '@/types'

interface RecipeIngredientWithProduct {
  id: string
  product: Product | null
  quantity: number
  unit: UnitType | null
  note: string | null
  substitute_group_id: number | null
  sort_order: number
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  oven: <Flame className="h-4 w-4 text-orange-500" />,
  stovetop: <Flame className="h-4 w-4 text-red-500" />,
  pot: <ChefHat className="h-4 w-4 text-blue-500" />,
  pan: <Circle className="h-4 w-4 text-green-500" />,
  bakingTray: <Square className="h-4 w-4 text-purple-500" />,
  blender: <Zap className="h-4 w-4 text-yellow-500" />,
}

function ConfirmDeleteDialog({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation('recipes')
  const { t: tCommon } = useTranslation()

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{t('confirmDelete')}</h3>
        <p className="mt-2 text-sm text-gray-600">{t('confirmDeleteHint')}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {tCommon('actions.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddToListSheet({
  isOpen,
  onClose,
  recipe,
  ingredients,
}: {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe
  ingredients: RecipeIngredientWithProduct[]
}) {
  const { t } = useTranslation('recipes')
  const { t: tCommon } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<'select' | 'confirm'>('select')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newListName, setNewListName] = useState('')

  const { data: activeLists = [] } = useQuery({
    queryKey: ['shopping_lists', 'active', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*, shopping_items(id)')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: isOpen && !!user,
  })

  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert([
          { name: name || new Date().toLocaleDateString(), owner_id: user!.id, is_active: true },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: newList => {
      setSelectedListId(newList.id)
      setStep('confirm')
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
    },
  })

  const addItemsMutation = useMutation({
    mutationFn: async (listId: string) => {
      const itemsToInsert = ingredients
        .filter(ing => ing.product?.id)
        .map(ing => ({
          list_id: listId,
          product_id: ing.product.id,
          quantity: ing.quantity,
          unit_id: ing.unit?.id || null,
          added_by: user!.id,
          recipe_id: recipe.id,
          note: t('addToShoppingList.forRecipe', { name: recipe.title }),
        }))

      for (const item of itemsToInsert) {
        const { data: existingItems } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('list_id', listId)
          .eq('product_id', item.product_id)
          .eq('is_checked', false)
          .limit(1)

        if (existingItems && existingItems.length > 0) {
          await supabase
            .from('shopping_items')
            .update({ quantity: Number(existingItems[0].quantity) + item.quantity })
            .eq('id', existingItems[0].id)
        } else {
          await supabase.from('shopping_items').insert([item])
        }
      }

      broadcastChange(listId, 'items-changed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_items'] })
      toast.success(t('addToShoppingList.added'))
      if (selectedListId) {
        setTimeout(() => {
          window.location.href = `/lists/${selectedListId}`
        }, 100)
      }
      onClose()
    },
    onError: () => {
      toast.error(tCommon('status.error'))
    },
  })

  if (!isOpen) return null

  const targetList = activeLists.find(l => l.id === selectedListId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl max-h-[80vh] flex flex-col">
        {step === 'select' ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t('addToShoppingList.title')}</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {activeLists.map(list => (
                <button
                  key={list.id}
                  onClick={() => {
                    setSelectedListId(list.id)
                    setStep('confirm')
                  }}
                  className="w-full text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {list.name || tCommon('status.untitled')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {list.shopping_items?.length || 0} {tCommon('items.items')}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              ))}

              <div className="border-t border-gray-200 pt-2">
                <button
                  onClick={() => setIsCreating(!isCreating)}
                  className="w-full flex items-center gap-2 text-brand-500 hover:text-brand-600 font-medium text-sm py-2"
                >
                  <Plus className="h-4 w-4" />
                  {t('addToShoppingList.createNew')}
                </button>

                {isCreating && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder={tCommon('actions.name')}
                      value={newListName}
                      onChange={e => setNewListName(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                    />
                    <button
                      onClick={() => {
                        createListMutation.mutate(newListName)
                        setNewListName('')
                      }}
                      disabled={createListMutation.isPending}
                      className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      {createListMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        tCommon('actions.create')
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {t('addToShoppingList.added')} to {targetList?.name}
              </h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {ingredients
                .filter(ing => ing.product?.id)
                .map((ing, idx) => (
                  <div key={idx} className="text-sm text-gray-700 py-1 px-2 rounded-lg bg-gray-50">
                    {ing.product.name_he || ing.product.name_en} — {ing.quantity}{' '}
                    {ing.unit?.label_he || ''}
                  </div>
                ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-100"
              >
                {tCommon('actions.back')}
              </button>
              <button
                onClick={() => addItemsMutation.mutate(selectedListId!)}
                disabled={addItemsMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {addItemsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {tCommon('actions.add')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function RecipeDetailPage() {
  const { t } = useTranslation('recipes')
  const { t: tCommon } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id: recipeId } = useParams<{ id: string }>()

  const [servings, setServings] = useState(4)
  const [showAddToList, setShowAddToList] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          '*, ingredients:recipe_ingredients(*, product:products(*, default_unit:unit_types(*)), unit:unit_types(*)), steps:recipe_steps(*)'
        )
        .eq('id', recipeId)
        .single()

      if (error) throw error
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('recipes').delete().eq('id', recipeId!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      toast.success(tCommon('status.deleted'))
      navigate('/recipes')
    },
    onError: () => {
      toast.error(tCommon('status.error'))
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500">{tCommon('status.notFound')}</p>
      </div>
    )
  }

  // Initialize servings from recipe on first load
  if (servings === 4 && recipe.servings !== 4) {
    setServings(recipe.servings)
  }

  const isOwner = recipe.owner_id === user?.id
  const scalingFactor = servings / recipe.servings
  const ingredients = recipe.ingredients || []
  const steps = recipe.steps || []

  // Group ingredients by substitute_group_id
  const groupedIngredients = ingredients.reduce(
    (acc: Array<{ primary: typeof ingredients[0]; substitutes: typeof ingredients }>, ing, idx) => {
      if (
        !ing.substitute_group_id ||
        ingredients.findIndex((i: typeof ing) => i.substitute_group_id === ing.substitute_group_id) === idx
      ) {
        acc.push({ primary: ing, substitutes: [] })
      } else {
        const group = acc.find((g: typeof acc[0]) => g.primary.substitute_group_id === ing.substitute_group_id)
        if (group) {
          group.substitutes.push(ing)
        }
      }
      return acc
    },
    []
  )

  return (
    <div className="flex flex-col pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-start justify-between z-10">
        <button
          onClick={() => navigate('/recipes')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/recipes/${recipeId}/edit`)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
              title={t('edit')}
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
              title={t('delete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
          {recipe.description && <p className="mt-2 text-sm text-gray-600">{recipe.description}</p>}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 items-center py-3 border-y border-gray-200">
          {/* Servings spinner */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600"
            >
              −
            </button>
            <div className="text-center">
              <div className="text-xs text-gray-500">{t('servings')}</div>
              <div className="text-lg font-semibold text-gray-900">{servings}</div>
            </div>
            <button
              onClick={() => setServings(servings + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600"
            >
              +
            </button>
          </div>

          {/* Prep time */}
          {recipe.prep_time_minutes && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{recipe.prep_time_minutes}</span>
              <span>{t('minutes')}</span>
            </div>
          )}

          {/* Shared badge */}
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              recipe.is_shared ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {recipe.is_shared ? t('shared') : t('personal')}
          </span>
        </div>

        {/* Tools row */}
        {recipe.tools && recipe.tools.length > 0 && (
          <div className="flex gap-3">
            {recipe.tools.map(tool => (
              <div
                key={tool}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700"
                title={t(`tools.${tool}`)}
              >
                {TOOL_ICONS[tool]}
                <span className="text-xs font-medium">{t(`tools.${tool}`)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{t('ingredients.title')}</h2>
            <div className="space-y-3 border border-gray-200 rounded-lg p-4">
              {groupedIngredients.map((group, groupIdx) => (
                <div key={groupIdx}>
                  {/* Primary ingredient */}
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400 text-sm mt-1">•</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {group.primary.product?.name_he || group.primary.product?.name_en || '—'}
                      </div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        {(group.primary.quantity * scalingFactor).toFixed(2)}{' '}
                        {group.primary.unit?.label_he || ''}
                      </div>
                      {group.primary.note && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          {group.primary.note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Substitutes */}
                  {group.substitutes.length > 0 &&
                    group.substitutes.map((substitute, subIdx) => (
                      <div key={subIdx} className="flex items-start gap-3 ml-4 mt-2 opacity-75">
                        <span className="text-gray-400 text-xs">↳</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700 flex items-center gap-1">
                            <span className="inline-flex items-center gap-0.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {t('substituteGroup', { n: group.primary.substitute_group_id })}
                            </span>
                            {substitute.product?.name_he || substitute.product?.name_en || '—'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {(substitute.quantity * scalingFactor).toFixed(2)}{' '}
                            {substitute.unit?.label_he || ''}
                          </div>
                          {substitute.note && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              {substitute.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>

            {/* Add to shopping list button */}
            <button
              onClick={() => setShowAddToList(true)}
              className="mt-3 w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              {t('ingredients.addAllToList')}
            </button>
          </div>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{t('steps.title')}</h2>
            <div className="space-y-3">
              {steps
                .sort((a, b) => a.step_number - b.step_number)
                .map(step => (
                  <div key={step.id} className="flex gap-3">
                    <span className="flex-shrink-0 font-semibold text-gray-900 text-sm min-w-[2rem]">
                      {step.step_number}.
                    </span>
                    <p className="text-sm text-gray-700">{step.description}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Add to list sheet */}
      <AddToListSheet
        isOpen={showAddToList}
        onClose={() => setShowAddToList(false)}
        recipe={recipe}
        ingredients={ingredients}
      />

      {/* Delete confirmation */}
      <ConfirmDeleteDialog
        isOpen={confirmDelete}
        onConfirm={() => {
          deleteMutation.mutate()
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
