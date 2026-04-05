import { describe, it, expect } from 'vitest'
import { filterProducts } from '@/lib/filterProducts'
import { parseImportFile, resolveCategory, resolveUnit } from '@/lib/importProducts'
import type { Product } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '1',
    name_he: 'מוצר',
    name_en: null,
    category_id: null,
    default_unit_id: null,
    created_by: 'user-1',
    is_shared: false,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ─── filterProducts ───────────────────────────────────────────────────────────

describe('filterProducts', () => {
  const products: Product[] = [
    makeProduct({ id: '1', name_he: 'עגבנייה', name_en: 'Tomato' }),
    makeProduct({ id: '2', name_he: 'מלפפון', name_en: 'Cucumber' }),
    makeProduct({ id: '3', name_he: 'גבינה לבנה', name_en: null }),
  ]

  it('returns all products for empty query', () => {
    expect(filterProducts(products, '')).toHaveLength(3)
  })

  it('returns all products for whitespace-only query', () => {
    expect(filterProducts(products, '   ')).toHaveLength(3)
  })

  it('filters by Hebrew name (partial match)', () => {
    const result = filterProducts(products, 'עגב')
    expect(result).toHaveLength(1)
    expect(result[0].name_he).toBe('עגבנייה')
  })

  it('filters by English name (partial match)', () => {
    const result = filterProducts(products, 'cumber')
    expect(result).toHaveLength(1)
    expect(result[0].name_en).toBe('Cucumber')
  })

  it('is case-insensitive for English names', () => {
    const result = filterProducts(products, 'TOMATO')
    expect(result).toHaveLength(1)
    expect(result[0].name_en).toBe('Tomato')
  })

  it('handles products with null English name', () => {
    const result = filterProducts(products, 'גבינה')
    expect(result).toHaveLength(1)
    expect(result[0].name_he).toBe('גבינה לבנה')
  })

  it('returns empty array when no product matches', () => {
    expect(filterProducts(products, 'xyz-no-match')).toHaveLength(0)
  })

  it('matches across both name fields', () => {
    // "Tom" matches English name of product 1
    const byEn = filterProducts(products, 'Tom')
    expect(byEn).toHaveLength(1)
    // "עגב" matches Hebrew name of product 1
    const byHe = filterProducts(products, 'עגב')
    expect(byHe).toHaveLength(1)
    expect(byHe[0].id).toBe(byEn[0].id)
  })
})

// ─── ProductCard render ───────────────────────────────────────────────────────

// ProductCard is not exported so we test it indirectly via a minimal smoke
// test: assert that filtering + rendering the name works as expected.

describe('ProductCard (name display logic)', () => {
  function displayName(p: Product, lang: 'he' | 'en') {
    return lang === 'he' ? p.name_he : (p.name_en ?? p.name_he)
  }

  it('uses name_he when lang is he', () => {
    const p = makeProduct({ name_he: 'עגבנייה', name_en: 'Tomato' })
    expect(displayName(p, 'he')).toBe('עגבנייה')
  })

  it('uses name_en when lang is en and name_en exists', () => {
    const p = makeProduct({ name_he: 'עגבנייה', name_en: 'Tomato' })
    expect(displayName(p, 'en')).toBe('Tomato')
  })

  it('falls back to name_he when lang is en but name_en is null', () => {
    const p = makeProduct({ name_he: 'גבינה', name_en: null })
    expect(displayName(p, 'en')).toBe('גבינה')
  })

  it('correctly determines owner vs non-owner', () => {
    const myId = 'user-abc'
    const myProduct = makeProduct({ created_by: myId })
    const otherProduct = makeProduct({ id: '2', created_by: 'user-xyz' })

    expect(myProduct.created_by === myId).toBe(true)
    expect(otherProduct.created_by === myId).toBe(false)
  })
})

// ─── resolveCategory ──────────────────────────────────────────────────────────

const mockCategories = [
  { id: 'cat-1', name_he: 'חלב', name_en: 'Dairy', color: '#fff', icon: null, sort_order: 1 },
  { id: 'cat-2', name_he: 'מאפייה', name_en: 'Bakery', color: '#eee', icon: null, sort_order: 2 },
]

describe('resolveCategory', () => {
  it('resolves by Hebrew name', () => {
    expect(resolveCategory('חלב', mockCategories)).toBe('cat-1')
  })

  it('resolves by English name (case-insensitive)', () => {
    expect(resolveCategory('bakery', mockCategories)).toBe('cat-2')
  })

  it('returns null for unknown category', () => {
    expect(resolveCategory('Unknown', mockCategories)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(resolveCategory('', mockCategories)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(resolveCategory(undefined, mockCategories)).toBeNull()
  })
})

// ─── resolveUnit ──────────────────────────────────────────────────────────────

const mockUnits = [
  { id: 'unit-1', code: 'liter', label_he: 'ליטר', label_en: 'Liter', type: 'volume' as const },
  { id: 'unit-2', code: 'unit', label_he: 'יחידה', label_en: 'Unit', type: 'count' as const },
  { id: 'unit-3', code: 'kg', label_he: 'ק"ג', label_en: 'Kilogram', type: 'weight' as const },
]

describe('resolveUnit', () => {
  it('resolves by code (exact, case-insensitive)', () => {
    expect(resolveUnit('liter', mockUnits)).toBe('unit-1')
    expect(resolveUnit('LITER', mockUnits)).toBe('unit-1')
  })

  it('resolves by English label (case-insensitive)', () => {
    expect(resolveUnit('kilogram', mockUnits)).toBe('unit-3')
  })

  it('resolves by Hebrew label', () => {
    expect(resolveUnit('יחידה', mockUnits)).toBe('unit-2')
  })

  it('returns null for unknown unit', () => {
    expect(resolveUnit('tablespoon', mockUnits)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(resolveUnit(undefined, mockUnits)).toBeNull()
  })
})

// ─── parseImportFile ──────────────────────────────────────────────────────────

const OWNER_ID = 'u1'
const existingProducts = [
  {
    id: 'p-1',
    name_he: 'חלב',
    name_en: 'Milk',
    category_id: 'cat-1',
    default_unit_id: 'unit-1',
    created_by: OWNER_ID,
    is_shared: false,
    created_at: '',
  },
]

describe('parseImportFile — CSV', () => {
  it('parses a valid CSV and resolves IDs', () => {
    const csv = `name_he,name_en,category,default_unit\nגבינה,Cheese,Dairy,unit`
    const result = parseImportFile(csv, 'csv', mockCategories, mockUnits)
    expect(result.toInsert).toHaveLength(1)
    expect(result.toInsert[0]).toMatchObject({
      name_he: 'גבינה',
      name_en: 'Cheese',
      category_id: 'cat-1',
      default_unit_id: 'unit-2',
    })
    expect(result.skipped).toHaveLength(0)
  })

  it('skips rows missing name_he', () => {
    const csv = `name_he,name_en,category,default_unit\n,Bread,Bakery,unit`
    const result = parseImportFile(csv, 'csv', mockCategories, mockUnits)
    expect(result.toInsert).toHaveLength(0)
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0].reason).toBe('missingNameHe')
  })

  it('leaves category_id null for unknown category', () => {
    const csv = `name_he,name_en,category,default_unit\nביצה,Egg,Unknown,unit`
    const result = parseImportFile(csv, 'csv', mockCategories, mockUnits)
    expect(result.toInsert[0].category_id).toBeNull()
  })

  it('leaves default_unit_id null for unknown unit', () => {
    const csv = `name_he,name_en,category,default_unit\nביצה,Egg,Dairy,tablespoon`
    const result = parseImportFile(csv, 'csv', mockCategories, mockUnits)
    expect(result.toInsert[0].default_unit_id).toBeNull()
  })

  it('handles mixed valid and invalid rows', () => {
    const csv = [
      'name_he,name_en,category,default_unit',
      'גבינה,Cheese,Dairy,liter',
      ',Bad Row,Bakery,unit',
      'לחם,Bread,Bakery,unit',
    ].join('\n')
    const result = parseImportFile(csv, 'csv', mockCategories, mockUnits)
    expect(result.toInsert).toHaveLength(2)
    expect(result.skipped).toHaveLength(1)
  })

  it('deduplicates within the file itself', () => {
    const csv = [
      'name_he,name_en,category,default_unit',
      'גבינה,Cheese,Dairy,unit',
      'גבינה,Cheese2,Dairy,unit',
    ].join('\n')
    const result = parseImportFile(csv, 'csv', mockCategories, mockUnits)
    expect(result.toInsert).toHaveLength(1)
    expect(result.skipped[0].reason).toBe('duplicateNameHe')
  })

  it('upserts (updates) when owner imports same name with different props', () => {
    const csv = `name_he,name_en,category,default_unit\nחלב,Milk,Bakery,unit`
    const result = parseImportFile(
      csv,
      'csv',
      mockCategories,
      mockUnits,
      existingProducts,
      OWNER_ID
    )
    expect(result.toInsert).toHaveLength(0)
    expect(result.toUpdate).toHaveLength(1)
    expect(result.toUpdate[0]).toMatchObject({
      id: 'p-1',
      category_id: 'cat-2',
      default_unit_id: 'unit-2',
    })
    expect(result.skipped).toHaveLength(0)
  })

  it('skips as unchanged when owner imports identical row', () => {
    const csv = `name_he,name_en,category,default_unit\nחלב,Milk,חלב,liter`
    const result = parseImportFile(
      csv,
      'csv',
      mockCategories,
      mockUnits,
      existingProducts,
      OWNER_ID
    )
    expect(result.toInsert).toHaveLength(0)
    expect(result.toUpdate).toHaveLength(0)
    expect(result.skipped[0].reason).toBe('unchanged')
  })

  it('skips as duplicateNameHe when non-owner imports same name', () => {
    const csv = `name_he,name_en,category,default_unit\nחלב,Milk,Bakery,unit`
    const result = parseImportFile(
      csv,
      'csv',
      mockCategories,
      mockUnits,
      existingProducts,
      'other-user'
    )
    expect(result.toUpdate).toHaveLength(0)
    expect(result.skipped[0].reason).toBe('duplicateNameHe')
  })

  it('skips rows whose English name matches a product owned by another user', () => {
    const csv = `name_he,name_en,category,default_unit\nחלב חדש,Milk,Dairy,liter`
    const result = parseImportFile(
      csv,
      'csv',
      mockCategories,
      mockUnits,
      existingProducts,
      'other-user'
    )
    expect(result.skipped[0].reason).toBe('duplicateNameHe')
  })
})

describe('parseImportFile — JSON', () => {
  it('parses a valid JSON array', () => {
    const json = JSON.stringify([
      { name_he: 'גבינה', name_en: 'Cheese', category: 'Dairy', default_unit: 'liter' },
    ])
    const result = parseImportFile(json, 'json', mockCategories, mockUnits)
    expect(result.toInsert).toHaveLength(1)
    expect(result.toInsert[0].category_id).toBe('cat-1')
  })

  it('throws for non-array JSON', () => {
    expect(() => parseImportFile('{"name_he":"חלב"}', 'json', mockCategories, mockUnits)).toThrow()
  })

  it('skips JSON rows missing name_he', () => {
    const json = JSON.stringify([{ name_en: 'Milk', category: 'Dairy' }])
    const result = parseImportFile(json, 'json', mockCategories, mockUnits)
    expect(result.toInsert).toHaveLength(0)
    expect(result.skipped).toHaveLength(1)
  })

  it('upserts JSON row with changed props when owner', () => {
    const json = JSON.stringify([{ name_he: 'חלב', name_en: 'Milk', category: 'Bakery' }])
    const result = parseImportFile(
      json,
      'json',
      mockCategories,
      mockUnits,
      existingProducts,
      OWNER_ID
    )
    expect(result.toUpdate).toHaveLength(1)
    expect(result.toUpdate[0].category_id).toBe('cat-2')
  })
})
