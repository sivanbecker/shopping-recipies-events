import { createElement } from 'react'
import { toast } from 'sonner'
import { supabase } from './supabase'
import { UndoToastContent, DURATION_MS } from '@/components/UndoToastContent'
import type { ShoppingItem } from '@/types'

export type UndoableAction =
  | { type: 'item_add'; listId: string; itemId: string; at: string }
  | { type: 'item_remove'; listId: string; snapshot: ShoppingItemSnapshot }
  | {
      type: 'item_quantity'
      itemId: string
      before: number
      after: number
      updatedAt: string
    }
  | { type: 'item_toggle'; itemId: string; before: boolean; updatedAt: string }
  | {
      type: 'item_edit'
      itemId: string
      before: { quantity: number; unitId: string | null }
      updatedAt: string
    }

export type ShoppingItemSnapshot = Pick<
  ShoppingItem,
  | 'list_id'
  | 'product_id'
  | 'quantity'
  | 'unit_id'
  | 'is_checked'
  | 'added_by'
  | 'note'
  | 'sort_order'
  | 'recipe_id'
>

interface UndoOptions {
  label: string
  undoLabel: string
  staleMessage: string
  onUndone?: () => void
}

/**
 * Show an action-capable sonner toast. Clicking "Undo" reverses the action
 * unless the row has been modified by someone else in the meantime, in which
 * case we surface a friendly message instead of clobbering their write.
 */
export function showUndoToast(action: UndoableAction, opts: UndoOptions): void {
  toast.custom(
    id =>
      createElement(UndoToastContent, {
        toastId: id,
        label: opts.label,
        undoLabel: opts.undoLabel,
        onUndo: async () => {
          const ok = await reverseAction(action)
          if (ok) opts.onUndone?.()
          else toast.info(opts.staleMessage)
        },
      }),
    { duration: DURATION_MS }
  )
}

async function reverseAction(action: UndoableAction): Promise<boolean> {
  switch (action.type) {
    case 'item_add': {
      const { error } = await supabase.from('shopping_items').delete().eq('id', action.itemId)
      if (error) throw error
      return true
    }

    case 'item_remove': {
      const { error } = await supabase.from('shopping_items').insert(action.snapshot)
      if (error) throw error
      return true
    }

    case 'item_quantity': {
      const fresh = await fetchFreshness(action.itemId)
      if (!fresh || fresh.updated_at !== action.updatedAt) return false
      const { error } = await supabase
        .from('shopping_items')
        .update({ quantity: action.before })
        .eq('id', action.itemId)
      if (error) throw error
      return true
    }

    case 'item_toggle': {
      const fresh = await fetchFreshness(action.itemId)
      if (!fresh || fresh.updated_at !== action.updatedAt) return false
      const { error } = await supabase
        .from('shopping_items')
        .update({ is_checked: action.before })
        .eq('id', action.itemId)
      if (error) throw error
      return true
    }

    case 'item_edit': {
      const fresh = await fetchFreshness(action.itemId)
      if (!fresh || fresh.updated_at !== action.updatedAt) return false
      const { error } = await supabase
        .from('shopping_items')
        .update({ quantity: action.before.quantity, unit_id: action.before.unitId })
        .eq('id', action.itemId)
      if (error) throw error
      return true
    }
  }
}

async function fetchFreshness(itemId: string): Promise<{ updated_at: string } | null> {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('updated_at')
    .eq('id', itemId)
    .maybeSingle()
  if (error) return null
  return data
}
