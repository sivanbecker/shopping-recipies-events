import { describe, it, expect } from 'vitest'

// ─── Stage 5: Ingredient quantity scaling ──────────────────────────────────────
// Mirrors RecipeDetailPage's scalingFactor = servings / recipe.servings,
// applied as: displayedQty = ingredient.quantity * scalingFactor

function scaleQty(qty: number, baseServings: number, targetServings: number): number {
  return qty * (targetServings / baseServings)
}

describe('ingredient quantity scaling', () => {
  it('doubles quantity when servings double', () => {
    expect(scaleQty(400, 4, 8)).toBe(800)
  })

  it('halves quantity when servings halve', () => {
    expect(scaleQty(400, 4, 2)).toBe(200)
  })

  it('leaves quantity unchanged when servings are the same', () => {
    expect(scaleQty(250, 4, 4)).toBe(250)
  })

  it('scales down to a single serving', () => {
    expect(scaleQty(300, 4, 1)).toBe(75)
  })

  it('produces fractional results for uneven scaling', () => {
    expect(scaleQty(1, 4, 3)).toBeCloseTo(0.75)
  })

  it('scales up correctly from 2 to 5 servings', () => {
    expect(scaleQty(200, 2, 5)).toBe(500)
  })
})

// ─── Stage 5: "Add all to list" upsert logic ──────────────────────────────────
// Mirrors the upsert loop in RecipeDetailPage's addItemsMutation:
//   - If an unchecked item for the same product exists → UPDATE (bump qty)
//   - Otherwise → INSERT new item

interface MockListItem {
  id: string
  product_id: string
  is_checked: boolean
  quantity: number
}

type UpsertAction = { action: 'update'; id: string; newQty: number } | { action: 'insert' }

function resolveUpsertAction(
  existingItems: MockListItem[],
  productId: string,
  addQty: number
): UpsertAction {
  const existing = existingItems.find(i => i.product_id === productId && !i.is_checked)
  if (existing) {
    return { action: 'update', id: existing.id, newQty: Number(existing.quantity) + addQty }
  }
  return { action: 'insert' }
}

describe('"add all to list" upsert logic', () => {
  const listItems: MockListItem[] = [
    { id: 'li-1', product_id: 'flour', is_checked: false, quantity: 2 },
    { id: 'li-2', product_id: 'eggs', is_checked: true, quantity: 6 },
  ]

  it('merges quantity when product already exists unchecked in the list', () => {
    expect(resolveUpsertAction(listItems, 'flour', 3)).toEqual({
      action: 'update',
      id: 'li-1',
      newQty: 5,
    })
  })

  it('inserts new item when product is not in the list at all', () => {
    expect(resolveUpsertAction(listItems, 'sugar', 1)).toEqual({ action: 'insert' })
  })

  it('inserts new item when matching product is checked (treat as not present)', () => {
    expect(resolveUpsertAction(listItems, 'eggs', 12)).toEqual({ action: 'insert' })
  })

  it('bumped quantity is correct for decimal source quantities', () => {
    const items: MockListItem[] = [{ id: 'x', product_id: 'oil', is_checked: false, quantity: 0.5 }]
    const result = resolveUpsertAction(items, 'oil', 0.25)
    expect(result).toEqual({ action: 'update', id: 'x', newQty: 0.75 })
  })
})
