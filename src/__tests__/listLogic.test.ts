import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

// ─── Stage 3: Progress bar percentage ─────────────────────────────────────────
// Mirrors ProgressBar's pct formula in ListDetailPage.tsx

function progressPct(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

describe('progressPct', () => {
  it('returns 0 when list is empty (total = 0)', () => {
    expect(progressPct(0, 0)).toBe(0)
  })

  it('returns 0 when no items are checked', () => {
    expect(progressPct(0, 5)).toBe(0)
  })

  it('returns 100 when all items are checked', () => {
    expect(progressPct(5, 5)).toBe(100)
  })

  it('returns correct percentage for partial progress', () => {
    expect(progressPct(3, 10)).toBe(30)
  })

  it('rounds to nearest integer', () => {
    expect(progressPct(1, 3)).toBe(33) // 33.33… → 33
    expect(progressPct(2, 3)).toBe(67) // 66.67… → 67
  })
})

// ─── Stage 3: AddItemSheet upsert decision ─────────────────────────────────────
// Logic from AddItemSheet.upsertMutation in ListDetailPage.tsx:
//   find existing unchecked item → UPDATE (bump qty), else INSERT

interface MockItem {
  id: string
  product_id: string
  is_checked: boolean
  quantity: number
}

function findExistingUnchecked(items: MockItem[], productId: string): MockItem | undefined {
  return items.find(i => i.product_id === productId && !i.is_checked)
}

describe('upsert decision (AddItemSheet)', () => {
  const items: MockItem[] = [
    { id: 'item-1', product_id: 'prod-A', is_checked: false, quantity: 2 },
    { id: 'item-2', product_id: 'prod-B', is_checked: true, quantity: 1 },
    { id: 'item-3', product_id: 'prod-C', is_checked: false, quantity: 3 },
  ]

  it('finds existing unchecked item — triggers UPDATE path', () => {
    const existing = findExistingUnchecked(items, 'prod-A')
    expect(existing).toBeDefined()
    expect(existing?.id).toBe('item-1')
  })

  it('ignores checked items — returns undefined so a new item is inserted', () => {
    expect(findExistingUnchecked(items, 'prod-B')).toBeUndefined()
  })

  it('returns undefined for unknown product — triggers INSERT path', () => {
    expect(findExistingUnchecked(items, 'prod-X')).toBeUndefined()
  })

  it('calculates bumped quantity correctly', () => {
    const existing = findExistingUnchecked(items, 'prod-A')!
    const addQty = 4
    expect(Number(existing.quantity) + addQty).toBe(6)
  })
})

// ─── Stage 3: Clone list — items mapping ──────────────────────────────────────
// Logic from cloneMutation in ListDetailPage.tsx:
//   items.map(item => ({ ...item fields, list_id: newList.id, is_checked: false, added_by: user.id }))

interface MockSourceItem {
  id: string
  product_id: string
  quantity: number
  unit_id: string | null
  is_checked: boolean
  note: string | null
  sort_order: number | null
}

function buildCloneItems(items: MockSourceItem[], newListId: string, userId: string) {
  return items.map(item => ({
    list_id: newListId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_id: item.unit_id,
    note: item.note,
    sort_order: item.sort_order,
    added_by: userId,
    is_checked: false,
  }))
}

describe('clone list items', () => {
  const sourceItems: MockSourceItem[] = [
    {
      id: 'i1',
      product_id: 'p1',
      quantity: 3,
      unit_id: 'u1',
      is_checked: true,
      note: 'note',
      sort_order: 1,
    },
    {
      id: 'i2',
      product_id: 'p2',
      quantity: 1.5,
      unit_id: null,
      is_checked: false,
      note: null,
      sort_order: 2,
    },
  ]

  it('all cloned items have is_checked: false regardless of source', () => {
    const cloned = buildCloneItems(sourceItems, 'new-list', 'user-1')
    expect(cloned.every(i => i.is_checked === false)).toBe(true)
  })

  it('preserves original quantities', () => {
    const cloned = buildCloneItems(sourceItems, 'new-list', 'user-1')
    expect(cloned[0].quantity).toBe(3)
    expect(cloned[1].quantity).toBe(1.5)
  })

  it('assigns new list_id to every item', () => {
    const cloned = buildCloneItems(sourceItems, 'new-list', 'user-1')
    expect(cloned.every(i => i.list_id === 'new-list')).toBe(true)
  })

  it('sets added_by to the current user', () => {
    const cloned = buildCloneItems(sourceItems, 'new-list', 'user-42')
    expect(cloned.every(i => i.added_by === 'user-42')).toBe(true)
  })
})

// ─── Stage 4: Realtime cache — shopping_items specific ────────────────────────
// These tests verify behavior using the actual shopping_items query key format,
// going beyond the generic shape tests in listDetail.test.tsx.

interface ShoppingItem {
  id: string
  product_id: string
  is_checked: boolean
  quantity: number
}

describe('Realtime cache — shopping_items', () => {
  let queryClient: QueryClient
  const LIST_ID = 'list-123'

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.clearAllMocks()
  })

  function seedItems() {
    const items: ShoppingItem[] = [
      { id: 'a', product_id: 'p1', is_checked: false, quantity: 2 },
      { id: 'b', product_id: 'p2', is_checked: false, quantity: 1 },
      { id: 'c', product_id: 'p3', is_checked: true, quantity: 3 },
    ]
    queryClient.setQueryData(['shopping_items', LIST_ID], items)
    return items
  }

  it('DELETE removes only the targeted item, leaving others untouched', () => {
    seedItems()

    queryClient.setQueryData(['shopping_items', LIST_ID], (old: ShoppingItem[] | undefined) =>
      old?.filter(i => i.id !== 'b')
    )

    const result = queryClient.getQueryData<ShoppingItem[]>(['shopping_items', LIST_ID])
    expect(result).toHaveLength(2)
    expect(result?.find(i => i.id === 'b')).toBeUndefined()
    expect(result?.find(i => i.id === 'a')).toBeDefined()
    expect(result?.find(i => i.id === 'c')).toBeDefined()
  })

  it('is_checked UPDATE patches only the matching item, leaving others unchanged', () => {
    seedItems()

    queryClient.setQueryData(['shopping_items', LIST_ID], (old: ShoppingItem[] | undefined) =>
      old?.map(i => (i.id === 'a' ? { ...i, is_checked: true } : i))
    )

    const result = queryClient.getQueryData<ShoppingItem[]>(['shopping_items', LIST_ID])
    expect(result?.find(i => i.id === 'a')?.is_checked).toBe(true)
    expect(result?.find(i => i.id === 'b')?.is_checked).toBe(false) // unchanged
    expect(result?.find(i => i.id === 'c')?.is_checked).toBe(true) // was already true
  })

  it("does not affect a different list's cache when patching", () => {
    seedItems()
    const otherListItems: ShoppingItem[] = [
      { id: 'x', product_id: 'p9', is_checked: false, quantity: 5 },
    ]
    queryClient.setQueryData(['shopping_items', 'other-list'], otherListItems)

    queryClient.setQueryData(['shopping_items', LIST_ID], (old: ShoppingItem[] | undefined) =>
      old?.filter(i => i.id !== 'a')
    )

    const otherResult = queryClient.getQueryData<ShoppingItem[]>(['shopping_items', 'other-list'])
    expect(otherResult).toHaveLength(1)
    expect(otherResult?.[0].id).toBe('x')
  })
})
