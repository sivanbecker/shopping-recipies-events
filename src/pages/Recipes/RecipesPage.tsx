import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Flame,
  ChefHat,
  Circle,
  Square,
  Zap,
  Wind,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { supabase } from '@/lib/supabase'
import type { Recipe } from '@/types'

const TOOL_ICONS: Record<string, React.ReactNode> = {
  oven: <Flame className="h-4 w-4 text-orange-500" />,
  stovetop: <Flame className="h-4 w-4 text-red-500" />,
  pot: <ChefHat className="h-4 w-4 text-blue-500" />,
  pan: <Circle className="h-4 w-4 text-green-500" />,
  bakingTray: <Square className="h-4 w-4 text-purple-500" />,
  blender: <Zap className="h-4 w-4 text-yellow-500" />,
  mixer: <Wind className="h-4 w-4 text-pink-500" />,
}

function RecipeCard({
  recipe,
  onEdit,
  onDelete,
  isOwner,
  toolLabel,
}: {
  recipe: Recipe
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  isOwner: boolean
  toolLabel: (key: string) => string
}) {
  const { t } = useTranslation('recipes')

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{recipe.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {t('servings')}: {recipe.servings}
            </span>
            {recipe.prep_time_minutes && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {recipe.prep_time_minutes} {t('minutes')}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${recipe.is_shared ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
            >
              {recipe.is_shared ? t('shared') : t('personal')}
            </span>
          </div>

          {recipe.tools && recipe.tools.length > 0 && (
            <div className="mt-3 flex gap-2">
              {recipe.tools.map(tool => (
                <div key={tool} title={toolLabel(tool)} className="flex items-center">
                  {TOOL_ICONS[tool]}
                </div>
              ))}
            </div>
          )}
        </div>

        {isOwner && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => onEdit(recipe.id)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              title={t('edit')}
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(recipe.id)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
              title={t('delete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('confirmDelete')}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('confirmDeleteHint')}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
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

export default function RecipesPage() {
  const { t, i18n } = useTranslation('recipes')
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { t: tCommon } = useTranslation()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Recipe[]
    },
    enabled: !!user,
  })

  const { data: dbTools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tools').select('*').order('label_he')
      if (error) throw error
      return data as { id: string; key: string; label_he: string; label_en: string }[]
    },
  })

  const toolLabel = (key: string) => {
    const tool = dbTools.find(t => t.key === key)
    if (!tool) return key
    return i18n.language.startsWith('he') ? tool.label_he : tool.label_en
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      toast.success(tCommon('status.deleted'))
      setDeleteId(null)
    },
    onError: () => {
      toast.error(tCommon('status.error'))
    },
  })

  const filteredRecipes = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return recipes.filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(q)
      const matchesTool = !selectedTool || recipe.tools?.includes(selectedTool)
      return matchesSearch && matchesTool
    })
  }, [recipes, debouncedSearch, selectedTool])

  const allTools = useMemo(
    () => Array.from(new Set(recipes.flatMap(r => r.tools || []))).sort(),
    [recipes]
  )

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Search bar */}
      <div className="sticky top-0 bg-white dark:bg-gray-950">
        <input
          type="search"
          placeholder={t('search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
        />

        {/* Tool filters */}
        {allTools.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedTool(null)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                !selectedTool
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {tCommon('actions.all')}
            </button>
            {allTools.map(tool => (
              <button
                key={tool}
                onClick={() => setSelectedTool(selectedTool === tool ? null : tool)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  selectedTool === tool
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {toolLabel(tool)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
      ) : filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <BookOpen className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {search || selectedTool ? t('noMatch') : t('empty')}
          </h2>
          {!search && !selectedTool && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('emptyHint')}</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              onClick={() => navigate(`/recipes/${recipe.id}`)}
              className="cursor-pointer"
            >
              <RecipeCard
                recipe={recipe}
                isOwner={recipe.owner_id === user?.id}
                toolLabel={toolLabel}
                onEdit={id => {
                  navigate(`/recipes/${id}/edit`)
                }}
                onDelete={id => {
                  setDeleteId(id)
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/recipes/new')}
        className="fixed bottom-20 end-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 shadow-lg hover:bg-brand-600 active:scale-95 transition-transform"
        title={t('new')}
      >
        <Plus className="h-6 w-6 text-white" />
      </button>

      {/* Delete confirmation dialog */}
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId)
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
