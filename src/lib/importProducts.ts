import { z } from 'zod'
import type { Category, UnitType, Product } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidRow {
  name_he: string
  name_en: string | null
  category_id: string | null
  default_unit_id: string | null
}

export interface SkippedRow {
  rowIndex: number
  raw: Record<string, string>
  reason: string
}

export interface ParseResult {
  valid: ValidRow[]
  skipped: SkippedRow[]
}

// ─── Zod row schema ───────────────────────────────────────────────────────────

const rawRowSchema = z.object({
  name_he: z.string().min(1),
  name_en: z.string().optional(),
  category: z.string().optional(),
  default_unit: z.string().optional(),
})

// ─── Resolvers ────────────────────────────────────────────────────────────────

export function resolveCategory(name: string | undefined, categories: Category[]): string | null {
  if (!name?.trim()) return null
  const lower = name.trim().toLowerCase()
  return (
    categories.find(
      c => c.name_he === name.trim() || c.name_en?.toLowerCase() === lower
    )?.id ?? null
  )
}

export function resolveUnit(code: string | undefined, unitTypes: UnitType[]): string | null {
  if (!code?.trim()) return null
  const lower = code.trim().toLowerCase()
  return (
    unitTypes.find(
      u =>
        u.code.toLowerCase() === lower ||
        u.label_en.toLowerCase() === lower ||
        u.label_he === code.trim()
    )?.id ?? null
  )
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

/** Splits a CSV line respecting double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  fields.push(cur.trim())
  return fields
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? ''
    })
    rows.push(row)
  }

  return rows
}

// ─── Main parse function ──────────────────────────────────────────────────────

export function parseImportFile(
  text: string,
  fileType: 'csv' | 'json',
  categories: Category[],
  unitTypes: UnitType[],
  existingProducts: Product[] = []
): ParseResult {
  let rawRows: Record<string, string>[]

  if (fileType === 'csv') {
    rawRows = parseCsv(text)
  } else {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error('JSON must be an array')
    rawRows = parsed.map((item: unknown) => {
      if (typeof item !== 'object' || item === null)
        throw new Error('Each JSON element must be an object')
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>).map(([k, v]) => [k, String(v ?? '')])
      )
    })
  }

  // Seed seen-sets with existing products so imports don't duplicate them
  const seenHe = new Set(existingProducts.map(p => p.name_he.trim().toLowerCase()))
  const seenEn = new Set(
    existingProducts.flatMap(p => (p.name_en ? [p.name_en.trim().toLowerCase()] : []))
  )

  const valid: ValidRow[] = []
  const skipped: SkippedRow[] = []

  rawRows.forEach((raw, idx) => {
    const result = rawRowSchema.safeParse(raw)
    if (!result.success) {
      skipped.push({ rowIndex: idx + 1, raw, reason: 'missingNameHe' })
      return
    }

    const { name_he, name_en, category, default_unit } = result.data
    const heKey = name_he.trim().toLowerCase()
    const enKey = name_en?.trim().toLowerCase()

    if (seenHe.has(heKey)) {
      skipped.push({ rowIndex: idx + 1, raw, reason: 'duplicateNameHe' })
      return
    }
    if (enKey && seenEn.has(enKey)) {
      skipped.push({ rowIndex: idx + 1, raw, reason: 'duplicateNameEn' })
      return
    }

    // Mark as seen so later rows in the same file are also deduplicated
    seenHe.add(heKey)
    if (enKey) seenEn.add(enKey)

    valid.push({
      name_he,
      name_en: name_en?.trim() || null,
      category_id: resolveCategory(category, categories),
      default_unit_id: resolveUnit(default_unit, unitTypes),
    })
  })

  return { valid, skipped }
}

// ─── Download skipped rows as CSV ─────────────────────────────────────────────

export function skippedRowsToCsv(skipped: SkippedRow[]): string {
  if (skipped.length === 0) return ''
  const headers = ['row', 'name_he', 'name_en', 'category', 'default_unit', 'reason']
  const lines = [
    headers.join(','),
    ...skipped.map(s =>
      [
        s.rowIndex,
        s.raw.name_he ?? '',
        s.raw.name_en ?? '',
        s.raw.category ?? '',
        s.raw.default_unit ?? '',
        s.reason,
      ]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ]
  return lines.join('\n')
}
