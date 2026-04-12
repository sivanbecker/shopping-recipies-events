import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, UtensilsCrossed, ShoppingBasket, Cake } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { scaleQty } from '@/lib/eventHelpers'
import type { EventRecipe, Recipe } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  eventId: string
  eventTitle: string
  isOwner: boolean
  totalPeople: number
}

type EventRecipeWithTitle = EventRecipe & { recipe_title: string; recipe_servings: number }

// ─── Add Recipe Sheet ─────────────────────────────────────────────────────────

interface AddSheetProps {
  eventId: string
  totalPeople: number
  attachedIds: Set<string>
  onClose: () => void
}

function AddRecipeSheet({ eventId, totalPeople, attachedIds, onClose }: AddSheetProps) {
  const { t } = useTranslation('events')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [servings, setServings] = useState(totalPeople || 4)
  const [isDessert, setIsDessert] = useState(false)

  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ['recipes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const filtered = recipes.filter(r => {
    if (attachedIds.has(r.id)) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return r.title.toLowerCase().includes(q)
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) return
      const { error } = await supabase.from('event_recipes').insert({
        event_id: eventId,
        recipe_id: selectedId,
        servings_override: servings,
        is_dessert: isDessert,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-recipes', eventId] })
      onClose()
    },
    onError: () => toast.error(t('recipes.addError')),
  })

  const selectedRecipe = recipes.find(r => r.id === selectedId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-white pb-8 shadow-xl dark:bg-gray-900">
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        <div className="space-y-3 px-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('recipes.attachRecipe')}
          </h3>

          {!selectedRecipe ? (
            <>
              {/* Search */}
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('recipes.searchPlaceholder')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                autoFocus
              />
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                    {t('recipes.noResults')}
                  </p>
                ) : (
                  filtered.map(recipe => (
                    <button
                      key={recipe.id}
                      onClick={() => {
                        setSelectedId(recipe.id)
                        setServings(recipe.servings ?? totalPeople ?? 4)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <UtensilsCrossed className="h-4 w-4 shrink-0 text-purple-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {recipe.title}
                        </p>
                        {recipe.servings && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('recipes.defaultServings', { count: recipe.servings })}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Confirm step */}
              <div className="rounded-xl bg-purple-50 px-3 py-2 dark:bg-purple-900/20">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                  {selectedRecipe.title}
                </p>
                <button
                  onClick={() => setSelectedId(null)}
                  className="mt-0.5 text-xs text-purple-500 hover:underline dark:text-purple-400"
                >
                  {t('recipes.changeRecipe')}
                </button>
              </div>

              {/* Servings */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t('recipes.servings')}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setServings(s => Math.max(1, s - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {servings}
                  </span>
                  <button
                    onClick={() => setServings(s => s + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dessert toggle */}
              <button
                onClick={() => setIsDessert(v => !v)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  isDessert
                    ? 'border-pink-400 bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400'
                    : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                <Cake className="h-4 w-4" />
                {t('recipes.markDessert')}
              </button>

              <button
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('recipes.attach')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Generate Shopping List ───────────────────────────────────────────────────

async function generateShoppingList(
  eventId: string,
  eventTitle: string,
  eventRecipes: EventRecipeWithTitle[],
  userId: string,
  listNameTemplate: string
): Promise<string> {
  // 1. Create shopping list
  const { data: list, error: listErr } = await supabase
    .from('shopping_lists')
    .insert({ name: listNameTemplate, owner_id: userId })
    .select()
    .single()
  if (listErr || !list) throw listErr

  // 2. For each event recipe, fetch ingredients and scale
  const allItems: {
    product_id: string
    quantity: number
    unit_id: string | null
    recipe_id: string
  }[] = []

  for (const er of eventRecipes) {
    const { data: ingredients } = await supabase
      .from('recipe_ingredients')
      .select('product_id, quantity, unit_id, substitute_group_id')
      .eq('recipe_id', er.recipe_id)

    if (!ingredients) continue

    for (const ing of ingredients) {
      if (ing.substitute_group_id !== null) continue // skip substitutes
      allItems.push({
        product_id: ing.product_id,
        quantity: scaleQty(
          ing.quantity,
          er.recipe_servings,
          er.servings_override ?? er.recipe_servings
        ),
        unit_id: ing.unit_id,
        recipe_id: er.recipe_id,
      })
    }
  }

  // 3. Merge same product+unit combinations
  const merged = new Map<
    string,
    { product_id: string; quantity: number; unit_id: string | null; recipe_id: string }
  >()
  for (const item of allItems) {
    const key = `${item.product_id}::${item.unit_id ?? 'none'}`
    const existing = merged.get(key)
    if (existing) {
      existing.quantity = Math.round((existing.quantity + item.quantity) * 100) / 100
    } else {
      merged.set(key, { ...item })
    }
  }

  // 4. Insert shopping items
  if (merged.size > 0) {
    const rows = Array.from(merged.values()).map((item, idx) => ({
      list_id: list.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_id: item.unit_id,
      is_checked: false,
      added_by: userId,
      recipe_id: item.recipe_id,
      sort_order: idx,
    }))
    const { error: itemsErr } = await supabase.from('shopping_items').insert(rows)
    if (itemsErr) throw itemsErr
  }

  // 5. Link list to event
  await supabase.from('event_shopping_lists').insert({ event_id: eventId, list_id: list.id })

  return list.id
}

// ─── RecipesTab ───────────────────────────────────────────────────────────────

export default function RecipesTab({ eventId, eventTitle, isOwner, totalPeople }: Props) {
  const { t } = useTranslation('events')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [generatingList, setGeneratingList] = useState(false)

  const { data: eventRecipes = [], isLoading } = useQuery<EventRecipeWithTitle[]>({
    queryKey: ['event-recipes', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_recipes')
        .select('*, recipes(title, servings)')
        .eq('event_id', eventId)
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map(row => ({
        ...row,
        recipe_title: row.recipes?.title ?? '',
        recipe_servings: row.recipes?.servings ?? 0,
      }))
    },
  })

  const updateServingsMutation = useMutation({
    mutationFn: async ({ id, servings_override }: { id: string; servings_override: number }) => {
      const { error } = await supabase
        .from('event_recipes')
        .update({ servings_override })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-recipes', eventId] }),
  })

  const toggleDessertMutation = useMutation({
    mutationFn: async ({ id, is_dessert }: { id: string; is_dessert: boolean }) => {
      const { error } = await supabase.from('event_recipes').update({ is_dessert }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-recipes', eventId] }),
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('event_recipes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-recipes', eventId] }),
    onError: () => toast.error(t('recipes.removeError')),
  })

  const handleGenerateList = async () => {
    if (!user) return
    setGeneratingList(true)
    try {
      const listName = t('shopping.listName', { eventName: eventTitle })
      await generateShoppingList(eventId, eventTitle, eventRecipes, user.id, listName)
      queryClient.invalidateQueries({ queryKey: ['event-shopping-lists', eventId] })
      toast.success(t('recipes.listGenerated'))
    } catch {
      toast.error(t('recipes.listGenerateError'))
    } finally {
      setGeneratingList(false)
    }
  }

  const attachedIds = new Set(eventRecipes.map(er => er.recipe_id))
  const mainCourses = eventRecipes.filter(er => !er.is_dessert)
  const desserts = eventRecipes.filter(er => er.is_dessert)

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
        {eventRecipes.length > 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('recipes.recipeCount', { count: eventRecipes.length })}
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('recipes.empty')}</p>
        )}

        {isOwner && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            {t('recipes.attach')}
          </button>
        )}
      </div>

      {/* Main courses */}
      {mainCourses.length > 0 && (
        <RecipeGroup
          title={t('recipes.mainCourses')}
          items={mainCourses}
          isOwner={isOwner}
          onUpdateServings={(id, servings) =>
            updateServingsMutation.mutate({ id, servings_override: servings })
          }
          onToggleDessert={(id, val) => toggleDessertMutation.mutate({ id, is_dessert: val })}
          onRemove={id => removeMutation.mutate(id)}
        />
      )}

      {/* Desserts */}
      {desserts.length > 0 && (
        <RecipeGroup
          title={t('recipes.desserts')}
          items={desserts}
          isOwner={isOwner}
          onUpdateServings={(id, servings) =>
            updateServingsMutation.mutate({ id, servings_override: servings })
          }
          onToggleDessert={(id, val) => toggleDessertMutation.mutate({ id, is_dessert: val })}
          onRemove={id => removeMutation.mutate(id)}
        />
      )}

      {/* Empty icon */}
      {eventRecipes.length === 0 && (
        <div className="flex justify-center py-6">
          <UtensilsCrossed className="h-10 w-10 text-gray-200 dark:text-gray-700" />
        </div>
      )}

      {/* Generate shopping list */}
      {eventRecipes.length > 0 && isOwner && (
        <button
          onClick={handleGenerateList}
          disabled={generatingList}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-purple-300 py-3 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/10"
        >
          {generatingList ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingBasket className="h-4 w-4" />
          )}
          {t('shopping.generateList')}
        </button>
      )}

      {showAdd && (
        <AddRecipeSheet
          eventId={eventId}
          totalPeople={totalPeople}
          attachedIds={attachedIds}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}

// ─── Recipe group ─────────────────────────────────────────────────────────────

interface GroupProps {
  title: string
  items: EventRecipeWithTitle[]
  isOwner: boolean
  onUpdateServings: (id: string, servings: number) => void
  onToggleDessert: (id: string, val: boolean) => void
  onRemove: (id: string) => void
}

function RecipeGroup({
  title,
  items,
  isOwner,
  onUpdateServings,
  onToggleDessert,
  onRemove,
}: GroupProps) {
  const { t } = useTranslation('events')

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {title}
      </p>
      {items.map(er => (
        <div key={er.id} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {er.recipe_title}
              </p>
              {/* Servings inline edit */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('recipes.servings')}:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onUpdateServings(
                        er.id,
                        Math.max(1, (er.servings_override ?? er.recipe_servings) - 1)
                      )
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    −
                  </button>
                  <span className="min-w-[1.5rem] text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {er.servings_override ?? er.recipe_servings}
                  </span>
                  <button
                    onClick={() =>
                      onUpdateServings(er.id, (er.servings_override ?? er.recipe_servings) + 1)
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {/* Dessert toggle */}
              <button
                onClick={() => onToggleDessert(er.id, !er.is_dessert)}
                title={t('recipes.markDessert')}
                className={`rounded-lg p-1.5 transition ${
                  er.is_dessert
                    ? 'text-pink-500'
                    : 'text-gray-300 hover:text-pink-400 dark:text-gray-600'
                }`}
              >
                <Cake className="h-4 w-4" />
              </button>
              {/* Remove */}
              {isOwner && (
                <button
                  onClick={() => onRemove(er.id)}
                  className="rounded-lg p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
